"""Withdrawal declarations + Stripe cancel/exact-refund processing (Postgres SoT)."""

from __future__ import annotations

import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from entitlements.feature_keys import ACADEMY_PREMIUM
from mail import (
    MSG_WITHDRAWAL_CONFIRM_LINK,
    MSG_WITHDRAWAL_RECEIPT,
    MSG_WITHDRAWAL_REFUND,
    SUBJECT_WITHDRAWAL_RECEIPT,
    SUBJECT_WITHDRAWAL_REFUND,
    build_withdrawal_confirm_link_bodies,
    build_withdrawal_receipt_bodies,
    build_withdrawal_refund_bodies,
    mail_configured,
    send_transactional_mail,
    withdrawal_friendly_refs,
)
from repositories.wiring import get_repos

from . import settings
from .contract_payment import resolve_refund_target
from .persistence import get_billing_status, get_subscription_by_external_id
from . import withdrawal_store as store

logger = logging.getLogger(__name__)

WITHDRAWAL_WINDOW_DAYS = 14

# Assumption (documented): checkout rejects a second active subscription; withdrawal
# targets the single active/trialing/past_due subscription for the user (or email match).
ASSUME_ONE_ACTIVE_SUB_PER_USER = True


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def contract_start_for_subscription(sub_row: Dict[str, Any]) -> Optional[datetime]:
    for key in ("contract_started_at", "created_at", "current_period_start"):
        dt = _parse_dt(sub_row.get(key))
        if dt:
            return dt
    raw = sub_row.get("raw") if isinstance(sub_row.get("raw"), dict) else {}
    created = raw.get("created")
    if created is not None:
        try:
            return datetime.fromtimestamp(int(created), tz=timezone.utc)
        except (TypeError, ValueError, OSError):
            pass
    return None


def within_withdrawal_window(start: Optional[datetime], *, now: Optional[datetime] = None) -> bool:
    if start is None:
        return False
    ref = now or _utc_now()
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return ref <= start + timedelta(days=WITHDRAWAL_WINDOW_DAYS)


def _select_primary_subscription(billing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Pick the withdrawable subscription. Documented: at most one active paid sub."""
    rows = billing.get("subscriptions") or []
    for row in rows:
        if str(row.get("status") or "").lower() in ("active", "trialing", "past_due"):
            return row
    return rows[0] if rows else None


def resolve_subscription_for_user(rinq_user_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    billing = get_billing_status(rinq_user_id)
    row = _select_primary_subscription(billing)
    if not row:
        return None, "Kein Abonnement für dieses Konto gefunden."
    sub_id = row.get("external_subscription_id")
    if sub_id:
        enriched = get_subscription_by_external_id(str(sub_id))
        if enriched:
            return {**row, **enriched}, None
    return row, None


def resolve_user_by_customer_email(email: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    if not settings.stripe_configured():
        return None, None, "Stripe is not configured"
    import stripe

    stripe.api_key = settings.stripe_secret_key()
    normalized = email.strip().lower()
    try:
        result = stripe.Customer.list(email=normalized, limit=5)
    except Exception as exc:
        logger.exception("[withdrawal] customer list failed")
        return None, None, f"Kundensuche fehlgeschlagen: {exc}"

    data = list(getattr(result, "data", None) or [])
    if not data:
        return None, None, "Kein Stripe-Kunde mit dieser E-Mail gefunden."

    for customer in data:
        cust_id = customer.get("id")
        cust_email = (customer.get("email") or normalized).strip()
        try:
            subs = stripe.Subscription.list(customer=cust_id, status="all", limit=10)
        except Exception:
            continue
        active = []
        for sub in list(getattr(subs, "data", None) or []):
            meta = sub.get("metadata") or {}
            uid = (meta.get("rinq_user_id") or "").strip()
            status = str(sub.get("status") or "").lower()
            if uid and status in ("active", "trialing", "past_due"):
                active.append((uid, cust_email, str(sub.get("id"))))
        if len(active) == 1:
            return active[0][0], active[0][1], None
        if len(active) > 1:
            return None, None, "Mehrere aktive Abos — bitte eingeloggt widerrufen oder Support kontaktieren."
        # Fall back: any sub with rinq_user_id (historical)
        for sub in list(getattr(subs, "data", None) or []):
            meta = sub.get("metadata") or {}
            uid = (meta.get("rinq_user_id") or "").strip()
            if uid:
                return uid, cust_email, None
    return None, None, "Kein rInQ-Abo zu dieser E-Mail gefunden."


def public_response(row: Dict[str, Any]) -> Dict[str, Any]:
    wid = str(row.get("id") or "")
    contract_ref, withdrawal_ref = withdrawal_friendly_refs(wid)
    return {
        "id": row.get("id"),
        "received_at": row.get("received_at"),
        "status": row.get("status"),
        "refund_status": row.get("refund_status"),
        "email_status": row.get("email_status"),
        "refund_email_status": row.get("refund_email_status"),
        "outside_window": row.get("status") == "outside_window",
        "awaiting_email_confirm": row.get("status") == "awaiting_email_confirm",
        "contact_email": row.get("contact_email"),
        "display_name": row.get("display_name"),
        "contract_ref": contract_ref,
        "withdrawal_ref": withdrawal_ref,
    }


def get_withdrawal(row_id: str, *, path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    # path ignored — Postgres only (JSON deprecated)
    return store.get_withdrawal(row_id)


def record_withdrawal_request(
    *,
    rinq_user_id: str,
    display_name: Optional[str] = None,
    contact_email: Optional[str] = None,
    note: Optional[str] = None,
    require_email_confirm: bool = False,
    public_base_url: Optional[str] = None,
    path: Optional[str] = None,  # deprecated
) -> Dict[str, Any]:
    email = (contact_email or "").strip()
    if not email or "@" not in email:
        raise ValueError("E-Mail ist erforderlich")

    sub, sub_err = resolve_subscription_for_user(rinq_user_id)
    if sub_err and not sub:
        raise ValueError(sub_err)

    sub_id = (sub or {}).get("external_subscription_id")
    if sub_id:
        existing = store.find_active_for_subscription(str(sub_id))
        if existing:
            if existing.get("status") == "awaiting_email_confirm":
                return existing
            if existing.get("status") not in ("outside_window",):
                return process_withdrawal(existing["id"])
            return existing

    start = contract_start_for_subscription(sub or {})
    eligible = within_withdrawal_window(start)
    confirm_token = secrets.token_urlsafe(32) if (require_email_confirm and eligible) else None
    initial_status = (
        "outside_window"
        if not eligible
        else ("awaiting_email_confirm" if require_email_confirm else "received")
    )

    row = store.insert_withdrawal(
        {
            "rinq_user_id": rinq_user_id,
            "display_name": (display_name or "").strip()[:200] or None,
            "contact_email": email[:320],
            "note": (note or "").strip()[:1000] or None,
            "status": initial_status,
            "email_status": "pending",
            "refund_status": "pending" if eligible else "not_applicable",
            "stripe_customer_id": (sub or {}).get("external_customer_id"),
            "stripe_subscription_id": sub_id,
            "stripe_checkout_session_id": (sub or {}).get("checkout_session_id"),
            "stripe_invoice_id": (sub or {}).get("initial_invoice_id"),
            "stripe_payment_intent_id": (sub or {}).get("initial_payment_intent_id"),
            "stripe_charge_id": (sub or {}).get("initial_charge_id"),
            "confirm_token": confirm_token,
            "contract_start_at": start,
            "received_at": _utc_now(),
        }
    )

    if not eligible:
        return row
    if require_email_confirm:
        _send_confirm_email(row, public_base_url=public_base_url)
        return store.get_withdrawal(row["id"]) or row
    return process_withdrawal(row["id"])


def confirm_withdrawal_by_token(token: str, *, path: Optional[str] = None) -> Dict[str, Any]:
    cleaned = (token or "").strip()
    if not cleaned:
        raise ValueError("Bestätigungstoken fehlt")
    match = store.get_withdrawal_by_confirm_token(cleaned)
    if not match:
        raise ValueError("Bestätigung ungültig oder abgelaufen")
    if match.get("status") in ("completed", "outside_window"):
        return match
    store.update_withdrawal(
        match["id"],
        {
            "status": "received",
            "confirm_token": None,
            "confirmed_at": _utc_now(),
        },
    )
    return process_withdrawal(match["id"])


def process_withdrawal(row_id: str, *, path: Optional[str] = None) -> Dict[str, Any]:
    """Receipt mail first → cancel → exact refund → revoke → refund mail. Idempotent."""
    row = store.get_withdrawal(row_id)
    if not row:
        raise ValueError("Widerruf nicht gefunden")
    if row.get("status") in ("completed", "outside_window", "awaiting_email_confirm"):
        return row

    errors: List[str] = list(row.get("errors") or [])
    sub_id = row.get("stripe_subscription_id") or row.get("external_subscription_id")

    # 0) Eingangsbestätigung immediately (before Stripe side effects)
    row = _ensure_receipt_email(row_id, row, errors)

    if not settings.stripe_configured():
        errors.append("Stripe not configured")
        return store.update_withdrawal(
            row_id,
            {"status": "manual_review", "failure_reason": "stripe_not_configured", "errors": errors},
        ) or row

    import stripe

    stripe.api_key = settings.stripe_secret_key()

    # 1) Cancel subscription
    row = store.get_withdrawal(row_id) or row
    if row.get("status") in ("received", "subscription_cancel_pending", "email_pending") and sub_id:
        store.update_withdrawal(row_id, {"status": "subscription_cancel_pending"})
        try:
            stripe.Subscription.delete(str(sub_id))
        except Exception as exc:
            msg = str(exc)
            if "No such subscription" not in msg and "canceled" not in msg.lower():
                errors.append(f"subscription_cancel: {msg}")
                logger.exception(
                    "[withdrawal] cancel failed id=%s step=subscription_cancel sub=%s",
                    row_id,
                    sub_id,
                )
                return store.update_withdrawal(
                    row_id,
                    {
                        "status": "manual_review",
                        "failure_reason": "subscription_cancel_failed",
                        "errors": errors,
                    },
                ) or row

    # 2) Exact refund (no latest-invoice fallback)
    row = store.get_withdrawal(row_id) or row
    if row.get("stripe_refund_id"):
        pass
    else:
        store.update_withdrawal(
            row_id,
            {"status": "refund_pending", "refund_status": "pending", "refund_requested_at": _utc_now()},
        )
        pi, charge, reason = resolve_refund_target(row)
        if reason == "already_refunded":
            pass
        elif reason or (not pi and not charge):
            errors.append(f"refund_target: {reason or 'missing'}")
            logger.error(
                "[withdrawal] ambiguous payment id=%s step=refund_target reason=%s sub=%s",
                row_id,
                reason,
                sub_id,
            )
            return store.update_withdrawal(
                row_id,
                {
                    "status": "manual_review",
                    "refund_status": "manual_review",
                    "failure_reason": reason or "missing_initial_payment_refs",
                    "errors": errors,
                },
            ) or row
        try:
            refund_id = _create_exact_refund(
                withdrawal_id=row_id,
                payment_intent_id=pi,
                charge_id=charge,
            )
            store.update_withdrawal(
                row_id,
                {
                    "stripe_refund_id": refund_id,
                    "refund_status": "succeeded",
                    "refund_completed_at": _utc_now(),
                    "stripe_payment_intent_id": pi or row.get("stripe_payment_intent_id"),
                    "stripe_charge_id": charge or row.get("stripe_charge_id"),
                },
            )
        except Exception as exc:
            errors.append(f"refund: {exc}")
            logger.exception(
                "[withdrawal] refund failed id=%s step=refund pi=%s",
                row_id,
                pi,
            )
            return store.update_withdrawal(
                row_id,
                {
                    "status": "manual_review",
                    "refund_status": "failed",
                    "failure_reason": "refund_failed",
                    "errors": errors,
                },
            ) or row

    # 3) Revoke premium
    row = store.get_withdrawal(row_id) or row
    store.update_withdrawal(row_id, {"status": "premium_revoke_pending"})
    try:
        get_repos().entitlements.revoke_entitlement(row["rinq_user_id"], ACADEMY_PREMIUM)
        store.update_withdrawal(row_id, {"premium_revoked_at": _utc_now()})
    except Exception as exc:
        errors.append(f"revoke: {exc}")
        logger.exception("[withdrawal] revoke failed id=%s step=premium_revoke", row_id)

    # 4) Erstattungsbestätigung only after successful refund
    row = store.get_withdrawal(row_id) or row
    if row.get("stripe_refund_id"):
        row = _ensure_refund_email(row_id, row, errors)
    else:
        store.update_withdrawal(row_id, {"refund_email_status": "not_applicable"})

    row = store.get_withdrawal(row_id) or row
    final = "completed" if row.get("stripe_refund_id") else "manual_review"
    return store.update_withdrawal(row_id, {"status": final, "errors": errors}) or row


def _ensure_receipt_email(row_id: str, row: Dict[str, Any], errors: List[str]) -> Dict[str, Any]:
    if row.get("email_status") == "sent":
        return row
    store.update_withdrawal(row_id, {"status": "email_pending"})
    ok, err = _send_withdrawal_receipt_email(row)
    updated = store.update_withdrawal(
        row_id,
        {
            "email_status": "sent" if ok else "failed",
            "email_sent_at": _utc_now() if ok else None,
            "failure_reason": None if ok else (err or "receipt_email_failed"),
        },
    )
    if not ok:
        errors.append(f"receipt_email: {err}")
        # Receipt failure must not drop the withdrawal — continue processing
        logger.error("[withdrawal] receipt mail failed id=%s err=%s", row_id, err)
    return updated or row


def _ensure_refund_email(row_id: str, row: Dict[str, Any], errors: List[str]) -> Dict[str, Any]:
    if row.get("refund_email_status") == "sent":
        return row
    ok, err = _send_withdrawal_refund_email(row)
    updated = store.update_withdrawal(
        row_id,
        {
            "refund_email_status": "sent" if ok else "failed",
            "refund_email_sent_at": _utc_now() if ok else None,
        },
    )
    if not ok:
        errors.append(f"refund_email: {err}")
        logger.error("[withdrawal] refund mail failed id=%s err=%s", row_id, err)
    return updated or row


def retry_withdrawal_email(row_id: str) -> Dict[str, Any]:
    """Retry receipt and (if refund done) refund confirmation mails."""
    row = store.get_withdrawal(row_id)
    if not row:
        raise ValueError("Widerruf nicht gefunden")
    errors: List[str] = list(row.get("errors") or [])
    if row.get("email_status") != "sent":
        row = _ensure_receipt_email(row_id, row, errors)
    row = store.get_withdrawal(row_id) or row
    if row.get("stripe_refund_id") and row.get("refund_email_status") != "sent":
        row = _ensure_refund_email(row_id, row, errors)
    return store.update_withdrawal(row_id, {"errors": errors}) or row


def retry_withdrawal_processing(row_id: str) -> Dict[str, Any]:
    """Resume cancel/refund/email for manual_review / pending states."""
    row = store.get_withdrawal(row_id)
    if not row:
        raise ValueError("Widerruf nicht gefunden")
    if row.get("status") == "completed":
        return row
    if row.get("status") == "outside_window":
        return row
    if row.get("status") == "awaiting_email_confirm":
        return row
    # Re-enter pipeline from received if stuck
    if row.get("status") == "manual_review":
        store.update_withdrawal(row_id, {"status": "received", "failure_reason": None})
    return process_withdrawal(row_id)


def _create_exact_refund(
    *,
    withdrawal_id: str,
    payment_intent_id: Optional[str],
    charge_id: Optional[str],
) -> str:
    import stripe

    idem = f"withdrawal-refund-{withdrawal_id}"
    kwargs: Dict[str, Any] = {
        "idempotency_key": idem,
        "metadata": {"withdrawal_id": withdrawal_id},
    }
    if payment_intent_id:
        refund = stripe.Refund.create(payment_intent=payment_intent_id, **kwargs)
    elif charge_id:
        refund = stripe.Refund.create(charge=charge_id, **kwargs)
    else:
        raise ValueError("missing_payment_ref")
    rid = str(refund.get("id") or "")
    if not rid:
        raise ValueError("empty_refund_id")
    return rid


def _public_app_base(explicit: Optional[str] = None) -> str:
    if explicit:
        return explicit.rstrip("/")
    base = (
        os.environ.get("ACADEMY_PUBLIC_URL")
        or "https://rinq-tank.de"
    ).rstrip("/")
    return base


def _send_confirm_email(row: Dict[str, Any], *, public_base_url: Optional[str] = None) -> None:
    to = row.get("contact_email")
    token = row.get("confirm_token")
    if not to or not token:
        return
    link = f"{_public_app_base(public_base_url)}/vertrag-widerrufen?confirm={token}"
    text, html = build_withdrawal_confirm_link_bodies(
        confirm_url=link,
        reference_id=str(row.get("id")),
    )
    result = send_transactional_mail(
        recipient=str(to),
        subject="rInQ Tank — Widerruf bestätigen",
        text_body=text,
        html_body=html,
        message_type=MSG_WITHDRAWAL_CONFIRM_LINK,
        reference_id=str(row.get("id")),
    )
    store.update_withdrawal(
        row["id"],
        {
            "email_status": "confirm_sent" if result.ok else "confirm_failed",
            "failure_reason": None if result.ok else result.error,
        },
    )


def _send_withdrawal_receipt_email(row: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    to = row.get("contact_email")
    if not to:
        return False, "missing contact_email"
    if not mail_configured():
        return False, "ACADEMY_SMTP_HOST not configured (TODO PAID LAUNCH BLOCKER: SMTP)"
    text, html = build_withdrawal_receipt_bodies(
        display_name=row.get("display_name"),
        received_at=row.get("received_at"),
        withdrawal_id=str(row.get("id") or ""),
    )
    result = send_transactional_mail(
        recipient=str(to),
        subject=SUBJECT_WITHDRAWAL_RECEIPT,
        text_body=text,
        html_body=html,
        message_type=MSG_WITHDRAWAL_RECEIPT,
        reference_id=str(row.get("id")),
        reply_to="kontakt@rinq-tank.de",
    )
    return result.ok, result.error


def _send_withdrawal_refund_email(row: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    to = row.get("contact_email")
    if not to:
        return False, "missing contact_email"
    if not mail_configured():
        return False, "ACADEMY_SMTP_HOST not configured (TODO PAID LAUNCH BLOCKER: SMTP)"
    text, html = build_withdrawal_refund_bodies(
        display_name=row.get("display_name"),
        withdrawal_id=str(row.get("id") or ""),
    )
    result = send_transactional_mail(
        recipient=str(to),
        subject=SUBJECT_WITHDRAWAL_REFUND,
        text_body=text,
        html_body=html,
        message_type=MSG_WITHDRAWAL_REFUND,
        reference_id=str(row.get("id")),
        reply_to="kontakt@rinq-tank.de",
    )
    return result.ok, result.error

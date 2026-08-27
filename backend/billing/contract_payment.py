"""Capture and resolve the exact initial contract payment for a Stripe subscription.

Refunds must target this payment — never “latest paid invoice”.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from .persistence import get_subscription_by_external_id, set_subscription_payment_refs

logger = logging.getLogger(__name__)


def _epoch_to_dt(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def _obj_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, dict):
        oid = value.get("id")
        return str(oid) if oid else None
    text = str(value).strip()
    return text or None


def extract_payment_refs_from_invoice(invoice: Dict[str, Any]) -> Dict[str, Optional[Any]]:
    return {
        "initial_invoice_id": _obj_id(invoice.get("id")),
        "initial_payment_intent_id": _obj_id(invoice.get("payment_intent")),
        "initial_charge_id": _obj_id(invoice.get("charge")),
        "contract_started_at": _epoch_to_dt(invoice.get("created")),
    }


def subscription_id_from_invoice(invoice: Dict[str, Any]) -> Optional[str]:
    sid = _obj_id(invoice.get("subscription"))
    if sid:
        return sid
    parent = invoice.get("parent") if isinstance(invoice.get("parent"), dict) else {}
    details = parent.get("subscription_details") if isinstance(parent.get("subscription_details"), dict) else {}
    return _obj_id(details.get("subscription"))


def resolve_payment_for_subscription_create_invoice(
    invoice: Dict[str, Any],
    *,
    checkout_session_id: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Resolve (payment_intent_id, charge_id, error).
    Newer Stripe Invoice objects often omit payment_intent/charge — resolve via
    Checkout Session or a uniquely matching succeeded PaymentIntent for the customer.
    Never picks an unrelated “latest” renewal invoice.
    """
    import stripe
    from . import settings

    stripe.api_key = settings.stripe_secret_key()

    pi = _obj_id(invoice.get("payment_intent"))
    charge = _obj_id(invoice.get("charge"))
    if pi or charge:
        return pi, charge, None

    invoice_id = _obj_id(invoice.get("id"))
    customer_id = _obj_id(invoice.get("customer"))
    amount_paid = invoice.get("amount_paid")
    inv_created = int(invoice.get("created") or 0)
    sub_id = subscription_id_from_invoice(invoice)

    # 1) Explicit checkout session
    session_ids = [checkout_session_id] if checkout_session_id else []
    if customer_id:
        try:
            sessions = stripe.checkout.Session.list(customer=customer_id, limit=10)
            for sess in list(getattr(sessions, "data", None) or []):
                if str(sess.get("status") or "") != "complete":
                    continue
                if invoice_id and _obj_id(sess.get("invoice")) == invoice_id:
                    session_ids.insert(0, str(sess.get("id")))
                elif sub_id and _obj_id(sess.get("subscription")) == sub_id:
                    session_ids.append(str(sess.get("id")))
        except Exception as exc:
            logger.warning("[billing] checkout session lookup failed: %s", exc)

    for sid in session_ids:
        if not sid:
            continue
        try:
            sess = dict(stripe.checkout.Session.retrieve(sid))
        except Exception:
            continue
        pi = _obj_id(sess.get("payment_intent"))
        if pi:
            try:
                intent = dict(stripe.PaymentIntent.retrieve(pi))
                charge = _obj_id(intent.get("latest_charge"))
            except Exception:
                charge = None
            return pi, charge, None

    # 2) Unique succeeded PaymentIntent for customer + amount near invoice time
    if not customer_id or amount_paid is None:
        return None, None, "invoice_missing_customer_or_amount"

    try:
        listed = stripe.PaymentIntent.list(customer=customer_id, limit=20)
    except Exception as exc:
        return None, None, f"payment_intent_list_failed:{exc}"

    matches = []
    for intent in list(getattr(listed, "data", None) or []):
        if str(intent.get("status") or "") != "succeeded":
            continue
        if int(intent.get("amount") or -1) != int(amount_paid):
            continue
        created = int(intent.get("created") or 0)
        # subscription_create payment should be close to invoice creation
        if inv_created and abs(created - inv_created) > 3600:
            continue
        matches.append(intent)

    if not matches:
        return None, None, "no_matching_payment_intent"
    if len(matches) > 1 and inv_created:
        matches.sort(key=lambda i: abs(int(i.get("created") or 0) - inv_created))
        # If two equally close, refuse rather than guess wrongly
        if abs(int(matches[0].get("created") or 0) - inv_created) == abs(
            int(matches[1].get("created") or 0) - inv_created
        ):
            return None, None, "ambiguous_payment_intent_match"
    intent = matches[0]
    pi = _obj_id(intent.get("id"))
    charge = _obj_id(intent.get("latest_charge"))
    return pi, charge, None


def find_subscription_create_invoice(
    invoices: list,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Return (invoice, ambiguity_reason).
    Only accepts billing_reason=subscription_create + paid.
    Never falls back to “latest” invoice.
    """
    candidates = []
    for inv in invoices:
        if not isinstance(inv, dict):
            continue
        if str(inv.get("status") or "") != "paid":
            continue
        if str(inv.get("billing_reason") or "") != "subscription_create":
            continue
        candidates.append(inv)
    if not candidates:
        return None, "no_paid_subscription_create_invoice"
    if len(candidates) == 1:
        return candidates[0], None
    # Deterministic: earliest created among subscription_create invoices
    candidates.sort(key=lambda i: int(i.get("created") or 0))
    return candidates[0], None


def capture_initial_payment_from_invoice(
    invoice: Dict[str, Any],
    *,
    checkout_session_id: Optional[str] = None,
) -> bool:
    """Persist payment anchors when invoice is the subscription_create invoice."""
    if str(invoice.get("status") or "") != "paid":
        return False
    if str(invoice.get("billing_reason") or "") != "subscription_create":
        return False
    sub_id = subscription_id_from_invoice(invoice)
    if not sub_id:
        logger.warning("[billing] subscription_create invoice without subscription id")
        return False
    refs = extract_payment_refs_from_invoice(invoice)
    pi = refs.get("initial_payment_intent_id")
    charge = refs.get("initial_charge_id")
    if not pi and not charge:
        pi, charge, err = resolve_payment_for_subscription_create_invoice(
            invoice, checkout_session_id=checkout_session_id
        )
        if err or (not pi and not charge):
            logger.warning(
                "[billing] could not resolve PI/charge invoice=%s sub=%s err=%s",
                refs.get("initial_invoice_id"),
                sub_id,
                err,
            )
            return False
        refs["initial_payment_intent_id"] = pi
        refs["initial_charge_id"] = charge
    # Prefer checkout session id from matched session when missing
    sess_id = checkout_session_id
    if not sess_id:
        customer_id = _obj_id(invoice.get("customer"))
        invoice_id = refs.get("initial_invoice_id")
        if customer_id and invoice_id:
            try:
                import stripe
                from . import settings

                stripe.api_key = settings.stripe_secret_key()
                sessions = stripe.checkout.Session.list(customer=customer_id, limit=10)
                for sess in list(getattr(sessions, "data", None) or []):
                    if _obj_id(sess.get("invoice")) == invoice_id:
                        sess_id = _obj_id(sess.get("id"))
                        break
            except Exception:
                pass
    return set_subscription_payment_refs(
        external_subscription_id=sub_id,
        checkout_session_id=sess_id,
        initial_invoice_id=refs.get("initial_invoice_id"),
        initial_payment_intent_id=refs.get("initial_payment_intent_id"),
        initial_charge_id=refs.get("initial_charge_id"),
        contract_started_at=refs.get("contract_started_at"),
    )


def capture_initial_payment_for_subscription(
    subscription_id: str,
    *,
    checkout_session_id: Optional[str] = None,
) -> bool:
    """
    Load Stripe invoices for subscription and persist subscription_create payment.
    If none found yet, leave columns NULL (wait for invoice.paid).
    """
    existing = get_subscription_by_external_id(subscription_id)
    if existing and existing.get("initial_payment_intent_id"):
        if checkout_session_id:
            set_subscription_payment_refs(
                external_subscription_id=subscription_id,
                checkout_session_id=checkout_session_id,
            )
        return True

    import stripe
    from . import settings

    stripe.api_key = settings.stripe_secret_key()
    listed = stripe.Invoice.list(subscription=subscription_id, limit=20)
    invoices = [dict(i) for i in list(getattr(listed, "data", None) or [])]
    inv, reason = find_subscription_create_invoice(invoices)
    if not inv:
        logger.info(
            "[billing] initial payment not yet available sub=%s reason=%s",
            subscription_id,
            reason,
        )
        if checkout_session_id:
            set_subscription_payment_refs(
                external_subscription_id=subscription_id,
                checkout_session_id=checkout_session_id,
            )
        return False
    return capture_initial_payment_from_invoice(inv, checkout_session_id=checkout_session_id)


def resolve_refund_target(row: Dict[str, Any]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Returns (payment_intent_id, charge_id, error_reason).
    Uses withdrawal row refs, then subscription anchors — never latest invoice.
    """
    if row.get("stripe_refund_id"):
        return None, None, "already_refunded"

    pi = (row.get("stripe_payment_intent_id") or "").strip() or None
    charge = (row.get("stripe_charge_id") or "").strip() or None
    invoice_id = (row.get("stripe_invoice_id") or "").strip() or None

    sub_id = (row.get("stripe_subscription_id") or row.get("external_subscription_id") or "").strip()
    if (not pi and not charge) and sub_id:
        sub = get_subscription_by_external_id(sub_id)
        if sub:
            pi = pi or (sub.get("initial_payment_intent_id") or None)
            charge = charge or (sub.get("initial_charge_id") or None)
            invoice_id = invoice_id or (sub.get("initial_invoice_id") or None)

    if not pi and not charge:
        return None, None, "missing_initial_payment_refs"

    return pi, charge, None

"""Map Stripe subscription state → billing tables + entitlement_grants."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from entitlements.feature_keys import ACADEMY_PREMIUM
from repositories.wiring import get_repos

from . import settings
from .persistence import upsert_plan_entitlement, upsert_subscription_row

GRANT_STATUSES = frozenset({"active", "trialing"})
ENTITLEMENT_PLAN_STATUSES = frozenset(
    {"none", "active", "past_due", "canceled", "trialing", "incomplete"}
)


def _map_plan_status(stripe_status: str) -> str:
    if stripe_status in ENTITLEMENT_PLAN_STATUSES:
        return stripe_status
    if stripe_status in {"unpaid", "paused"}:
        return "past_due"
    if stripe_status == "incomplete_expired":
        return "canceled"
    return "none"


def _epoch_to_dt(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def resolve_rinq_user_id(*, metadata: Optional[Dict[str, Any]], client_reference_id: Optional[str]) -> Optional[str]:
    meta = metadata or {}
    uid = (meta.get("rinq_user_id") or client_reference_id or "").strip()
    return uid or None


def sync_subscription_object(subscription: Dict[str, Any], *, rinq_user_id: Optional[str] = None) -> Optional[str]:
    """Persist subscription row and sync academy_premium grant. Returns rinq_user_id used."""
    sub_id = str(subscription.get("id") or "").strip()
    if not sub_id:
        return None

    uid = rinq_user_id or resolve_rinq_user_id(
        metadata=subscription.get("metadata"),
        client_reference_id=None,
    )
    if not uid:
        return None

    status = str(subscription.get("status") or "incomplete").strip().lower()
    plan_status = _map_plan_status(status)

    customer_id = subscription.get("customer")
    customer_str = str(customer_id) if customer_id else None

    items = (subscription.get("items") or {}).get("data") or []
    price_id = None
    if items:
        price = items[0].get("price") or {}
        price_id = price.get("id") or items[0].get("plan", {}).get("id")

    period_start = _epoch_to_dt(subscription.get("current_period_start"))
    period_end = _epoch_to_dt(subscription.get("current_period_end"))
    cancel_at_period_end = bool(subscription.get("cancel_at_period_end"))

    upsert_subscription_row(
        rinq_user_id=uid,
        external_subscription_id=sub_id,
        external_customer_id=customer_str,
        status=status,
        price_id=str(price_id) if price_id else settings.stripe_price_id(),
        current_period_start=period_start,
        current_period_end=period_end,
        cancel_at_period_end=cancel_at_period_end,
        raw=subscription,
    )

    upsert_plan_entitlement(
        rinq_user_id=uid,
        external_customer_id=customer_str,
        plan_code=str(price_id or settings.stripe_price_id() or ""),
        status=plan_status,
        current_period_end=period_end,
    )

    repos = get_repos()
    metadata = {
        "stripe_subscription_id": sub_id,
        "stripe_status": status,
    }
    if status in GRANT_STATUSES:
        repos.entitlements.grant_entitlement(
            uid,
            ACADEMY_PREMIUM,
            source="subscription",
            expires_at=period_end.isoformat() if period_end else None,
            metadata=metadata,
        )
    else:
        repos.entitlements.revoke_entitlement(uid, ACADEMY_PREMIUM)

    return uid


def sync_checkout_session_completed(session: Dict[str, Any]) -> Optional[str]:
    uid = resolve_rinq_user_id(
        metadata=session.get("metadata"),
        client_reference_id=session.get("client_reference_id"),
    )
    if not uid:
        return None

    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    if customer_id:
        upsert_plan_entitlement(
            rinq_user_id=uid,
            external_customer_id=str(customer_id),
            plan_code=settings.stripe_price_id(),
            status="incomplete",
            current_period_end=None,
        )

    if subscription_id:
        import stripe

        stripe.api_key = settings.stripe_secret_key()
        sub = stripe.Subscription.retrieve(str(subscription_id))
        return sync_subscription_object(dict(sub), rinq_user_id=uid)

    return uid

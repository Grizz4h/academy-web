"""Best-effort Stripe cleanup when a RinQ account is deleted."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from . import settings
from .persistence import get_billing_status
from .portal import resolve_stripe_customer_id

_logger = logging.getLogger(__name__)

_CANCELABLE = frozenset({"active", "trialing", "past_due", "unpaid", "incomplete"})


def _stripe_gone(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return (
        "no such customer" in msg
        or "no such subscription" in msg
        or "resource_missing" in msg
        or "already canceled" in msg
        or "canceled" in msg and "subscription" in msg
    )


def detach_stripe_billing_for_user(rinq_user_id: str) -> Dict[str, Any]:
    """Cancel open Stripe subscriptions and delete the Stripe customer.

    Local account rows CASCADE separately. Raises RuntimeError if Stripe is
    configured, a customer/sub is known, and cleanup fails for a non-gone reason
    (same fail-closed spirit as Supabase managed-auth delete).
    """
    summary: Dict[str, Any] = {
        "customer_id": None,
        "subscriptions_canceled": 0,
        "customer_deleted": False,
        "skipped": False,
        "errors": [],
    }

    if not settings.stripe_configured():
        summary["skipped"] = True
        summary["reason"] = "stripe_not_configured"
        return summary

    try:
        billing = get_billing_status(rinq_user_id)
    except Exception as exc:
        summary["errors"].append(f"billing_status:{type(exc).__name__}")
        raise RuntimeError("stripe_cleanup_incomplete") from exc

    customer_id = resolve_stripe_customer_id(billing)
    summary["customer_id"] = customer_id

    import stripe

    stripe.api_key = settings.stripe_secret_key()
    errors: List[str] = summary["errors"]

    for row in billing.get("subscriptions") or []:
        sid = (row.get("external_subscription_id") or "").strip()
        status = (row.get("status") or "").strip().lower()
        if not sid or status not in _CANCELABLE:
            continue
        try:
            stripe.Subscription.delete(sid)
            summary["subscriptions_canceled"] += 1
        except Exception as exc:
            if _stripe_gone(exc):
                summary["subscriptions_canceled"] += 1
                continue
            errors.append(f"subscription_cancel:{sid}:{type(exc).__name__}")
            _logger.error(
                "[SEC] account_delete_stripe_sub_failed rinq=%s sub=%s err=%s",
                rinq_user_id,
                sid,
                type(exc).__name__,
            )

    if customer_id:
        try:
            stripe.Customer.delete(customer_id)
            summary["customer_deleted"] = True
        except Exception as exc:
            if _stripe_gone(exc):
                summary["customer_deleted"] = True
            else:
                errors.append(f"customer_delete:{type(exc).__name__}")
                _logger.error(
                    "[SEC] account_delete_stripe_customer_failed rinq=%s err=%s",
                    rinq_user_id,
                    type(exc).__name__,
                )
    elif not (billing.get("subscriptions") or billing.get("plan")):
        summary["skipped"] = True
        summary["reason"] = "no_stripe_customer"

    if errors:
        raise RuntimeError("stripe_cleanup_incomplete")
    return summary

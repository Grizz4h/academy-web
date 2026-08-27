"""Stripe Customer Portal session creation."""

from __future__ import annotations

from typing import Any, Dict

from identity.context import AuthContext

from . import settings
from .persistence import get_billing_status


def resolve_stripe_customer_id(billing: Dict[str, Any]) -> str | None:
    plan_customer = (billing.get("plan") or {}).get("external_customer_id")
    if plan_customer:
        return str(plan_customer)
    for row in billing.get("subscriptions") or []:
        sub_customer = row.get("external_customer_id")
        if sub_customer:
            return str(sub_customer)
    return None


def _resolve_stripe_customer_id(billing: Dict[str, Any]) -> str | None:
    return resolve_stripe_customer_id(billing)


def create_portal_session(user: AuthContext) -> Dict[str, Any]:
    if not settings.stripe_configured():
        raise RuntimeError("Stripe is not configured")

    existing = get_billing_status(user.rinq_user_id)
    customer_id = resolve_stripe_customer_id(existing)
    if not customer_id:
        raise ValueError("No Stripe customer for this account")

    import stripe

    stripe.api_key = settings.stripe_secret_key()
    session = stripe.billing_portal.Session.create(
        customer=str(customer_id),
        return_url=settings.stripe_portal_return_url(),
    )
    return {"portal_url": session.url}

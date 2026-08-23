"""Stripe Checkout session creation."""

from __future__ import annotations

from typing import Any, Dict

from identity.context import AuthContext

from . import settings
from .persistence import get_billing_status, upsert_plan_entitlement


def create_checkout_session(user: AuthContext) -> Dict[str, Any]:
    if not settings.stripe_configured():
        raise RuntimeError("Stripe is not configured")

    import stripe

    stripe.api_key = settings.stripe_secret_key()

    existing = get_billing_status(user.rinq_user_id)
    customer_id = (existing.get("plan") or {}).get("external_customer_id")

    session_kwargs: Dict[str, Any] = {
        "mode": "subscription",
        "line_items": [{"price": settings.stripe_price_id(), "quantity": 1}],
        "success_url": settings.stripe_checkout_success_url(),
        "cancel_url": settings.stripe_checkout_cancel_url(),
        "client_reference_id": user.rinq_user_id,
        "metadata": {"rinq_user_id": user.rinq_user_id},
        "subscription_data": {"metadata": {"rinq_user_id": user.rinq_user_id}},
    }
    if customer_id:
        session_kwargs["customer"] = customer_id

    session = stripe.checkout.Session.create(**session_kwargs)

    if session.customer and not customer_id:
        upsert_plan_entitlement(
            rinq_user_id=user.rinq_user_id,
            external_customer_id=str(session.customer),
            plan_code=settings.stripe_price_id(),
            status="incomplete",
            current_period_end=None,
        )

    return {
        "checkout_url": session.url,
        "session_id": session.id,
    }

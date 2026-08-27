"""Public Stripe price snapshot for pre-checkout disclosure (no secrets)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from . import settings


def get_premium_offer() -> Dict[str, Any]:
    """Load recurring price details from Stripe for the configured STRIPE_PRICE_ID."""
    if not settings.stripe_configured():
        raise RuntimeError("Stripe is not configured")

    import stripe

    stripe.api_key = settings.stripe_secret_key()
    price_id = settings.stripe_price_id()
    assert price_id
    price = stripe.Price.retrieve(price_id)

    recurring = getattr(price, "recurring", None)
    interval: Optional[str] = None
    interval_count: Optional[int] = None
    if recurring is not None:
        interval = getattr(recurring, "interval", None)
        interval_count = getattr(recurring, "interval_count", None)

    return {
        "product_label": "rInQ Tank Premium",
        "price_id": price_id,
        "unit_amount": getattr(price, "unit_amount", None),
        "currency": (getattr(price, "currency", None) or "").lower() or None,
        "interval": interval,
        "interval_count": interval_count,
        "nickname": getattr(price, "nickname", None),
        "free_modules": ["T0", "A1"],
        "premium_from": "A2",
        "notes": [
            "Zugang ab A2 wird nach bestätigtem Stripe-Webhook freigeschaltet.",
            "Kündigung über Kundenportal / Vertrag kündigen.",
        ],
    }

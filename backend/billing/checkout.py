"""Stripe Checkout session creation."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from identity.context import AuthContext
from entitlements.feature_keys import ACADEMY_PREMIUM
from repositories.wiring import get_repos

from . import settings
from .persistence import get_billing_status, upsert_plan_entitlement
from .subscription_sync import GRANT_STATUSES


class ActiveSubscriptionError(RuntimeError):
    """User already has an active/trialing subscription or premium grant."""


class AgeConfirmationRequired(RuntimeError):
    """Paid checkout requires explicit 18+ confirmation on the order summary."""


def _has_active_subscription(status: Dict[str, Any]) -> bool:
    plan_status = str((status.get("plan") or {}).get("status") or "").lower()
    if plan_status in GRANT_STATUSES:
        return True
    for row in status.get("subscriptions") or []:
        if str((row or {}).get("status") or "").lower() in GRANT_STATUSES:
            return True
    return False


def create_checkout_session(user: AuthContext, *, age_confirmed: bool = False) -> Dict[str, Any]:
    if not settings.stripe_configured():
        raise RuntimeError("Stripe is not configured")
    if not age_confirmed:
        raise AgeConfirmationRequired(
            "Für den Abschluss eines kostenpflichtigen rInQ-Abonnements musst du mindestens "
            "18 Jahre alt sein und dies bestätigen."
        )

    existing = get_billing_status(user.rinq_user_id)
    if _has_active_subscription(existing):
        raise ActiveSubscriptionError(
            "Du hast bereits ein aktives Premium-Abo. Verwalte es im Kundenportal."
        )

    repos = get_repos()
    if repos.entitlements.has_access(user.rinq_user_id, ACADEMY_PREMIUM):
        raise ActiveSubscriptionError(
            "Premium ist bereits freigeschaltet. Neues Checkout ist nicht nötig."
        )

    import stripe

    stripe.api_key = settings.stripe_secret_key()

    customer_id = (existing.get("plan") or {}).get("external_customer_id")
    confirmed_at = datetime.now(timezone.utc).isoformat()

    session_kwargs: Dict[str, Any] = {
        "mode": "subscription",
        "line_items": [{"price": settings.stripe_price_id(), "quantity": 1}],
        "success_url": settings.stripe_checkout_success_url(),
        "cancel_url": settings.stripe_checkout_cancel_url(),
        "client_reference_id": user.rinq_user_id,
        "metadata": {
            "rinq_user_id": user.rinq_user_id,
            "age_confirmed": "true",
            "age_confirmed_at": confirmed_at,
        },
        "subscription_data": {
            "metadata": {
                "rinq_user_id": user.rinq_user_id,
                "age_confirmed": "true",
            }
        },
        # Requires Terms of Service URL in Stripe Dashboard (same mode as the key: Test vs Live).
        # custom_text supplements the checkbox; include full URLs so links work even if
        # Dashboard ToS hyperlink is missing in Test mode.
        "consent_collection": {"terms_of_service": "required"},
        "custom_text": {
            "terms_of_service_acceptance": {
                "message": (
                    "Es gelten die AGB von rInQ Tank: https://rinq-tank.de/agb — "
                    "Datenschutz: https://rinq-tank.de/datenschutz — "
                    "Widerrufsbelehrung: https://rinq-tank.de/widerruf"
                ),
            },
        },
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

"""Verified Stripe webhook ingestion."""

from __future__ import annotations

import logging
from typing import Any, Dict

from . import settings
from .persistence import try_record_webhook_event
from .subscription_sync import resolve_rinq_user_id, sync_checkout_session_completed, sync_subscription_object

_logger = logging.getLogger(__name__)


def construct_stripe_event(payload: bytes, signature_header: str | None) -> Dict[str, Any]:
    if not settings.stripe_webhook_secret():
        raise ValueError("STRIPE_WEBHOOK_SECRET is not configured")
    if not signature_header:
        raise ValueError("missing Stripe-Signature header")

    import stripe

    stripe.api_key = settings.stripe_secret_key()
    event = stripe.Webhook.construct_event(
        payload,
        signature_header,
        settings.stripe_webhook_secret(),
    )
    return dict(event)


def handle_stripe_event(event: Dict[str, Any]) -> Dict[str, Any]:
    event_id = str(event.get("id") or "")
    event_type = str(event.get("type") or "")
    data_obj = (event.get("data") or {}).get("object") or {}

    rinq_user_id = resolve_rinq_user_id(
        metadata=data_obj.get("metadata") if isinstance(data_obj, dict) else None,
        client_reference_id=data_obj.get("client_reference_id")
        if isinstance(data_obj, dict)
        else None,
    )

    if not try_record_webhook_event(
        webhook_event_id=event_id,
        event_type=event_type,
        rinq_user_id=rinq_user_id,
        payload={"type": event_type, "id": event_id},
    ):
        return {"ok": True, "duplicate": True}

    if event_type == "checkout.session.completed":
        uid = sync_checkout_session_completed(data_obj)
        return {"ok": True, "rinq_user_id": uid, "action": "checkout_completed"}

    if event_type in {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    }:
        uid = sync_subscription_object(data_obj, rinq_user_id=rinq_user_id)
        return {"ok": True, "rinq_user_id": uid, "action": event_type}

    _logger.info("[billing] stripe webhook ignored type=%s id=%s", event_type, event_id)
    return {"ok": True, "ignored": event_type}

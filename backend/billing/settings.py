"""Stripe billing configuration (server-side only)."""

from __future__ import annotations

import os
from typing import Optional


def stripe_secret_key() -> Optional[str]:
    key = (os.environ.get("STRIPE_SECRET_KEY") or "").strip()
    return key or None


def stripe_webhook_secret() -> Optional[str]:
    secret = (os.environ.get("STRIPE_WEBHOOK_SECRET") or "").strip()
    return secret or None


def stripe_price_id() -> Optional[str]:
    price = (os.environ.get("STRIPE_PRICE_ID") or "").strip()
    return price or None


def stripe_checkout_success_url() -> str:
    explicit = (os.environ.get("STRIPE_CHECKOUT_SUCCESS_URL") or "").strip()
    if explicit:
        return explicit
    base = (os.environ.get("ACADEMY_PUBLIC_URL") or "https://rinq.app").rstrip("/")
    return f"{base}/account?checkout=success"


def stripe_checkout_cancel_url() -> str:
    explicit = (os.environ.get("STRIPE_CHECKOUT_CANCEL_URL") or "").strip()
    if explicit:
        return explicit
    base = (os.environ.get("ACADEMY_PUBLIC_URL") or "https://rinq.app").rstrip("/")
    return f"{base}/account?checkout=cancel"


def stripe_configured() -> bool:
    return bool(stripe_secret_key() and stripe_price_id())

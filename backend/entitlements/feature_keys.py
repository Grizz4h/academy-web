"""Canonical entitlement feature keys — never accept arbitrary client strings."""

from __future__ import annotations

from typing import FrozenSet

# Product features (grants stored in entitlement_grants)
ACADEMY_PREMIUM = "academy_premium"
ADMIN_ACCESS = "admin_access"

ALL_FEATURE_KEYS: FrozenSet[str] = frozenset(
    {
        ACADEMY_PREMIUM,
        ADMIN_ACCESS,
    }
)

GRANT_SOURCES: FrozenSet[str] = frozenset(
    {
        "manual",
        "subscription",
        "promo",
        "system",
    }
)

GRANT_STATUSES: FrozenSet[str] = frozenset({"active", "revoked"})


def normalize_feature_key(raw: str) -> str:
    return (raw or "").strip().lower()


def validate_feature_key(raw: str) -> str:
    key = normalize_feature_key(raw)
    if key not in ALL_FEATURE_KEYS:
        raise ValueError(f"invalid feature_key: {raw!r}")
    return key


def validate_grant_source(raw: str) -> str:
    source = (raw or "").strip().lower()
    if source not in GRANT_SOURCES:
        raise ValueError(f"invalid entitlement source: {raw!r}")
    return source

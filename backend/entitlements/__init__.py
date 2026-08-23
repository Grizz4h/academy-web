"""Entitlement domain — feature grants and access decisions (Phase 5A)."""

from .access_service import AccessResource, can_access, require_access
from .feature_keys import ACADEMY_PREMIUM, ADMIN_ACCESS, ALL_FEATURE_KEYS

__all__ = [
    "ACADEMY_PREMIUM",
    "ADMIN_ACCESS",
    "ALL_FEATURE_KEYS",
    "AccessResource",
    "can_access",
    "require_access",
]

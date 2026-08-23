"""Entitlement domain — feature grants and access decisions (Phase 5A)."""

from .access_service import AccessResource, can_access, require_access
from .curriculum_filter import assert_session_module_access, filter_curriculum_for_user
from .feature_keys import ACADEMY_PREMIUM, ADMIN_ACCESS, ALL_FEATURE_KEYS

__all__ = [
    "ACADEMY_PREMIUM",
    "ADMIN_ACCESS",
    "ALL_FEATURE_KEYS",
    "AccessResource",
    "assert_session_module_access",
    "can_access",
    "filter_curriculum_for_user",
    "require_access",
]

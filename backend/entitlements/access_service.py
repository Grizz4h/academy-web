"""Central authorization decisions — Authentication ≠ Entitlement."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

from identity.context import AuthContext
from security_guards import is_admin_auth

from .access_config import (
    normalize_module_id,
    required_feature_for_module,
)
from .feature_keys import ADMIN_ACCESS, validate_feature_key


@dataclass(frozen=True)
class AccessResource:
    kind: Literal["module", "feature"]
    module_id: Optional[str] = None
    feature_key: Optional[str] = None


def can_access(
    user: AuthContext,
    resource: AccessResource,
    *,
    role_from_record: Optional[str] = None,
) -> bool:
    """Server-side access decision. Never trust client premium flags."""
    from repositories.wiring import get_repos

    if resource.kind == "module":
        module_id = normalize_module_id(resource.module_id)
        required = required_feature_for_module(module_id)
        if required is None:
            return True
        if is_admin_auth(user, role_from_record=role_from_record):
            return True
        return get_repos().entitlements.has_access(user.rinq_user_id, required)

    if resource.kind == "feature":
        feature = validate_feature_key(resource.feature_key or "")
        if feature == ADMIN_ACCESS:
            return is_admin_auth(user, role_from_record=role_from_record)
        if is_admin_auth(user, role_from_record=role_from_record):
            return True
        return get_repos().entitlements.has_access(user.rinq_user_id, feature)

    return False


def require_access(
    user: AuthContext,
    resource: AccessResource,
    *,
    role_from_record: Optional[str] = None,
) -> None:
    """Raise PermissionError when access denied (API layer maps to HTTP 403)."""
    if not can_access(user, resource, role_from_record=role_from_record):
        raise PermissionError("entitlement_required")

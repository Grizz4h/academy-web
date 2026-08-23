"""Strip premium drill content from curriculum responses when access denied."""

from __future__ import annotations

import copy
from typing import Any, Dict, Optional

from identity.context import AuthContext

from .access_config import required_feature_for_module, resolve_academy_module_id
from .access_service import AccessResource, can_access


def filter_curriculum_for_user(
    curriculum: Dict[str, Any],
    user: Optional[AuthContext],
    *,
    role_from_record: Optional[str] = None,
) -> Dict[str, Any]:
    """Return curriculum with premium module drills removed unless user has access."""
    if not isinstance(curriculum, dict):
        return curriculum

    out = copy.deepcopy(curriculum)
    tracks = out.get("tracks")
    if not isinstance(tracks, list):
        return out

    for track in tracks:
        if not isinstance(track, dict):
            continue
        modules = track.get("modules")
        if not isinstance(modules, list):
            continue
        for module in modules:
            if not isinstance(module, dict):
                continue
            module_id = module.get("id")
            if user is None:
                allowed = required_feature_for_module(module_id) is None
            else:
                allowed = can_access(
                    user,
                    AccessResource(kind="module", module_id=str(module_id or "")),
                    role_from_record=role_from_record,
                )
            if allowed:
                module.pop("premium_locked", None)
                continue
            module["drills"] = []
            module["premium_locked"] = True

    return out


def assert_session_module_access(
    user: AuthContext,
    session: Dict[str, Any],
    *,
    role_from_record: Optional[str] = None,
) -> None:
    """Raise PermissionError when session module is premium and user lacks grant."""
    module_id = session.get("module_id")
    learning_area = session.get("learning_area")
    resource = AccessResource(
        kind="module",
        module_id=str(module_id or ""),
        learning_area=str(learning_area) if learning_area is not None else None,
    )
    if not can_access(user, resource, role_from_record=role_from_record):
        resolved = resolve_academy_module_id(module_id)
        raise PermissionError(f"entitlement_required:{resolved or module_id}")

"""Account lifecycle: export + full delete for a rinq_user_id (Phase 3G)."""

from __future__ import annotations

import json
import logging
import os
from datetime import date
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

import httpx

from identity.context import (
    AuthContext,
    MANAGED_AUTH_PROVIDERS,
    SUPABASE_EMAIL_PROVIDER,
    SUPABASE_GOOGLE_PROVIDER,
)
from identity.migrate import owners_match
from identity.store import IdentityStore

logger = logging.getLogger(__name__)

PROVIDER_LABELS = {
    "legacy_password": "Legacy Password",
    "supabase_google": "Google",
    "supabase_email": "Email OTP",
}


def provider_label(provider: str) -> str:
    return PROVIDER_LABELS.get(provider, provider)


def supabase_service_role_configured() -> bool:
    return bool((os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip())


def _iter_json_files(root: str) -> Iterable[str]:
    if not root or not os.path.isdir(root):
        return []
    for dirpath, _, files in os.walk(root):
        for name in files:
            if name.endswith(".json") and not name.startswith("."):
                yield os.path.join(dirpath, name)


def _safe_load(path: str) -> Optional[Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _unlink(path: str) -> bool:
    try:
        if os.path.isfile(path):
            os.remove(path)
            return True
    except OSError as exc:
        logger.warning("[SEC] account_delete_file_failed path=%s err=%s", path, type(exc).__name__)
    return False


def collect_export(
    user: AuthContext,
    *,
    profiles_dir: str,
    rewards_dir: str,
    sessions_dir: str,
    scenes_dir: str,
    obs_runs_dir: str,
    obs_entries_dir: str,
    obs_players_dir: str,
    avatars_dir: str,
    identity_store: IdentityStore,
) -> Dict[str, Any]:
    """Build a JSON-serializable export for the authenticated user only."""
    rid = user.rinq_user_id
    legacy = user.legacy_username

    def owned(resource_user: str) -> bool:
        return owners_match(resource_user or "", user.rinq_user_id, user.legacy_username)

    profile = None
    profile_path = os.path.join(profiles_dir, f"{rid}.json")
    if os.path.isfile(profile_path):
        profile = _safe_load(profile_path)
    elif legacy:
        legacy_profile = os.path.join(profiles_dir, f"{legacy}.json")
        if os.path.isfile(legacy_profile):
            profile = _safe_load(legacy_profile)

    rewards = None
    reward_path = os.path.join(rewards_dir, f"{rid}.json")
    if os.path.isfile(reward_path):
        rewards = _safe_load(reward_path)
    elif legacy:
        legacy_reward = os.path.join(rewards_dir, f"{legacy}.json")
        if os.path.isfile(legacy_reward):
            rewards = _safe_load(legacy_reward)

    sessions: List[Any] = []
    for path in _iter_json_files(sessions_dir):
        data = _safe_load(path)
        if not isinstance(data, dict):
            continue
        if owned(str(data.get("user") or "")) or owned(str(data.get("created_by") or "")):
            # Strip nothing secret here — sessions shouldn't contain password hashes
            sessions.append(data)

    scenes: List[Any] = []
    for path in _iter_json_files(scenes_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            scenes.append(data)

    observations = {"runs": [], "entries": [], "player_profiles": []}
    for path in _iter_json_files(obs_runs_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            observations["runs"].append(data)
    for path in _iter_json_files(obs_entries_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            observations["entries"].append(data)
    for path in _iter_json_files(obs_players_dir):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            observations["player_profiles"].append(data)

    avatars: List[str] = []
    if os.path.isdir(avatars_dir):
        prefix = f"{rid}_"
        legacy_prefix = f"{legacy}_" if legacy else None
        for name in os.listdir(avatars_dir):
            if name.startswith(prefix) or (legacy_prefix and name.startswith(legacy_prefix)):
                avatars.append(name)

    links = identity_store.list_links_for_user(rid)
    auth_providers = [
        {
            "provider": link.get("provider"),
            "label": provider_label(str(link.get("provider") or "")),
            "linked_at": link.get("linked_at"),
            # Never export provider_subject (Supabase UUID) as unnecessary PII surface — omit
        }
        for link in links
    ]

    return {
        "export_version": 1,
        "exported_at": date.today().isoformat(),
        "rinq_user_id": rid,
        "display_name": user.display_name,
        "auth_providers": auth_providers,
        "profile": profile,
        "rewards": rewards,
        "sessions": sessions,
        "scenes": scenes,
        "observations": observations,
        "avatar_files": avatars,
        "settings": {
            "auth_provider_active": user.auth_provider,
            "legacy_username": legacy,
        },
    }


def export_filename() -> str:
    return f"rinq-user-export-{date.today().isoformat()}.json"


def delete_supabase_auth_user(supabase_user_id: str) -> None:
    """Admin API delete. Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server only)."""
    base = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")
    key = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not base or not key:
        raise RuntimeError("supabase_service_role_not_configured")
    url = f"{base}/auth/v1/admin/users/{supabase_user_id}"
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
    }
    with httpx.Client(timeout=30.0) as client:
        res = client.delete(url, headers=headers)
    if res.status_code in (200, 204, 404):
        # 404 = already gone
        return
    raise RuntimeError(f"supabase_admin_delete_failed status={res.status_code}")


def delete_account(
    user: AuthContext,
    *,
    identity_store: IdentityStore,
    profiles_dir: str,
    rewards_dir: str,
    sessions_dir: str,
    scenes_dir: str,
    obs_runs_dir: str,
    obs_entries_dir: str,
    obs_players_dir: str,
    avatars_dir: str,
    users_file: str,
    remove_legacy_user_row: Callable[[str], bool],
) -> Dict[str, Any]:
    """Full account deletion cascade. Returns a summary (no secrets)."""
    rid = user.rinq_user_id
    links = identity_store.list_links_for_user(rid)
    managed_subjects = [
        str(link.get("provider_subject") or "")
        for link in links
        if link.get("provider") in MANAGED_AUTH_PROVIDERS and link.get("provider_subject")
    ]
    if managed_subjects and not supabase_service_role_configured():
        raise RuntimeError("supabase_service_role_required")

    deleted = {
        "profiles": 0,
        "rewards": 0,
        "sessions": 0,
        "scenes": 0,
        "observation_runs": 0,
        "observation_entries": 0,
        "observation_profiles": 0,
        "avatars": 0,
        "legacy_user_row": False,
        "auth_links": 0,
        "supabase_users": 0,
        "supabase_errors": [],
    }

    def owned(resource_user: str) -> bool:
        return owners_match(resource_user or "", user.rinq_user_id, user.legacy_username)

    # --- local userdata ---
    for path in (
        os.path.join(profiles_dir, f"{rid}.json"),
        os.path.join(profiles_dir, f"{user.legacy_username}.json") if user.legacy_username else "",
    ):
        if path and _unlink(path):
            deleted["profiles"] += 1

    for path in (
        os.path.join(rewards_dir, f"{rid}.json"),
        os.path.join(rewards_dir, f"{user.legacy_username}.json") if user.legacy_username else "",
    ):
        if path and _unlink(path):
            deleted["rewards"] += 1

    for path in list(_iter_json_files(sessions_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and (
            owned(str(data.get("user") or "")) or owned(str(data.get("created_by") or ""))
        ):
            if _unlink(path):
                deleted["sessions"] += 1

    for path in list(_iter_json_files(scenes_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["scenes"] += 1

    for path in list(_iter_json_files(obs_runs_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["observation_runs"] += 1

    for path in list(_iter_json_files(obs_entries_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["observation_entries"] += 1

    for path in list(_iter_json_files(obs_players_dir)):
        data = _safe_load(path)
        if isinstance(data, dict) and owned(str(data.get("user") or "")):
            if _unlink(path):
                deleted["observation_profiles"] += 1

    if os.path.isdir(avatars_dir):
        prefix = f"{rid}_"
        legacy_prefix = f"{user.legacy_username}_" if user.legacy_username else None
        for name in list(os.listdir(avatars_dir)):
            if name.startswith(prefix) or (legacy_prefix and name.startswith(legacy_prefix)):
                if _unlink(os.path.join(avatars_dir, name)):
                    deleted["avatars"] += 1

    if user.legacy_username:
        deleted["legacy_user_row"] = bool(remove_legacy_user_row(user.legacy_username))

    # --- managed auth (before dropping auth_links / identity) ---
    for subject in managed_subjects:
        try:
            delete_supabase_auth_user(subject)
            deleted["supabase_users"] += 1
        except Exception as exc:
            msg = type(exc).__name__
            deleted["supabase_errors"].append(msg)
            logger.error(
                "[SEC] account_delete_supabase_failed rinq=%s err=%s",
                rid,
                msg,
            )

    if deleted["supabase_errors"]:
        raise RuntimeError("supabase_cleanup_incomplete")

    # --- identity (all links) ---
    snapshot = identity_store.delete_identity_cascade(rid)
    deleted["auth_links"] = len(snapshot.get("auth_links") or [])

    return deleted

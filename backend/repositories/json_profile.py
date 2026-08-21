"""ProfileRepository — JSON files under profiles/{rinq_user_id}.json."""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Callable, Dict, Optional

from identity.context import AuthContext
from identity.store import normalize_subject

from .errors import StorageError
from .json_io import FileLock, atomic_write_json, read_json


def default_user_profile(display_seed: str) -> Dict[str, Any]:
    display = (display_seed or "Spieler").strip()
    if display:
        display = display[0].upper() + display[1:]
    return {
        "displayName": display or "Spieler",
        "avatar": {"type": "catalog", "avatarId": "avatar_ice_01"},
        "bannerId": "banner_neutral_01",
        "frameId": None,
        "emblem": {"type": "catalog", "emblemId": "emblem_puck_01"},
        "customEmblemId": None,
        "customEmblems": [],
        "profileTitle": "rink_rat",
        "jerseyNumber": None,
        "favoriteLeague": None,
        "favoriteTeamName": None,
        "profileTagline": None,
        "stickerIds": [],
        "academyHelpLevel": "guided",
        "terminologyMode": "direct",
        "preferredAttackDirection": "auto",
        "hockeyExperience": None,
        "experiencePromptDismissed": False,
        "dashboardPreferences": {},
        "updatedAt": None,
    }


class JsonProfileRepository:
    def __init__(self, get_profiles_dir: Callable[[], str]):
        self._get_dir = get_profiles_dir
        self._locks: Dict[str, FileLock] = {}

    def _owner_key(self, user: AuthContext) -> str:
        return user.rinq_user_id

    def _path(self, user: AuthContext) -> str:
        return os.path.join(self._get_dir(), f"{self._owner_key(user)}.json")

    def _legacy_path(self, user: AuthContext) -> Optional[str]:
        if user.legacy_username:
            return os.path.join(
                self._get_dir(), f"{normalize_subject(user.legacy_username)}.json"
            )
        return None

    def _lock_for(self, user: AuthContext) -> FileLock:
        path = self._path(user)
        lock = self._locks.get(path)
        if lock is None:
            lock = FileLock(path + ".lock")
            self._locks[path] = lock
        return lock

    def _merge(self, stored: Dict[str, Any], display_seed: str) -> Dict[str, Any]:
        base = default_user_profile(display_seed)
        merged = {**base, **(stored or {})}
        if not isinstance(merged.get("avatar"), dict):
            merged["avatar"] = base["avatar"]
        if merged.get("emblem") is not None and not isinstance(merged.get("emblem"), dict):
            merged["emblem"] = base["emblem"]
        if not isinstance(merged.get("customEmblems"), list):
            merged["customEmblems"] = []
        if merged.get("stickerIds") is None or not isinstance(merged.get("stickerIds"), list):
            merged["stickerIds"] = []
        return merged

    def _read_unlocked(self, user: AuthContext, display_seed: str) -> Dict[str, Any]:
        path = self._path(user)
        if not os.path.exists(path):
            legacy = self._legacy_path(user)
            if legacy and os.path.exists(legacy):
                path = legacy
            else:
                return default_user_profile(display_seed)
        try:
            stored = read_json(path) or {}
        except Exception:
            return default_user_profile(display_seed)
        if not isinstance(stored, dict):
            return default_user_profile(display_seed)
        return self._merge(stored, display_seed)

    def get_profile(self, user: AuthContext) -> Dict[str, Any]:
        seed = user.display_name or user.legacy_username or user.rinq_user_id
        with self._lock_for(user).exclusive():
            return self._read_unlocked(user, seed)

    def create_default_profile(self, user: AuthContext, display_seed: str) -> Dict[str, Any]:
        profile = default_user_profile(display_seed)
        return self.save_profile(user, profile)

    def update_display_name(self, user: AuthContext, display_name: str) -> Dict[str, Any]:
        with self._lock_for(user).exclusive():
            seed = user.display_name or user.legacy_username or user.rinq_user_id
            profile = self._read_unlocked(user, seed)
            profile["displayName"] = display_name
            profile["displayNameChosen"] = True
            profile["updatedAt"] = datetime.utcnow().isoformat()
            try:
                atomic_write_json(self._path(user), profile)
            except Exception as exc:
                raise StorageError(str(exc)) from exc
            return profile

    def save_profile(self, user: AuthContext, profile: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock_for(user).exclusive():
            out = dict(profile or {})
            out["updatedAt"] = datetime.utcnow().isoformat()
            try:
                atomic_write_json(self._path(user), out)
            except Exception as exc:
                raise StorageError(str(exc)) from exc
            return out

    def delete_profile(self, user: AuthContext) -> bool:
        removed = False
        with self._lock_for(user).exclusive():
            for path in (self._path(user), self._legacy_path(user)):
                if path and os.path.isfile(path):
                    try:
                        os.remove(path)
                        removed = True
                    except OSError as exc:
                        raise StorageError(str(exc)) from exc
        return removed

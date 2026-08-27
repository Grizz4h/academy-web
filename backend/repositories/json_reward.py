"""RewardRepository — per-user JSON with locked apply_reward_delta (no lost updates)."""

from __future__ import annotations

import os
from typing import Any, Callable, Dict, Optional, Tuple, TypeVar

from identity.context import AuthContext
from identity.store import normalize_subject

from .errors import StorageError
from .json_io import FileLock, atomic_write_json, read_json

T = TypeVar("T")


def create_default_reward_state() -> Dict[str, Any]:
    return {
        "currency": {"PUX": 0},
        "unlockedAchievements": {},
        "unlockedMasteries": {},
        "processedSessions": {},
        "processedUnits": {},
        "processedGrantKeys": {},
        "xp": 0,
        "processedEvents": {},
        "unlockedCosmetics": {},
        "activityLog": [],
        "unlockHistory": [],
        "bootstrapCompletedAt": None,
        "lastUpdatedAt": None,
        "favoriteCosmeticIds": [],
        "puxTransactions": [],
        "completedCollections": {},
        "masteryMilestoneUnlocks": {},
        "featuredAchievementId": None,
        "featuredMasteryCoinId": None,
        "progressionPuxGranted": 0,
        "challengeProgress": {},
        "challengeRotation": None,
        "venueVisits": {},
        "progressionCurveVersion": None,
        "levelGrandfatherFloor": None,
    }


def merge_reward_state(state: Dict[str, Any]) -> Dict[str, Any]:
    from progression.cosmetic_cleanup import purge_removed_from_reward_state
    from progression.level_curve import apply_curve_migration

    base = create_default_reward_state()
    merged = {
        **base,
        **state,
        "currency": {**base["currency"], **(state.get("currency") or {})},
        "unlockedAchievements": state.get("unlockedAchievements") or {},
        "unlockedMasteries": state.get("unlockedMasteries") or {},
        "processedSessions": state.get("processedSessions") or {},
        "processedUnits": state.get("processedUnits") or {},
        "processedGrantKeys": state.get("processedGrantKeys") or {},
        "xp": int(state.get("xp") or 0),
        "processedEvents": state.get("processedEvents") or {},
        "unlockedCosmetics": state.get("unlockedCosmetics") or {},
        "activityLog": state.get("activityLog") or [],
        "unlockHistory": state.get("unlockHistory") or [],
        "bootstrapCompletedAt": state.get("bootstrapCompletedAt"),
        "favoriteCosmeticIds": state.get("favoriteCosmeticIds") or [],
        "puxTransactions": state.get("puxTransactions") or [],
        "completedCollections": state.get("completedCollections") or {},
        "masteryMilestoneUnlocks": state.get("masteryMilestoneUnlocks") or {},
        "featuredAchievementId": state.get("featuredAchievementId"),
        "featuredMasteryCoinId": state.get("featuredMasteryCoinId"),
        "progressionPuxGranted": int(state.get("progressionPuxGranted") or 0),
        "challengeProgress": state.get("challengeProgress") or {},
        "challengeRotation": state.get("challengeRotation"),
        "venueVisits": state.get("venueVisits") or {},
        "progressionCurveVersion": state.get("progressionCurveVersion"),
        "levelGrandfatherFloor": state.get("levelGrandfatherFloor"),
    }
    apply_curve_migration(merged)
    purge_removed_from_reward_state(merged)
    return merged


class JsonRewardRepository:
    def __init__(self, get_rewards_dir: Callable[[], str]):
        self._get_dir = get_rewards_dir
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
        # One lock per canonical reward file (rinq_user_id), not legacy path.
        path = self._path(user)
        lock = self._locks.get(path)
        if lock is None:
            lock = FileLock(path + ".lock")
            self._locks[path] = lock
        return lock

    def _read_unlocked(self, user: AuthContext) -> Dict[str, Any]:
        path = self._path(user)
        if not os.path.exists(path):
            legacy = self._legacy_path(user)
            if legacy and os.path.exists(legacy):
                path = legacy
            else:
                return create_default_reward_state()
        try:
            state = read_json(path)
        except Exception as exc:
            raise StorageError(f"Failed to read reward state: {exc}") from exc
        if not isinstance(state, dict):
            return create_default_reward_state()
        return merge_reward_state(state)

    def _write_unlocked(self, user: AuthContext, state: Dict[str, Any]) -> None:
        try:
            atomic_write_json(self._path(user), state)
        except Exception as exc:
            raise StorageError(f"Failed to write reward state: {exc}") from exc

    def get_reward_state(self, user: AuthContext) -> Dict[str, Any]:
        from progression.cosmetic_cleanup import purge_removed_from_reward_state

        with self._lock_for(user).exclusive():
            state = self._read_unlocked(user)
            if purge_removed_from_reward_state(state):
                self._write_unlocked(user, state)
            return state

    def save_reward_state(self, user: AuthContext, state: Dict[str, Any]) -> None:
        with self._lock_for(user).exclusive():
            self._write_unlocked(user, state)

    def apply_reward_delta(
        self,
        user: AuthContext,
        mutator: Callable[
            [Dict[str, Any]], Tuple[Optional[Dict[str, Any]], T]
        ],
    ) -> T:
        """read + calculate + optional write under one exclusive lock (no lost updates)."""
        with self._lock_for(user).exclusive():
            state = self._read_unlocked(user)
            new_state, result = mutator(state)
            if new_state is not None:
                self._write_unlocked(user, new_state)
            return result

    def delete_reward_state(self, user: AuthContext) -> bool:
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

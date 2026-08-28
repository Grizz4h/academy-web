"""JSON UserCompetencyStateRepository — derived cache for JSON backend."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Dict, Iterable, List, Optional, Sequence
import os

from identity.context import AuthContext

from competency.models import CompetencyId, UserCompetencyState
from competency.persistence import row_to_user_competency_state, state_to_storage_row
from repositories.json_io import FileLock, atomic_write_json, read_json


def _states_path(get_dir: Callable[[], str], rinq_user_id: str) -> str:
    return os.path.join(get_dir(), f"{rinq_user_id}.json")


class JsonUserCompetencyStateRepository:
    def __init__(self, get_states_dir: Callable[[], str]):
        self._get_dir = get_states_dir
        self._lock = FileLock(get_states_dir() + ".lock")

    def _empty(self) -> Dict[str, object]:
        return {"version": 1, "states": [], "engine_version": None, "map_hash": None, "recomputed_at": None}

    def _load_doc(self, rinq_user_id: str) -> Dict[str, object]:
        path = _states_path(self._get_dir, rinq_user_id)
        try:
            data = read_json(path, default=self._empty())
        except FileNotFoundError:
            data = self._empty()
        if not isinstance(data, dict):
            data = self._empty()
        data.setdefault("version", 1)
        data.setdefault("states", [])
        return data

    def _save_doc(self, rinq_user_id: str, data: Dict[str, object]) -> None:
        atomic_write_json(_states_path(self._get_dir, rinq_user_id), data)

    def get(self, user: AuthContext, competency_id: CompetencyId) -> Optional[UserCompetencyState]:
        doc = self._load_doc(user.rinq_user_id)
        for row in doc.get("states") or []:
            if row.get("competency_id") == str(competency_id):
                return row_to_user_competency_state(row)
        return None

    def list_for_user(self, user: AuthContext) -> Iterable[UserCompetencyState]:
        doc = self._load_doc(user.rinq_user_id)
        return [row_to_user_competency_state(row) for row in doc.get("states") or []]

    def replace_all_for_user(
        self,
        user: AuthContext,
        states: Sequence[UserCompetencyState],
        *,
        engine_version: str,
        map_hash: Optional[str],
        recomputed_at: Optional[str] = None,
    ) -> None:
        when = (
            datetime.fromisoformat(recomputed_at.replace("Z", "+00:00"))
            if recomputed_at
            else datetime.now(timezone.utc)
        )
        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
        rows = [
            state_to_storage_row(
                rinq_user_id=user.rinq_user_id,
                state=state,
                engine_version=engine_version,
                map_hash=map_hash,
                recomputed_at=when,
            )
            for state in states
        ]
        with self._lock.exclusive():
            doc = {
                "version": 1,
                "engine_version": engine_version,
                "map_hash": map_hash,
                "recomputed_at": when.isoformat(),
                "states": rows,
            }
            self._save_doc(user.rinq_user_id, doc)

    def delete_for_user(self, user: AuthContext) -> int:
        path = _states_path(self._get_dir, user.rinq_user_id)
        with self._lock.exclusive():
            if not os.path.exists(path):
                return 0
            doc = self._load_doc(user.rinq_user_id)
            count = len(doc.get("states") or [])
            os.remove(path)
            return count

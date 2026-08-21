"""SessionRepository — year/month JSON layout under sessions/."""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from identity.context import AuthContext
from identity.migrate import owners_match

from .errors import NotFoundError, StorageError
from .json_io import FileLock, atomic_write_json, read_json


def _parse_created_at(created_at: Optional[str]) -> datetime:
    if created_at:
        try:
            return datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now()


class JsonSessionRepository:
    def __init__(self, get_sessions_dir: Callable[[], str]):
        self._get_dir = get_sessions_dir
        self._dir_lock = FileLock  # factory
        self._locks: Dict[str, FileLock] = {}

    def _sessions_dir(self) -> str:
        return self._get_dir()

    def _global_lock(self) -> FileLock:
        path = os.path.join(self._sessions_dir(), ".sessions.lock")
        lock = self._locks.get(path)
        if lock is None:
            lock = FileLock(path)
            self._locks[path] = lock
        return lock

    def build_storage_path(self, session_id: str, created_at: Optional[str]) -> str:
        dt = _parse_created_at(created_at)
        year = f"{dt.year:04d}"
        month = f"{dt.month:02d}"
        return os.path.join(self._sessions_dir(), year, month, f"{session_id}.json")

    def find_session_path(self, session_id: str) -> Optional[str]:
        target = f"{session_id}.json"
        root = self._sessions_dir()
        legacy_path = os.path.join(root, target)
        if os.path.exists(legacy_path):
            return legacy_path
        matches = []
        if not os.path.exists(root):
            return None
        for dirpath, _, files in os.walk(root):
            if target in files:
                matches.append(os.path.join(dirpath, target))
        if not matches:
            return None
        if len(matches) == 1:
            return matches[0]
        return max(matches, key=os.path.getmtime)

    def iter_session_paths(self):
        root = self._sessions_dir()
        if not os.path.exists(root):
            return
        for dirpath, _, files in os.walk(root):
            for name in files:
                if name.endswith(".json") and not name.startswith("."):
                    yield os.path.join(dirpath, name)

    def _owned(self, session: Dict[str, Any], owner: AuthContext) -> bool:
        return owners_match(
            session.get("user") or "",
            owner.rinq_user_id,
            owner.legacy_username,
        )

    def create_session(self, session: Dict[str, Any]) -> Dict[str, Any]:
        session_id = str(session.get("id") or "").strip()
        if not session_id:
            raise ValueError("session.id required")
        path = self.build_storage_path(session_id, session.get("created_at"))
        with self._global_lock().exclusive():
            try:
                atomic_write_json(path, session)
            except Exception as exc:
                raise StorageError(str(exc)) from exc
        return session

    def find_session_raw(self, session_id: str) -> Optional[Dict[str, Any]]:
        path = self.find_session_path(session_id)
        if not path:
            return None
        try:
            doc = read_json(path)
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return doc if isinstance(doc, dict) else None

    def get_session_for_user(self, session_id: str, owner: AuthContext) -> Dict[str, Any]:
        """Ownership miss → NotFoundError (same opacity as HTTP 404)."""
        path = self.find_session_path(session_id)
        if not path:
            raise NotFoundError("Session not found")
        try:
            session = read_json(path)
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not isinstance(session, dict) or not self._owned(session, owner):
            raise NotFoundError("Session not found")
        return session

    def list_sessions_for_user(
        self, owner: AuthContext, *, state: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        sessions: List[Dict[str, Any]] = []
        for path in self.iter_session_paths() or []:
            try:
                session = read_json(path)
            except Exception:
                continue
            if not isinstance(session, dict):
                continue
            if not self._owned(session, owner):
                continue
            if state and session.get("state") != state:
                continue
            sessions.append(session)
        return sessions

    def save_session(self, session: Dict[str, Any]) -> Dict[str, Any]:
        session_id = str(session.get("id") or "").strip()
        if not session_id:
            raise ValueError("session.id required")
        existing = self.find_session_path(session_id)
        path = existing or self.build_storage_path(session_id, session.get("created_at"))
        with self._global_lock().exclusive():
            try:
                atomic_write_json(path, session)
            except Exception as exc:
                raise StorageError(str(exc)) from exc
        return session

    def delete_session_for_user(self, session_id: str, owner: AuthContext) -> bool:
        path = self.find_session_path(session_id)
        if not path:
            raise NotFoundError("Session not found")
        try:
            session = read_json(path)
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not isinstance(session, dict) or not self._owned(session, owner):
            raise NotFoundError("Session not found")
        try:
            os.remove(path)
        except OSError as exc:
            raise StorageError(str(exc)) from exc
        return True

    def get_session_path_for_user(self, session_id: str, owner: AuthContext) -> str:
        """Compatibility for callers that still need the filesystem path briefly."""
        path = self.find_session_path(session_id)
        if not path:
            raise NotFoundError("Session not found")
        try:
            session = read_json(path)
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not isinstance(session, dict) or not self._owned(session, owner):
            raise NotFoundError("Session not found")
        return path

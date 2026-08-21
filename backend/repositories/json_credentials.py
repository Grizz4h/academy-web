"""Legacy password credentials (users.json) with atomic write + file lock."""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional

from identity.store import normalize_subject

from .errors import StorageError
from .json_io import FileLock, atomic_write_json, read_json


class JsonUserCredentialRepository:
    def __init__(self, get_users_file: Callable[[], str]):
        self._get_users_file = get_users_file
        self._locks: Dict[str, FileLock] = {}

    def _path(self) -> str:
        return self._get_users_file()

    def _lock(self) -> FileLock:
        path = self._path()
        lock = self._locks.get(path)
        if lock is None:
            lock = FileLock(path + ".lock")
            self._locks[path] = lock
        return lock

    def _empty(self) -> Dict[str, Any]:
        return {"users": []}

    def _read_unlocked(self) -> Dict[str, Any]:
        path = self._path()
        if not path or not __import__("os").path.exists(path):
            return self._empty()
        try:
            data = read_json(path)
        except Exception as exc:
            raise StorageError(f"Failed to read users file: {exc}") from exc
        if not isinstance(data, dict):
            return self._empty()
        data.setdefault("users", [])
        return data

    def _write_unlocked(self, data: Dict[str, Any]) -> None:
        try:
            atomic_write_json(self._path(), data)
        except Exception as exc:
            raise StorageError(f"Failed to write users file: {exc}") from exc

    def list_users(self) -> List[Dict[str, Any]]:
        with self._lock().exclusive():
            return list(self._read_unlocked().get("users") or [])

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        key = normalize_subject(username)
        if not key:
            return None
        with self._lock().exclusive():
            for row in self._read_unlocked().get("users") or []:
                if normalize_subject(row.get("username") or "") == key:
                    return dict(row)
        return None

    def get_password_hash(self, username: str) -> Optional[str]:
        row = self.get_by_username(username)
        if not row:
            return None
        value = row.get("password_hash")
        return str(value) if value is not None else None

    def upsert_user(self, record: Dict[str, Any]) -> Dict[str, Any]:
        key = normalize_subject(record.get("username") or "")
        if not key:
            raise ValueError("username required")
        with self._lock().exclusive():
            data = self._read_unlocked()
            users = list(data.get("users") or [])
            replaced = False
            for i, row in enumerate(users):
                if normalize_subject(row.get("username") or "") == key:
                    users[i] = {**row, **record}
                    replaced = True
                    break
            if not replaced:
                users.append(dict(record))
            data["users"] = users
            self._write_unlocked(data)
            return next(
                u for u in users if normalize_subject(u.get("username") or "") == key
            )

    def delete_legacy_credential(self, username: str) -> bool:
        key = normalize_subject(username)
        if not key:
            return False
        with self._lock().exclusive():
            data = self._read_unlocked()
            before = len(data.get("users") or [])
            data["users"] = [
                row
                for row in (data.get("users") or [])
                if normalize_subject(row.get("username") or "") != key
            ]
            if len(data["users"]) == before:
                return False
            self._write_unlocked(data)
            return True

    def load_bundle(self) -> Dict[str, Any]:
        """Compatibility helper for code that still expects {\"users\": [...]}."""
        with self._lock().exclusive():
            return self._read_unlocked()

    def save_bundle(self, data: Dict[str, Any]) -> None:
        with self._lock().exclusive():
            self._write_unlocked(data if isinstance(data, dict) else self._empty())

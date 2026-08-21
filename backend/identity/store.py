"""Persistent identity + auth_links with atomic writes and exclusive locking."""

from __future__ import annotations

import json
import os
import threading
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, List, Optional, Tuple
from uuid import uuid4

from .context import AuthContext, LEGACY_PASSWORD_PROVIDER

try:
    import fcntl
except ImportError:  # pragma: no cover — non-Unix
    fcntl = None  # type: ignore


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(tzinfo=None).isoformat()


def normalize_subject(value: str) -> str:
    return (value or "").strip().lower()


class IdentityStore:
    """JSON identity store with process + file locks.

    Enforces UNIQUE(provider, provider_subject) without SQL.
    """

    def __init__(self, path: str):
        self.path = path
        self._thread_lock = threading.RLock()
        self._lock_path = path + ".lock"
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    @contextmanager
    def _exclusive(self) -> Iterator[None]:
        self._thread_lock.acquire()
        lock_file = None
        try:
            lock_file = open(self._lock_path, "a+", encoding="utf-8")
            if fcntl is not None:
                deadline = time.time() + 30.0
                while True:
                    try:
                        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                        break
                    except BlockingIOError:
                        if time.time() >= deadline:
                            raise TimeoutError(f"Could not lock identity store: {self.path}")
                        time.sleep(0.05)
            yield
        finally:
            if lock_file is not None:
                try:
                    if fcntl is not None:
                        fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
                finally:
                    lock_file.close()
            self._thread_lock.release()

    def _empty(self) -> Dict[str, Any]:
        return {"identities": [], "auth_links": [], "version": 1}

    def _read_unlocked(self) -> Dict[str, Any]:
        if not os.path.exists(self.path):
            return self._empty()
        with open(self.path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return self._empty()
        data.setdefault("identities", [])
        data.setdefault("auth_links", [])
        data.setdefault("version", 1)
        return data

    def _write_unlocked(self, data: Dict[str, Any]) -> None:
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, self.path)

    def load(self) -> Dict[str, Any]:
        with self._exclusive():
            return self._read_unlocked()

    def find_link(
        self, provider: str, provider_subject: str, data: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        subject = normalize_subject(provider_subject)
        bundle = data if data is not None else self.load()
        for link in bundle.get("auth_links") or []:
            if (
                link.get("provider") == provider
                and normalize_subject(link.get("provider_subject") or "") == subject
            ):
                return link
        return None

    def get_identity(
        self, rinq_user_id: str, data: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        bundle = data if data is not None else self.load()
        for identity in bundle.get("identities") or []:
            if identity.get("rinq_user_id") == rinq_user_id:
                return identity
        return None

    def find_by_legacy_username(
        self, username: str, data: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        key = normalize_subject(username)
        bundle = data if data is not None else self.load()
        for identity in bundle.get("identities") or []:
            if normalize_subject(identity.get("legacy_username") or "") == key:
                return identity
        return None

    def ensure_legacy_identity(
        self,
        username: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        """Idempotently attach legacy_password auth_link + identity for username."""
        subject = normalize_subject(username)
        if not subject:
            raise ValueError("username required")

        with self._exclusive():
            data = self._read_unlocked()
            existing = self.find_link(LEGACY_PASSWORD_PROVIDER, subject, data)
            if existing:
                identity = self.get_identity(existing["rinq_user_id"], data)
                if not identity:
                    raise RuntimeError(
                        f"auth_link without identity for subject={subject}"
                    )
                return self._to_context(identity, existing, display_name)

            # Reuse identity row if migration already created it without link (shouldn't)
            identity = self.find_by_legacy_username(subject, data)
            if identity:
                rinq_user_id = identity["rinq_user_id"]
            else:
                # Collision: same (provider, subject) must not exist under another path
                rinq_user_id = str(uuid4())
                identity = {
                    "rinq_user_id": rinq_user_id,
                    "created_at": created_at or _utc_now_iso(),
                    "status": "active",
                    "legacy_username": subject,
                }
                data["identities"].append(identity)

            # UNIQUE(provider, provider_subject)
            if self.find_link(LEGACY_PASSWORD_PROVIDER, subject, data):
                raise RuntimeError(
                    f"Duplicate auth_link race for legacy_password:{subject}"
                )

            link = {
                "rinq_user_id": rinq_user_id,
                "provider": LEGACY_PASSWORD_PROVIDER,
                "provider_subject": subject,
                "linked_at": _utc_now_iso(),
            }
            # Final uniqueness check against all links
            for other in data["auth_links"]:
                if (
                    other.get("provider") == LEGACY_PASSWORD_PROVIDER
                    and normalize_subject(other.get("provider_subject") or "") == subject
                ):
                    if other.get("rinq_user_id") != rinq_user_id:
                        raise RuntimeError(
                            f"Refusing to bind legacy_password:{subject} to multiple UUIDs"
                        )
                    return self._to_context(identity, other, display_name)

            data["auth_links"].append(link)
            self._write_unlocked(data)
            return self._to_context(identity, link, display_name)

    def ensure_provider_identity(
        self,
        provider: str,
        provider_subject: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        """Idempotently create identity + auth_link for a managed-auth provider subject.

        Does not attach legacy_username. Never merges by email.
        Enforces UNIQUE(provider, provider_subject).
        """
        subject = normalize_subject(provider_subject)
        if not provider or not subject:
            raise ValueError("provider and provider_subject required")

        with self._exclusive():
            data = self._read_unlocked()
            existing = self.find_link(provider, subject, data)
            if existing:
                identity = self.get_identity(existing["rinq_user_id"], data)
                if not identity:
                    raise RuntimeError(f"auth_link without identity for {provider}:{subject}")
                return self._to_context(identity, existing, display_name)

            rinq_user_id = str(uuid4())
            identity = {
                "rinq_user_id": rinq_user_id,
                "created_at": created_at or _utc_now_iso(),
                "status": "active",
                # No legacy_username — managed auth only
            }
            link = {
                "rinq_user_id": rinq_user_id,
                "provider": provider,
                "provider_subject": subject,
                "linked_at": _utc_now_iso(),
            }
            # Re-check uniqueness under lock before write
            if self.find_link(provider, subject, data):
                raise RuntimeError(f"Duplicate auth_link race for {provider}:{subject}")
            data["identities"].append(identity)
            data["auth_links"].append(link)
            self._write_unlocked(data)
            return self._to_context(identity, link, display_name)

    def list_providers_for_user(self, rinq_user_id: str) -> List[str]:
        with self._exclusive():
            data = self._read_unlocked()
            return sorted(
                {
                    str(link.get("provider") or "")
                    for link in data.get("auth_links") or []
                    if link.get("rinq_user_id") == rinq_user_id and link.get("provider")
                }
            )

    def list_links_for_user(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        with self._exclusive():
            data = self._read_unlocked()
            return [
                dict(link)
                for link in data.get("auth_links") or []
                if link.get("rinq_user_id") == rinq_user_id
            ]

    def unlink_provider(self, rinq_user_id: str, provider: str) -> Dict[str, Any]:
        """Remove one auth_link. Refuses to remove the last login method."""
        if not provider:
            raise ValueError("provider required")
        with self._exclusive():
            data = self._read_unlocked()
            identity = self.get_identity(rinq_user_id, data)
            if not identity:
                raise KeyError(f"unknown rinq_user_id={rinq_user_id}")
            links = [
                link
                for link in data.get("auth_links") or []
                if link.get("rinq_user_id") == rinq_user_id
            ]
            if len(links) <= 1:
                raise ValueError("cannot_unlink_last_login_method")
            match = next((link for link in links if link.get("provider") == provider), None)
            if not match:
                raise KeyError(f"no link for provider={provider}")
            data["auth_links"] = [
                link
                for link in data["auth_links"]
                if not (
                    link.get("rinq_user_id") == rinq_user_id
                    and link.get("provider") == provider
                )
            ]
            self._write_unlocked(data)
            return match

    def delete_identity_cascade(self, rinq_user_id: str) -> Dict[str, Any]:
        """Remove identity row and all auth_links for this UUID. Returns removed snapshot."""
        with self._exclusive():
            data = self._read_unlocked()
            identity = self.get_identity(rinq_user_id, data)
            if not identity:
                raise KeyError(f"unknown rinq_user_id={rinq_user_id}")
            removed_links = [
                link
                for link in data.get("auth_links") or []
                if link.get("rinq_user_id") == rinq_user_id
            ]
            data["auth_links"] = [
                link
                for link in data.get("auth_links") or []
                if link.get("rinq_user_id") != rinq_user_id
            ]
            data["identities"] = [
                row
                for row in data.get("identities") or []
                if row.get("rinq_user_id") != rinq_user_id
            ]
            self._write_unlocked(data)
            return {"identity": identity, "auth_links": removed_links}

    def link_provider(
        self,
        rinq_user_id: str,
        provider: str,
        provider_subject: str,
        *,
        allow_reclaim_orphan: bool = False,
    ) -> Dict[str, Any]:
        """Attach provider subject to an existing identity. Enforces uniqueness.

        If allow_reclaim_orphan and the subject is already linked to a different
        identity that has no legacy_username (Google-only throwaway), reassign
        the link to rinq_user_id. Never merges by email.
        """
        subject = normalize_subject(provider_subject)
        if not provider or not subject:
            raise ValueError("provider and provider_subject required")

        with self._exclusive():
            data = self._read_unlocked()
            identity = self.get_identity(rinq_user_id, data)
            if not identity:
                raise KeyError(f"unknown rinq_user_id={rinq_user_id}")

            existing = self.find_link(provider, subject, data)
            if existing:
                if existing.get("rinq_user_id") == rinq_user_id:
                    return existing
                other_id = existing.get("rinq_user_id")
                other = self.get_identity(other_id, data) if other_id else None
                can_reclaim = (
                    allow_reclaim_orphan
                    and other is not None
                    and not other.get("legacy_username")
                )
                if not can_reclaim:
                    raise ValueError(
                        f"provider subject already linked to another user: {provider}:{subject}"
                    )
                # Reassign link; drop orphan identity if it has no remaining links
                existing["rinq_user_id"] = rinq_user_id
                existing["linked_at"] = _utc_now_iso()
                remaining = [
                    link
                    for link in data["auth_links"]
                    if link.get("rinq_user_id") == other_id
                ]
                if not remaining:
                    data["identities"] = [
                        row
                        for row in data["identities"]
                        if row.get("rinq_user_id") != other_id
                    ]
                self._write_unlocked(data)
                return existing

            link = {
                "rinq_user_id": rinq_user_id,
                "provider": provider,
                "provider_subject": subject,
                "linked_at": _utc_now_iso(),
            }
            data["auth_links"].append(link)
            self._write_unlocked(data)
            return link

    def resolve_legacy_subject(
        self, username: str, *, display_name: Optional[str] = None
    ) -> Optional[AuthContext]:
        subject = normalize_subject(username)
        if not subject:
            return None
        with self._exclusive():
            data = self._read_unlocked()
            link = self.find_link(LEGACY_PASSWORD_PROVIDER, subject, data)
            if not link:
                return None
            identity = self.get_identity(link["rinq_user_id"], data)
            if not identity:
                return None
            return self._to_context(identity, link, display_name)

    def _to_context(
        self,
        identity: Dict[str, Any],
        link: Dict[str, Any],
        display_name: Optional[str],
    ) -> AuthContext:
        legacy = identity.get("legacy_username")
        name = (display_name or legacy or "Spieler").strip() or "Spieler"
        return AuthContext(
            rinq_user_id=identity["rinq_user_id"],
            auth_provider=link.get("provider") or LEGACY_PASSWORD_PROVIDER,
            auth_subject=normalize_subject(link.get("provider_subject") or ""),
            display_name=name,
            legacy_username=legacy,
        )


_store_singleton: Optional[IdentityStore] = None
_store_lock = threading.Lock()


def get_identity_store(path: Optional[str] = None) -> IdentityStore:
    global _store_singleton
    with _store_lock:
        if path is not None:
            _store_singleton = IdentityStore(path)
            return _store_singleton
        if _store_singleton is None:
            raise RuntimeError("Identity store not configured; call configure_identity_store first")
        return _store_singleton


def configure_identity_store(path: str) -> IdentityStore:
    return get_identity_store(path)

"""IdentityRepository adapter over existing IdentityStore (locks + uniqueness)."""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional

from identity.context import AuthContext
from identity.store import IdentityStore

from .errors import ConflictError, DuplicateAuthLinkError, NotFoundError, StorageError


class JsonIdentityRepository:
    """Thin facade so business code depends on IdentityRepository, not IdentityStore."""

    def __init__(self, get_store: Callable[[], IdentityStore]):
        self._get_store = get_store

    @property
    def store(self) -> IdentityStore:
        return self._get_store()

    def get_identity_by_user_id(self, rinq_user_id: str) -> Optional[Dict[str, Any]]:
        return self.store.get_identity(rinq_user_id)

    def find_auth_link(self, provider: str, provider_subject: str) -> Optional[Dict[str, Any]]:
        return self.store.find_link(provider, provider_subject)

    def create_auth_link(
        self,
        rinq_user_id: str,
        provider: str,
        provider_subject: str,
        *,
        allow_reclaim_orphan: bool = False,
    ) -> Dict[str, Any]:
        try:
            return self.store.link_provider(
                rinq_user_id,
                provider,
                provider_subject,
                allow_reclaim_orphan=allow_reclaim_orphan,
            )
        except KeyError as exc:
            raise NotFoundError(str(exc)) from exc
        except ValueError as exc:
            msg = str(exc)
            if "already linked" in msg:
                raise DuplicateAuthLinkError(msg) from exc
            raise ConflictError(msg) from exc

    def remove_auth_link(self, rinq_user_id: str, provider: str) -> Dict[str, Any]:
        try:
            return self.store.unlink_provider(rinq_user_id, provider)
        except KeyError as exc:
            raise NotFoundError(str(exc)) from exc
        except ValueError as exc:
            raise ConflictError(str(exc)) from exc

    def list_auth_links_for_user(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        return self.store.list_links_for_user(rinq_user_id)

    def list_links_for_user(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        """Alias matching IdentityStore (account_lifecycle)."""
        return self.list_auth_links_for_user(rinq_user_id)

    def list_providers_for_user(self, rinq_user_id: str) -> List[str]:
        return self.store.list_providers_for_user(rinq_user_id)

    def ensure_legacy_identity(
        self,
        username: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        try:
            return self.store.ensure_legacy_identity(
                username, display_name=display_name, created_at=created_at
            )
        except TimeoutError as exc:
            raise StorageError(str(exc)) from exc

    def ensure_provider_identity(
        self,
        provider: str,
        provider_subject: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        try:
            return self.store.ensure_provider_identity(
                provider,
                provider_subject,
                display_name=display_name,
                created_at=created_at,
            )
        except TimeoutError as exc:
            raise StorageError(str(exc)) from exc

    def delete_identity_cascade(self, rinq_user_id: str) -> Dict[str, Any]:
        try:
            return self.store.delete_identity_cascade(rinq_user_id)
        except KeyError as exc:
            raise NotFoundError(str(exc)) from exc

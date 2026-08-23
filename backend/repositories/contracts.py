"""Repository contracts (Protocols). Business code depends only on these."""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional, Protocol, Tuple, TypeVar

from identity.context import AuthContext

T = TypeVar("T")


class IdentityRepository(Protocol):
    """Identities + auth_links. Uniqueness: (provider, provider_subject)."""

    def get_identity_by_user_id(self, rinq_user_id: str) -> Optional[Dict[str, Any]]:
        ...

    def find_auth_link(self, provider: str, provider_subject: str) -> Optional[Dict[str, Any]]:
        ...

    def create_auth_link(
        self,
        rinq_user_id: str,
        provider: str,
        provider_subject: str,
        *,
        allow_reclaim_orphan: bool = False,
    ) -> Dict[str, Any]:
        ...

    def remove_auth_link(self, rinq_user_id: str, provider: str) -> Dict[str, Any]:
        ...

    def list_auth_links_for_user(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        ...

    def list_providers_for_user(self, rinq_user_id: str) -> List[str]:
        ...

    def ensure_legacy_identity(
        self,
        username: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        ...

    def ensure_provider_identity(
        self,
        provider: str,
        provider_subject: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        ...

    def delete_identity_cascade(self, rinq_user_id: str) -> Dict[str, Any]:
        ...


class UserCredentialRepository(Protocol):
    """Legacy password credentials in users.json (no hashing logic here)."""

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        ...

    def get_password_hash(self, username: str) -> Optional[str]:
        ...

    def list_users(self) -> List[Dict[str, Any]]:
        ...

    def upsert_user(self, record: Dict[str, Any]) -> Dict[str, Any]:
        ...

    def delete_legacy_credential(self, username: str) -> bool:
        ...


class ProfileRepository(Protocol):
    """User profile keyed by rinq_user_id (legacy username fallback on read)."""

    def get_profile(self, user: AuthContext) -> Dict[str, Any]:
        ...

    def create_default_profile(self, user: AuthContext, display_seed: str) -> Dict[str, Any]:
        ...

    def update_display_name(self, user: AuthContext, display_name: str) -> Dict[str, Any]:
        ...

    def save_profile(self, user: AuthContext, profile: Dict[str, Any]) -> Dict[str, Any]:
        ...

    def delete_profile(self, user: AuthContext) -> bool:
        ...


class RewardRepository(Protocol):
    """Reward state. Mutations that need RMW semantics go through locked apply."""

    def get_reward_state(self, user: AuthContext) -> Dict[str, Any]:
        ...

    def save_reward_state(self, user: AuthContext, state: Dict[str, Any]) -> None:
        ...

    def apply_reward_delta(
        self,
        user: AuthContext,
        mutator: Callable[
            [Dict[str, Any]], Tuple[Optional[Dict[str, Any]], T]
        ],
    ) -> T:
        """Atomically: load → mutator(state) → optional save under one exclusive lock.

        mutator returns (new_state|None, result). None skips persist (early exit /
        rejected mutation) but still runs inside the lock so checks see fresh state.
        """
        ...

    def delete_reward_state(self, user: AuthContext) -> bool:
        ...


class SessionRepository(Protocol):
    """Session documents owned by rinq_user_id."""

    def create_session(self, session: Dict[str, Any]) -> Dict[str, Any]:
        ...

    def get_session_for_user(
        self, session_id: str, owner: AuthContext
    ) -> Dict[str, Any]:
        ...

    def list_sessions_for_user(
        self, owner: AuthContext, *, state: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        ...

    def save_session(self, session: Dict[str, Any]) -> Dict[str, Any]:
        ...

    def delete_session_for_user(self, session_id: str, owner: AuthContext) -> bool:
        ...

    def find_session_raw(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load by id without ownership check (e.g. dummy-session guard)."""
        ...


class EntitlementRepository(Protocol):
    """Feature grants per rinq_user_id (entitlement_grants)."""

    def has_access(self, rinq_user_id: str, feature_key: str) -> bool:
        ...

    def grant_entitlement(
        self,
        rinq_user_id: str,
        feature_key: str,
        *,
        source: str,
        expires_at: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        ...

    def revoke_entitlement(self, rinq_user_id: str, feature_key: str) -> bool:
        ...

    def list_user_entitlements(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        ...

    def get_active_entitlements(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        ...

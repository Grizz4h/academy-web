"""Central repository wiring. Default JSON; STORAGE_BACKEND=postgres selects PG impls."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Callable, Optional

from identity.store import IdentityStore

from .contracts import (
    EntitlementRepository,
    IdentityRepository,
    ProfileRepository,
    RewardRepository,
    SessionRepository,
    UserCredentialRepository,
)
from .json_credentials import JsonUserCredentialRepository
from .json_entitlement import JsonEntitlementRepository
from .json_identity import JsonIdentityRepository
from .json_profile import JsonProfileRepository
from .json_reward import JsonRewardRepository
from .json_session import JsonSessionRepository


@dataclass
class Repositories:
    identity: IdentityRepository
    credentials: UserCredentialRepository
    profiles: ProfileRepository
    rewards: RewardRepository
    sessions: SessionRepository
    entitlements: EntitlementRepository
    backend: str = "json"


_repos: Optional[Repositories] = None
_logger = logging.getLogger(__name__)


def configure_repositories(
    *,
    get_identity_store: Callable[[], IdentityStore],
    get_users_file: Callable[[], str],
    get_profiles_dir: Callable[[], str],
    get_rewards_dir: Callable[[], str],
    get_sessions_dir: Callable[[], str],
    get_entitlements_file: Callable[[], str],
    storage_backend: Optional[str] = None,
) -> Repositories:
    """Bind repositories. Callables keep tests' path monkeypatches live for JSON."""
    global _repos
    backend = (storage_backend or os.environ.get("STORAGE_BACKEND") or "json").strip().lower()
    if backend == "json":
        _repos = Repositories(
            identity=JsonIdentityRepository(get_identity_store),
            credentials=JsonUserCredentialRepository(get_users_file),
            profiles=JsonProfileRepository(get_profiles_dir),
            rewards=JsonRewardRepository(get_rewards_dir),
            sessions=JsonSessionRepository(get_sessions_dir),
            entitlements=JsonEntitlementRepository(
                get_entitlements_file,
                get_identity_store,
            ),
            backend="json",
        )
        _logger.info("[storage] selected backend=json")
        return _repos

    if backend == "postgres":
        from db.pool import configure_pool
        from db.settings import database_url

        # Fail fast — no silent fallback to JSON (avoid split-brain).
        database_url()
        configure_pool()
        from .pg_credentials import PostgresUserCredentialRepository
        from .pg_entitlement import PostgresEntitlementRepository
        from .pg_identity import PostgresIdentityRepository
        from .pg_profile import PostgresProfileRepository
        from .pg_reward import PostgresRewardRepository
        from .pg_session import PostgresSessionRepository

        _repos = Repositories(
            identity=PostgresIdentityRepository(),
            credentials=PostgresUserCredentialRepository(),
            profiles=PostgresProfileRepository(),
            rewards=PostgresRewardRepository(),
            sessions=PostgresSessionRepository(),
            entitlements=PostgresEntitlementRepository(),
            backend="postgres",
        )
        _logger.info("[storage] selected backend=postgres")
        return _repos

    raise RuntimeError(
        f"Invalid STORAGE_BACKEND={backend!r}; expected 'json' or 'postgres'"
    )


def get_repos() -> Repositories:
    if _repos is None:
        raise RuntimeError("Repositories not configured; call configure_repositories first")
    return _repos

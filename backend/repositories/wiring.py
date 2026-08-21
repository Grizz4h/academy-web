"""Central repository wiring. Today: JSON; later: swap implementations here only."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

from identity.store import IdentityStore

from .contracts import (
    IdentityRepository,
    ProfileRepository,
    RewardRepository,
    SessionRepository,
    UserCredentialRepository,
)
from .json_credentials import JsonUserCredentialRepository
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


_repos: Optional[Repositories] = None


def configure_repositories(
    *,
    get_identity_store: Callable[[], IdentityStore],
    get_users_file: Callable[[], str],
    get_profiles_dir: Callable[[], str],
    get_rewards_dir: Callable[[], str],
    get_sessions_dir: Callable[[], str],
) -> Repositories:
    """Bind JSON repositories. Callables keep tests' path monkeypatches live."""
    global _repos
    _repos = Repositories(
        identity=JsonIdentityRepository(get_identity_store),
        credentials=JsonUserCredentialRepository(get_users_file),
        profiles=JsonProfileRepository(get_profiles_dir),
        rewards=JsonRewardRepository(get_rewards_dir),
        sessions=JsonSessionRepository(get_sessions_dir),
    )
    return _repos


def get_repos() -> Repositories:
    if _repos is None:
        raise RuntimeError("Repositories not configured; call configure_repositories first")
    return _repos

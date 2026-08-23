"""Runtime persistence repositories (contracts + JSON implementations)."""

from .contracts import (
    EntitlementRepository,
    IdentityRepository,
    ProfileRepository,
    RewardRepository,
    SessionRepository,
    UserCredentialRepository,
)
from .errors import (
    ConflictError,
    DuplicateAuthLinkError,
    InsufficientFundsError,
    NotFoundError,
    OwnershipError,
    RepositoryError,
    StorageError,
)
from .wiring import Repositories, configure_repositories, get_repos

__all__ = [
    "ConflictError",
    "DuplicateAuthLinkError",
    "EntitlementRepository",
    "IdentityRepository",
    "InsufficientFundsError",
    "NotFoundError",
    "OwnershipError",
    "ProfileRepository",
    "Repositories",
    "RepositoryError",
    "RewardRepository",
    "SessionRepository",
    "StorageError",
    "UserCredentialRepository",
    "configure_repositories",
    "get_repos",
]

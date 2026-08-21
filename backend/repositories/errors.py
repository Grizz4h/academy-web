"""Repository / domain persistence errors (no HTTP). API layer maps these."""

from __future__ import annotations


class RepositoryError(Exception):
    """Base class for persistence-layer failures."""


class NotFoundError(RepositoryError):
    """Requested entity does not exist (or is not visible under ownership rules)."""


class ConflictError(RepositoryError):
    """State conflict (e.g. duplicate unique key, optimistic conflict)."""


class DuplicateAuthLinkError(ConflictError):
    """provider + provider_subject already bound to another identity."""


class OwnershipError(RepositoryError):
    """Caller is not the owner of the resource."""


class StorageError(RepositoryError):
    """Underlying storage I/O failure (lock timeout, disk, corrupt file)."""


class InsufficientFundsError(ConflictError):
    """Reward delta would drive PUX below zero."""

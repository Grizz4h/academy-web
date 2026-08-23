"""db package — Postgres access for Phase 4D (not used until STORAGE_BACKEND=postgres)."""

from .health import build_health_payload
from .pool import close_pool, configure_pool, connection, get_pool, ping_database, transaction
from .settings import (
    database_url,
    optional_database_url,
    pool_connect_timeout_sec,
    pool_max_size,
    pool_min_size,
    storage_backend,
)

__all__ = [
    "build_health_payload",
    "close_pool",
    "configure_pool",
    "connection",
    "database_url",
    "get_pool",
    "optional_database_url",
    "ping_database",
    "pool_connect_timeout_sec",
    "pool_max_size",
    "pool_min_size",
    "storage_backend",
    "transaction",
]

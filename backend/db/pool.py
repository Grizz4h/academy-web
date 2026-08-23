"""psycopg3 connection pool — FastAPI → Postgres only."""

from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Iterator, Optional

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .settings import (
    database_url,
    pool_connect_timeout_sec,
    pool_max_size,
    pool_min_size,
)

logger = logging.getLogger(__name__)

_pool: Optional[ConnectionPool] = None


def configure_pool(*, conninfo: Optional[str] = None, min_size: Optional[int] = None, max_size: Optional[int] = None) -> ConnectionPool:
    """Create / replace the process-wide pool. Call once at startup when using Postgres."""
    global _pool
    if _pool is not None:
        try:
            _pool.close()
        except Exception:
            pass
        _pool = None

    resolved_min = pool_min_size() if min_size is None else max(1, min_size)
    resolved_max = pool_max_size() if max_size is None else max(resolved_min, max_size)
    timeout = pool_connect_timeout_sec()
    info = conninfo or database_url()

    try:
        _pool = ConnectionPool(
            conninfo=info,
            min_size=resolved_min,
            max_size=resolved_max,
            kwargs={
                "row_factory": dict_row,
                "connect_timeout": timeout,
            },
            open=True,
        )
        ping_database()
    except Exception as exc:
        logger.error("[db] pool startup failed: %s", type(exc).__name__)
        close_pool()
        raise RuntimeError(
            "Postgres pool startup failed — check DATABASE_URL and network. "
            "No silent fallback to JSON."
        ) from exc

    logger.info(
        "[db] pool ready min=%s max=%s connect_timeout_sec=%s",
        resolved_min,
        resolved_max,
        timeout,
    )
    return _pool


def ping_database() -> None:
    """Lightweight readiness probe (SELECT 1). Raises on failure."""
    with connection() as conn:
        conn.execute("SELECT 1")


def get_pool() -> ConnectionPool:
    if _pool is None:
        raise RuntimeError(
            "Postgres pool not configured. Call configure_pool() when STORAGE_BACKEND=postgres "
            "or when running migration tools."
        )
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        try:
            _pool.close()
            logger.info("[db] pool closed")
        except Exception as exc:
            logger.warning("[db] pool close failed: %s", type(exc).__name__)
        finally:
            _pool = None


@contextmanager
def connection() -> Iterator[Connection]:
    pool = get_pool()
    try:
        with pool.connection() as conn:
            yield conn
    except Exception as exc:
        logger.warning("[db] connection error: %s", type(exc).__name__)
        raise


@contextmanager
def transaction() -> Iterator[Connection]:
    """Checked-out connection with an explicit transaction."""
    try:
        with connection() as conn:
            with conn.transaction():
                yield conn
    except Exception as exc:
        logger.warning("[db] transaction failed: %s", type(exc).__name__)
        raise

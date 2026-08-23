"""psycopg3 connection pool — FastAPI → Postgres only."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator, Optional

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .settings import database_url

_pool: Optional[ConnectionPool] = None


def configure_pool(*, conninfo: Optional[str] = None, min_size: int = 1, max_size: int = 10) -> ConnectionPool:
    """Create / replace the process-wide pool. Call once at startup when using Postgres."""
    global _pool
    if _pool is not None:
        try:
            _pool.close()
        except Exception:
            pass
        _pool = None
    info = conninfo or database_url()
    _pool = ConnectionPool(
        conninfo=info,
        min_size=min_size,
        max_size=max_size,
        kwargs={"row_factory": dict_row},
        open=True,
    )
    return _pool


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
        _pool.close()
        _pool = None


@contextmanager
def connection() -> Iterator[Connection]:
    pool = get_pool()
    with pool.connection() as conn:
        yield conn


@contextmanager
def transaction() -> Iterator[Connection]:
    """Checked-out connection with an explicit transaction."""
    with connection() as conn:
        with conn.transaction():
            yield conn

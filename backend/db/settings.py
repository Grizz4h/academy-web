"""Postgres connection settings (server-side only)."""

from __future__ import annotations

import os
from typing import Literal, Optional

StorageBackend = Literal["json", "postgres"]

# Defaults for early production (single FastAPI worker + Supabase Session pooler).
# Override via env only when ops has measured a need — no premature tuning.
DEFAULT_POOL_MIN = 1
DEFAULT_POOL_MAX = 5
DEFAULT_CONNECT_TIMEOUT_SEC = 10


def storage_backend() -> StorageBackend:
    raw = (os.environ.get("STORAGE_BACKEND") or "json").strip().lower()
    if raw not in ("json", "postgres"):
        raise RuntimeError(
            f"Invalid STORAGE_BACKEND={raw!r}; expected 'json' or 'postgres'"
        )
    return raw  # type: ignore[return-value]


def database_url() -> str:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is required when STORAGE_BACKEND=postgres "
            "(or for migration tools). Set it server-side only — never in VITE_*."
        )
    return url


def optional_database_url() -> Optional[str]:
    url = (os.environ.get("DATABASE_URL") or "").strip()
    return url or None


def pool_min_size() -> int:
    raw = (os.environ.get("ACADEMY_PG_POOL_MIN") or "").strip()
    if not raw:
        return DEFAULT_POOL_MIN
    return max(1, int(raw))


def pool_max_size() -> int:
    raw = (os.environ.get("ACADEMY_PG_POOL_MAX") or "").strip()
    if not raw:
        return DEFAULT_POOL_MAX
    return max(pool_min_size(), int(raw))


def pool_connect_timeout_sec() -> int:
    raw = (os.environ.get("ACADEMY_PG_CONNECT_TIMEOUT") or "").strip()
    if not raw:
        return DEFAULT_CONNECT_TIMEOUT_SEC
    return max(1, int(raw))

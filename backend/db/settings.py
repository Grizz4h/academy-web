"""Postgres connection settings (server-side only)."""

from __future__ import annotations

import os
from typing import Literal, Optional

StorageBackend = Literal["json", "postgres"]


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

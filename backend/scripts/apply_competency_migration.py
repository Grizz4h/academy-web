#!/usr/bin/env python3
"""Apply competency persistence migration (006) to Postgres.

Uses the same env loading as main.py. Safe to re-run (IF NOT EXISTS).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))
MIGRATION = BACKEND_DIR / "migrations" / "006_competency_persistence.sql"


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(ROOT_DIR / ".env")
    load_dotenv(ROOT_DIR / ".env.local")


def main() -> int:
    _load_env()
    from db.settings import database_url, storage_backend

    if storage_backend() != "postgres":
        print(f"SKIP: STORAGE_BACKEND={storage_backend()} — migration targets postgres only")
        return 0

    if not MIGRATION.is_file():
        print(f"FAIL: missing {MIGRATION}")
        return 1

    sql = MIGRATION.read_text(encoding="utf-8")
    import psycopg

    url = database_url()
    print(f"Applying {MIGRATION.name} …")
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(sql)
    print("OK: evidence_events + user_competency_states ready")
    return 0


if __name__ == "__main__":
    sys.exit(main())

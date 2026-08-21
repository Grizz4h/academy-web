"""Phase 4C — static verification of runtime SQL migration (no live DB required)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SQL_PATH = ROOT / "migrations" / "001_runtime_schema.sql"

REQUIRED_TABLES = [
    "app_users",
    "auth_links",
    "legacy_credentials",
    "profiles",
    "reward_states",
    "sessions",
    "entitlements",
    "subscriptions",
    "processed_webhook_events",
]

REQUIRED_SNIPPETS = [
    # Identity / ownership
    "rinq_user_id",
    "PRIMARY KEY",
    # Auth uniqueness
    "UNIQUE (provider, provider_subject)",
    "UNIQUE (rinq_user_id, provider, provider_subject)",
    # Cascade ownership
    "ON DELETE CASCADE",
    # Webhook retention
    "ON DELETE SET NULL",
    # Payment prep uniqueness
    "UNIQUE (external_customer_id)",
    "UNIQUE (external_subscription_id)",
    "webhook_event_id",
    # Reward integrity
    "CHECK (xp >= 0)",
    "CHECK (pux >= 0)",
    # Timestamps
    "TIMESTAMPTZ",
    # RLS
    "ENABLE ROW LEVEL SECURITY",
    # JSONB pragmatic storage
    "JSONB",
]

FORBIDDEN_PATTERNS = [
    # Email must not be FK / PK for app identity
    (re.compile(r"REFERENCES\s+\w*\s*\([^)]*email", re.I), "email must not appear as FK target"),
    (re.compile(r"PRIMARY KEY\s*\([^)]*email", re.I), "email must not be primary key"),
]


def _assert(cond: bool, msg: str, errors: list[str]) -> None:
    if not cond:
        errors.append(msg)


def main() -> int:
    errors: list[str] = []
    _assert(SQL_PATH.is_file(), f"missing migration: {SQL_PATH}", errors)
    if errors:
        for e in errors:
            print("FAIL:", e)
        return 1

    sql = SQL_PATH.read_text(encoding="utf-8")
    sql_norm = re.sub(r"\s+", " ", sql)

    for table in REQUIRED_TABLES:
        _assert(
            re.search(rf"CREATE TABLE IF NOT EXISTS {table}\b", sql, re.I) is not None,
            f"missing table definition: {table}",
            errors,
        )

    for snippet in REQUIRED_SNIPPETS:
        _assert(
            snippet in sql or snippet in sql_norm,
            f"missing required SQL element: {snippet}",
            errors,
        )

    # Explicit: no email columns on ownership tables
    for table in ("app_users", "auth_links", "profiles", "reward_states", "sessions"):
        block = _extract_table_block(sql, table)
        if block is None:
            errors.append(f"could not parse table block: {table}")
            continue
        _assert(
            re.search(r"\bemail\b", block, re.I) is None,
            f"{table} must not store email as a column",
            errors,
        )

    for pattern, msg in FORBIDDEN_PATTERNS:
        _assert(pattern.search(sql) is None, msg, errors)

    # Wave-1 domains covered (no scenes/observations required)
    for name in ("app_users", "auth_links", "legacy_credentials", "profiles", "reward_states", "sessions"):
        _assert(name in sql, f"Wave-1 domain table missing: {name}", errors)

    # Provider subjects uniqueness is global (critical)
    _assert(
        "UNIQUE (provider, provider_subject)" in sql_norm
        or "UNIQUE(provider, provider_subject)" in sql_norm.replace(" ", ""),
        "auth_links must enforce UNIQUE(provider, provider_subject)",
        errors,
    )

    if errors:
        print(f"test_schema_4c.py: {len(errors)} failure(s)")
        for e in errors:
            print(" -", e)
        return 1

    print("test_schema_4c.py: all assertions passed")
    print(f"  tables: {', '.join(REQUIRED_TABLES)}")
    print(f"  file:   {SQL_PATH.relative_to(ROOT.parent)}")
    return 0


def _extract_table_block(sql: str, table: str) -> str | None:
    m = re.search(
        rf"CREATE TABLE IF NOT EXISTS {table}\s*\((.*?)\)\s*;",
        sql,
        re.I | re.S,
    )
    return m.group(1) if m else None


if __name__ == "__main__":
    sys.exit(main())

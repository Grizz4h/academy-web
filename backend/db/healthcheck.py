"""Read-only Postgres ops check — no writes.

Usage:
  cd backend && .venv/bin/python -m db.healthcheck
"""

from __future__ import annotations

import json
import sys
from typing import Any, Dict, List

from db.pool import close_pool, configure_pool, connection
from db.settings import storage_backend

WAVE1_TABLES = (
    "app_users",
    "auth_links",
    "legacy_credentials",
    "profiles",
    "reward_states",
    "sessions",
)

PHASE5A_TABLES = (
    "entitlement_grants",
)

ALL_RUNTIME_TABLES = WAVE1_TABLES + PHASE5A_TABLES


def run_healthcheck() -> Dict[str, Any]:
    report: Dict[str, Any] = {
        "ok": True,
        "storage": storage_backend(),
        "database": "unknown",
        "tables": {},
        "counts": {},
        "errors": [],
    }

    if report["storage"] != "postgres":
        report["errors"].append("STORAGE_BACKEND is not postgres — DB healthcheck skipped")
        report["ok"] = False
        return report

    try:
        configure_pool()
        with connection() as conn:
            conn.execute("SELECT 1")
        report["database"] = "ok"
    except Exception as exc:
        report["database"] = "error"
        report["errors"].append(f"database unreachable: {type(exc).__name__}")
        report["ok"] = False
        return report

    try:
        with connection() as conn:
            rows = conn.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = ANY(%s)
                ORDER BY table_name
                """,
                (list(ALL_RUNTIME_TABLES),),
            ).fetchall()
            present = {r["table_name"] for r in rows}
            for table in ALL_RUNTIME_TABLES:
                report["tables"][table] = table in present
                if table not in present:
                    report["errors"].append(f"missing table: {table}")
                    report["ok"] = False

            for table in ALL_RUNTIME_TABLES:
                if table not in present:
                    continue
                count_row = conn.execute(f"SELECT COUNT(*) AS n FROM {table}").fetchone()
                report["counts"][table] = int(count_row["n"]) if count_row else 0
    except Exception as exc:
        report["errors"].append(f"schema probe failed: {type(exc).__name__}")
        report["ok"] = False

    return report


def main(argv: List[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    verbose = "--verbose" in argv or "-v" in argv
    report = run_healthcheck()
    print(json.dumps(report, indent=2 if verbose else None, sort_keys=True))
    try:
        close_pool()
    except Exception:
        pass
    return 0 if report.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())

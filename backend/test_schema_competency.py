"""Phase 4C.1 — static verification of competency persistence migration."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SQL_PATH = ROOT / "migrations" / "006_competency_persistence.sql"

REQUIRED_TABLES = [
    "evidence_events",
    "user_competency_states",
]

REQUIRED_SNIPPETS = [
    "rinq_user_id",
    "ON DELETE CASCADE",
    "REFERENCES app_users",
    "evidence_events_idempotency_unique",
    "UNIQUE (rinq_user_id, source_type, source_id, competency_id)",
    "idx_evidence_events_user_created",
    "idx_evidence_events_user_comp_created",
    "idx_evidence_events_user_drill",
    "engine_version",
    "map_hash",
    "CHECK (score >= 0 AND score <= 100)",
    "CHECK (confidence >= 0 AND confidence <= 1)",
    "CHECK (breadth >= 0 AND breadth <= 1)",
    "ENABLE ROW LEVEL SECURITY",
    "JSONB",
]


def main() -> int:
    errors: list[str] = []
    if not SQL_PATH.is_file():
        print(f"FAIL: missing migration: {SQL_PATH}")
        return 1

    sql = SQL_PATH.read_text(encoding="utf-8")
    for table in REQUIRED_TABLES:
        if re.search(rf"CREATE TABLE IF NOT EXISTS {table}\b", sql, re.I) is None:
            errors.append(f"missing table definition: {table}")
    for snippet in REQUIRED_SNIPPETS:
        if snippet not in sql:
            errors.append(f"missing required SQL element: {snippet}")

    if errors:
        print(f"test_schema_competency.py: {len(errors)} failure(s)")
        for err in errors:
            print(" -", err)
        return 1

    print("test_schema_competency.py: all assertions passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

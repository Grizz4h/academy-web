"""Phase 5A — static verification of entitlement_grants migration."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SQL_PATH = ROOT / "migrations" / "002_entitlement_grants.sql"

REQUIRED_SNIPPETS = [
    "CREATE TABLE IF NOT EXISTS entitlement_grants",
    "rinq_user_id",
    "REFERENCES app_users",
    "ON DELETE CASCADE",
    "feature_key",
    "UNIQUE (rinq_user_id, feature_key)",
    "CHECK (status IN ('active', 'revoked'))",
    "CHECK (source IN ('manual', 'subscription', 'promo', 'system'))",
    "expires_at",
    "metadata",
    "JSONB",
    "ENABLE ROW LEVEL SECURITY",
]


def main() -> int:
    errors: list[str] = []
    if not SQL_PATH.is_file():
        print("FAIL: missing migration:", SQL_PATH)
        return 1

    sql = SQL_PATH.read_text(encoding="utf-8")
    for snippet in REQUIRED_SNIPPETS:
        if snippet not in sql:
            errors.append(f"missing snippet: {snippet}")

    if re.search(r"DROP TABLE\s+entitlements\b", sql, re.I):
        errors.append("must not drop legacy entitlements table")

    if errors:
        for err in errors:
            print("FAIL:", err)
        return 1

    print("OK: 002_entitlement_grants.sql static checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

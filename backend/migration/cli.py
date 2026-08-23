"""CLI: python -m migration.cli <command>

Commands:
  dry-run   Plan import; print planned counts (no writes, no backup)
  import    Backup JSON + upsert into Postgres (requires --confirm)
  verify    Compare JSON vs Postgres counts + anchors
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load .env.local from repo root if present (no secrets committed)
try:
    from dotenv import load_dotenv

    root = BACKEND_DIR.parent
    load_dotenv(root / ".env.local")
    load_dotenv(root / ".env")
except Exception:
    pass


def _academy_dir(arg: str | None) -> Path:
    if arg:
        return Path(arg)
    env = os.environ.get("ACADEMY_DATA_DIR")
    if env:
        return Path(env)
    return BACKEND_DIR.parent / "data" / "academy"


def _require_database_url() -> None:
    if not (os.environ.get("DATABASE_URL") or "").strip():
        print(
            """
MANUAL ACTION REQUIRED — DATABASE_URL is not set.

1. Open Supabase Dashboard → Project Settings → Database
2. Copy the URI under "Connection string" (prefer "Transaction" pooler for app,
   or Direct connection for one-off migrations from a trusted server).
3. Set server-side only (never VITE_*, never commit):

   export DATABASE_URL='postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'

4. Re-run this command.

Also ensure schema 001 is applied first (see docs/ops/postgres-migration.md).
""".strip()
        )
        sys.exit(2)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="RinQ JSON → Postgres migration (Phase 4D)")
    parser.add_argument(
        "command",
        choices=["dry-run", "import", "verify"],
        help="dry-run | import | verify",
    )
    parser.add_argument("--academy-dir", default=None, help="Path to data/academy")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Required for import (writes to Postgres)",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip JSON tree backup (not recommended)",
    )
    parser.add_argument(
        "--anchors",
        default="christoph,martin,tobi",
        help="Comma-separated legacy usernames for verify anchors",
    )
    args = parser.parse_args(argv)

    _require_database_url()

    from db.pool import close_pool, configure_pool
    from migration.importer import migrate_from_json
    from migration.verify import verify_migration

    configure_pool()
    academy = _academy_dir(args.academy_dir)

    try:
        if args.command == "dry-run":
            report = migrate_from_json(academy, dry_run=True, do_backup=False)
            print(json.dumps(report.as_dict(), indent=2, default=str))
            return 1 if report.errors else 0

        if args.command == "import":
            if not args.confirm:
                print(
                    "Refusing import without --confirm.\n"
                    "Run dry-run first, then:\n"
                    "  python -m migration.cli import --confirm"
                )
                return 2
            print(
                "MANUAL ACTION REQUIRED was satisfied only if DATABASE_URL points at "
                "a non-production or explicitly approved database."
            )
            report = migrate_from_json(
                academy,
                dry_run=False,
                do_backup=not args.no_backup,
            )
            print(json.dumps(report.as_dict(), indent=2, default=str))
            return 1 if report.errors else 0

        if args.command == "verify":
            anchors = [a.strip() for a in args.anchors.split(",") if a.strip()]
            report = verify_migration(academy, anchor_usernames=anchors)
            print(json.dumps(report.as_dict(), indent=2, default=str))
            return 0 if report.ok else 1
    finally:
        close_pool()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

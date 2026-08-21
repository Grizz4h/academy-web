#!/usr/bin/env python3
"""Run Phase 3A identity migration (idempotent).

Usage (from repo root or backend/):
  cd /opt/academy-web/backend && python -m identity.migrate_cli
"""

from __future__ import annotations

import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))  # .../backend/identity
PACKAGE_PARENT = os.path.dirname(BACKEND_DIR)  # .../backend
if PACKAGE_PARENT not in sys.path:
    sys.path.insert(0, PACKAGE_PARENT)

REPO_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, "..", ".."))
DATA_ACADEMY = os.path.join(REPO_ROOT, "data", "academy")
ROOT_DATA = os.path.join(REPO_ROOT, "data")


def main() -> int:
    from identity.store import IdentityStore
    from identity.migrate import run_identity_migration

    store = IdentityStore(os.path.join(DATA_ACADEMY, "identity_store.json"))
    report = run_identity_migration(
        store=store,
        users_file=os.path.join(DATA_ACADEMY, "users.json"),
        profiles_dir=os.path.join(DATA_ACADEMY, "profiles"),
        rewards_dir=os.path.join(DATA_ACADEMY, "rewards"),
        sessions_dir=os.path.join(DATA_ACADEMY, "sessions"),
        scenes_dir=os.path.join(ROOT_DATA, "scenes"),
        observations_dir=os.path.join(ROOT_DATA, "observations"),
        uploads_dir=os.path.join(DATA_ACADEMY, "uploads"),
        backup_root=os.path.join(ROOT_DATA, "backups"),
        create_backup=True,
    )
    print("backup:", report.get("backup"))
    print("users mapped:", len(report.get("mapping") or {}))
    for u, uid in sorted((report.get("mapping") or {}).items()):
        print(f"  {u} -> {uid}")
    print("actions:", len(report.get("actions") or []))
    for line in (report.get("actions") or [])[:40]:
        print(" ", line)
    if len(report.get("actions") or []) > 40:
        print(f"  ... +{len(report['actions']) - 40} more")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

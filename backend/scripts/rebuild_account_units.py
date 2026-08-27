#!/usr/bin/env python3
"""Rebuild one account's unit/slot grants from sessions (new syntax).

Honours STORAGE_BACKEND (json or postgres). Live stack uses postgres.

Usage:
  /opt/academy-web/backend/.venv/bin/python backend/scripts/rebuild_account_units.py --legacy-username christoph
  /opt/academy-web/backend/.venv/bin/python backend/scripts/rebuild_account_units.py --legacy-username christoph --apply
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _load_env() -> None:
    """Load repo env files without requiring python-dotenv."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        load_dotenv = None
    if load_dotenv is not None:
        load_dotenv(ROOT / ".env")
        load_dotenv(ROOT / ".env.local")
        return
    for name in (".env", ".env.local"):
        path = ROOT / name
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            if key and key not in os.environ:
                os.environ[key] = value


def _repos():
    from identity.store import IdentityStore
    from repositories.wiring import configure_repositories, get_repos

    backend = (os.environ.get("STORAGE_BACKEND") or "json").strip().lower()
    store = IdentityStore(str(ROOT / "data" / "academy" / "identity_store.json"))
    configure_repositories(
        get_identity_store=lambda: store,
        get_users_file=lambda: str(ROOT / "data" / "academy" / "users.json"),
        get_profiles_dir=lambda: str(ROOT / "data" / "academy" / "profiles"),
        get_rewards_dir=lambda: str(ROOT / "data" / "academy" / "rewards"),
        get_sessions_dir=lambda: str(ROOT / "data" / "academy" / "sessions"),
        get_entitlements_file=lambda: str(ROOT / "data" / "academy" / "entitlement_grants.json"),
        storage_backend=backend,
    )
    return get_repos()


def main() -> int:
    from identity.context import AuthContext
    from progression.grants import compute_unified_base_grants
    from progression.level_curve import get_level_from_xp
    from progression.session_events import activity_events_from_sessions

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id")
    parser.add_argument("--legacy-username")
    parser.add_argument("--apply", action="store_true", help="Write reward state")
    args = parser.parse_args()

    _load_env()
    repos = _repos()
    print(f"storage_backend={repos.backend}")

    if args.user_id:
        user_id = args.user_id
        legacy = None
    elif args.legacy_username:
        legacy = args.legacy_username.strip().lower()
        ctx = repos.identity.ensure_legacy_identity(legacy)
        user_id = ctx.rinq_user_id
    else:
        raise SystemExit("need --user-id or --legacy-username")

    user = AuthContext(
        auth_subject=legacy or user_id,
        display_name=legacy or "user",
        legacy_username=legacy,
        rinq_user_id=user_id,
        auth_provider="legacy_password",
    )

    current = repos.rewards.get_reward_state(user)
    sessions = repos.sessions.list_sessions_for_user(user)
    print(f"user={user_id}")
    print(
        f"current xp={current.get('xp')} level={get_level_from_xp(int(current.get('xp') or 0))} "
        f"units={len(current.get('processedUnits') or {})} "
        f"pux={(current.get('currency') or {}).get('PUX')}"
    )
    print(f"sessions_listed={len(sessions)}")

    events, sessions_by_id = activity_events_from_sessions(sessions, user_id=user_id)
    scratch = {
        "processedUnits": {},
        "processedGrantKeys": {},
        "unlockedCosmetics": {},
    }
    evaluated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    xp, pux, cosmetics, logs = compute_unified_base_grants(
        scratch,
        events,
        sessions_by_id=sessions_by_id,
        evaluated_at=evaluated_at,
    )

    print(f"events={len(events)}")
    print(f"recomputed units={len(scratch['processedUnits'])} xp=+{xp} pux=+{pux} level={get_level_from_xp(xp)}")
    print("cosmetics:", sorted(c.get("cosmeticId") for c in cosmetics))
    grant_lines = [line for line in logs if line.startswith("grant:")]
    print(f"grants={len(grant_lines)} skips={len(logs) - len(grant_lines)}")

    if not args.apply:
        print("dry-run only (pass --apply to write)")
        return 0

    preserved = {}
    for cid, entry in (current.get("unlockedCosmetics") or {}).items():
        if isinstance(entry, dict) and (
            entry.get("earnKind") == "purchased" or entry.get("sourceType") == "pux_shop"
        ):
            preserved[cid] = entry

    shop_spent = 0
    shop_txs = [
        tx
        for tx in (current.get("puxTransactions") or [])
        if isinstance(tx, dict) and tx.get("sourceType") == "pux_shop"
    ]
    for tx in shop_txs:
        shop_spent += int(tx.get("amount") or 0)

    next_state = dict(current)
    next_state["xp"] = int(xp)
    next_state["currency"] = {"PUX": max(0, int(pux) - shop_spent)}
    next_state["processedUnits"] = scratch["processedUnits"]
    next_state["processedGrantKeys"] = scratch["processedGrantKeys"]
    next_state["unlockedCosmetics"] = {**preserved, **(scratch.get("unlockedCosmetics") or {})}
    next_state["developmentDataCleanupKind"] = "rebuild_units_from_sessions"
    next_state["developmentDataCleanupAt"] = evaluated_at
    repos.rewards.save_reward_state(user, next_state)
    saved = repos.rewards.get_reward_state(user)
    print(
        f"wrote backend={repos.backend} xp={saved.get('xp')} "
        f"level={get_level_from_xp(int(saved.get('xp') or 0))} "
        f"units={len(saved.get('processedUnits') or {})} "
        f"cosmetics={len(saved.get('unlockedCosmetics') or {})}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

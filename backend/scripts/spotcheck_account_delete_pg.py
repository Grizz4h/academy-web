#!/usr/bin/env python3
"""Spotcheck account delete cascade under STORAGE_BACKEND=postgres.

Creates a throwaway legacy user, deletes via account_lifecycle.delete_account,
then asserts no leftover rows for that rinq_user_id in core PG tables.

Usage:

  cd /opt/academy-web/backend
  set -a && source ../.env.local && set +a
  .venv/bin/python scripts/spotcheck_account_delete_pg.py
"""

from __future__ import annotations

import json
import os
import secrets
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
ROOT = BACKEND.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def _load_env() -> None:
    env_path = ROOT / ".env.local"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip("'").strip('"'))


def main() -> int:
    _load_env()
    if (os.environ.get("STORAGE_BACKEND") or "").strip().lower() != "postgres":
        print("FAIL: STORAGE_BACKEND must be postgres", file=sys.stderr)
        return 2

    from account_lifecycle import delete_account
    from auth_utils import hash_password
    from db.pool import configure_pool, connection
    from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER
    from identity.store import IdentityStore
    from repositories.wiring import configure_repositories, get_repos

    configure_pool()
    data = ROOT / "data" / "academy"
    store = IdentityStore(str(data / "identity_store.json"))
    configure_repositories(
        get_identity_store=lambda: store,
        get_users_file=lambda: str(data / "users.json"),
        get_profiles_dir=lambda: str(data / "profiles"),
        get_rewards_dir=lambda: str(data / "rewards"),
        get_sessions_dir=lambda: str(data / "sessions"),
        get_entitlements_file=lambda: str(data / "entitlement_grants.json"),
        storage_backend="postgres",
    )
    repos = get_repos()

    username = f"delete-spot-{secrets.token_hex(4)}"
    ctx_id = repos.identity.ensure_legacy_identity(username, display_name="Delete Spotcheck")
    rinq = ctx_id.rinq_user_id
    repos.credentials.upsert_user(
        {
            "username": username,
            "password_hash": hash_password(secrets.token_urlsafe(12)),
            "rinq_user_id": rinq,
            "role": "user",
        }
    )
    user = AuthContext(
        rinq_user_id=rinq,
        auth_provider=LEGACY_PASSWORD_PROVIDER,
        auth_subject=username,
        display_name="Delete Spotcheck",
        legacy_username=username,
    )

    def count_rows() -> dict[str, int]:
        tables = [
            "app_users",
            "auth_links",
            "legacy_credentials",
            "profiles",
            "sessions",
            "entitlement_grants",
            "subscriptions",
            "entitlements",
            "evidence_events",
            "user_competency_states",
        ]
        out: dict[str, int] = {}
        with connection() as conn:
            for table in tables:
                if table == "app_users":
                    sql = "SELECT count(*) AS c FROM app_users WHERE rinq_user_id = %s::uuid"
                else:
                    sql = f"SELECT count(*) AS c FROM {table} WHERE rinq_user_id = %s::uuid"
                row = conn.execute(sql, (rinq,)).fetchone()
                out[table] = int(row["c"] if isinstance(row, dict) else row[0])
        return out

    before = count_rows()
    print("created", username, rinq)
    print("rows_before", json.dumps(before))
    if before.get("app_users", 0) < 1:
        print("FAIL: user not in app_users", file=sys.stderr)
        return 1

    # Production delete uses get_repos().identity (PG), not the JSON IdentityStore file.
    summary = delete_account(
        user,
        identity_store=repos.identity,
        profiles_dir=str(data / "profiles"),
        rewards_dir=str(data / "rewards"),
        sessions_dir=str(data / "sessions"),
        scenes_dir=str(data / "scenes"),
        obs_runs_dir=str(data / "observations" / "runs"),
        obs_entries_dir=str(data / "observations" / "entries"),
        obs_players_dir=str(data / "observations" / "players"),
        avatars_dir=str(ROOT / "data" / "uploads" / "avatars"),
        users_file=str(data / "users.json"),
        remove_legacy_user_row=lambda u: bool(repos.credentials.delete_legacy_credential(u)),
    )
    print("delete_summary", json.dumps(summary, default=str))
    after = count_rows()
    print("rows_after", json.dumps(after))

    leaks = {k: v for k, v in after.items() if v > 0}
    if leaks:
        print("FAIL: leftover rows", leaks, file=sys.stderr)
        return 1

    print("OK: postgres cascade clean for throwaway legacy user")
    print("NOTE: Stripe detach runs on delete (skipped when no customer).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

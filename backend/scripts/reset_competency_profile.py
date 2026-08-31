#!/usr/bin/env python3
"""Reset competency evidence + derived states for one user (dev / smoke hygiene).

Does NOT delete sessions, rewards, or entitlements.

Usage:
  cd backend
  .venv/bin/python scripts/reset_competency_profile.py --username paywall-widerruf --yes
  .venv/bin/python scripts/reset_competency_profile.py --rinq-user-id <uuid> --yes
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(ROOT / ".env")
    load_dotenv(ROOT / ".env.local")


def _repos():
    from repositories.wiring import configure_repositories, get_repos
    from identity.store import IdentityStore
    from db.settings import storage_backend

    store = IdentityStore(str(ROOT / "data" / "academy" / "identity_store.json"))
    configure_repositories(
        get_identity_store=lambda: store,
        get_users_file=lambda: str(ROOT / "data" / "academy" / "users.json"),
        get_profiles_dir=lambda: str(ROOT / "data" / "academy" / "profiles"),
        get_rewards_dir=lambda: str(ROOT / "data" / "academy" / "rewards"),
        get_sessions_dir=lambda: str(ROOT / "data" / "academy" / "sessions"),
        get_entitlements_file=lambda: str(ROOT / "data" / "academy" / "entitlement_grants.json"),
        storage_backend=storage_backend(),
    )
    return get_repos()


def _resolve_rinq_user_id(repos, username: str) -> str | None:
    from identity.context import LEGACY_PASSWORD_PROVIDER
    from identity.store import normalize_subject

    subject = normalize_subject(username)
    if not subject:
        return None

    link = repos.identity.find_auth_link(LEGACY_PASSWORD_PROVIDER, subject)
    if link and link.get("rinq_user_id"):
        return str(link["rinq_user_id"])

    # Postgres legacy_credentials fallback
    try:
        from db.settings import storage_backend
        from db.pool import connection
        from psycopg.rows import dict_row

        if storage_backend() != "postgres":
            return None
        with connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT rinq_user_id::text AS rinq_user_id
                    FROM legacy_credentials
                    WHERE lower(username) = lower(%s)
                    LIMIT 1
                    """,
                    (username,),
                )
                row = cur.fetchone()
        return str(row["rinq_user_id"]) if row else None
    except Exception:
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--username", help="Legacy username / auth subject")
    parser.add_argument("--rinq-user-id", help="Stable RinQ UUID")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()
    if not args.username and not args.rinq_user_id:
        parser.error("Provide --username or --rinq-user-id")

    _load_env()

    from identity.context import AuthContext
    from competency.service import CompetencyRecomputeService

    repos = _repos()
    legacy = (args.username or "").strip()
    rinq_user_id = (args.rinq_user_id or "").strip()

    if not rinq_user_id and legacy:
        rinq_user_id = _resolve_rinq_user_id(repos, legacy) or ""
        if not rinq_user_id:
            print(f"User not found: {legacy}", file=sys.stderr)
            return 1

    user = AuthContext(
        rinq_user_id=rinq_user_id,
        auth_provider="legacy_password",
        auth_subject=legacy or rinq_user_id,
        display_name=legacy or rinq_user_id,
        legacy_username=legacy or None,
    )

    print(f"Reset competency for rinq_user_id={rinq_user_id} subject={user.auth_subject}")
    if not args.yes:
        confirm = input("Delete ALL evidence_events + user_competency_states for this user? [y/N] ")
        if confirm.strip().lower() not in ("y", "yes"):
            print("Aborted.")
            return 0

    service = CompetencyRecomputeService(repos.competency_events, repos.competency_states)
    result = service.reset_user_profile(user)
    print(
        f"Done. deleted_events={result['deleted_events']} "
        f"deleted_states={result['deleted_states']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Create or reset the dedicated paywall / Stripe test account (Postgres only).

Usage:
  cd backend && .venv/bin/python scripts/paywall_test_user.py create
  cd backend && .venv/bin/python scripts/paywall_test_user.py reset
  cd backend && .venv/bin/python scripts/paywall_test_user.py status

Default username: paywall-test (override with PAYWALL_TEST_USERNAME).
Default password: PAYWALL_TEST_PASSWORD env or a generated one on create.
"""

from __future__ import annotations

import argparse
import os
import secrets
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

DEFAULT_USERNAME = "paywall-test"


def _load_env() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    root = BACKEND_DIR.parent
    load_dotenv(root / ".env")
    load_dotenv(root / ".env.local")


def _configure() -> None:
    from db.settings import storage_backend

    if storage_backend() != "postgres":
        raise SystemExit("paywall test user requires STORAGE_BACKEND=postgres")


def _repos():
    from repositories.wiring import configure_repositories, get_repos
    from identity.store import IdentityStore

    store = IdentityStore(str(BACKEND_DIR.parent / "data" / "academy" / "identity_store.json"))
    configure_repositories(
        get_identity_store=lambda: store,
        get_users_file=lambda: str(BACKEND_DIR.parent / "data" / "academy" / "users.json"),
        get_profiles_dir=lambda: str(BACKEND_DIR.parent / "data" / "academy" / "profiles"),
        get_rewards_dir=lambda: str(BACKEND_DIR.parent / "data" / "academy" / "rewards"),
        get_sessions_dir=lambda: str(BACKEND_DIR.parent / "data" / "academy" / "sessions"),
        get_entitlements_file=lambda: str(BACKEND_DIR.parent / "data" / "academy" / "entitlement_grants.json"),
        storage_backend="postgres",
    )
    return get_repos()


def _username() -> str:
    return (os.environ.get("PAYWALL_TEST_USERNAME") or DEFAULT_USERNAME).strip().lower()


def cmd_create(args: argparse.Namespace) -> int:
    from auth_utils import hash_password
    from entitlements.feature_keys import ACADEMY_PREMIUM
    from db.pool import configure_pool, connection, transaction

    password = (os.environ.get("PAYWALL_TEST_PASSWORD") or "").strip()
    if not password:
        password = secrets.token_urlsafe(18)
        generated = True
    else:
        generated = False

    repos = _repos()
    username = _username()
    ctx = repos.identity.ensure_legacy_identity(username, display_name="Paywall Test")
    repos.credentials.upsert_user(
        {
            "username": username,
            "password_hash": hash_password(password),
            "rinq_user_id": ctx.rinq_user_id,
            "role": "user",
        }
    )
    repos.entitlements.revoke_entitlement(ctx.rinq_user_id, ACADEMY_PREMIUM)

    with transaction() as conn:
        conn.execute("DELETE FROM subscriptions WHERE rinq_user_id = %s::uuid", (ctx.rinq_user_id,))
        conn.execute("DELETE FROM entitlements WHERE rinq_user_id = %s::uuid", (ctx.rinq_user_id,))

    print("Paywall test account ready")
    print(f"  username:     {username}")
    print(f"  rinq_user_id: {ctx.rinq_user_id}")
    print(f"  premium:      none (revoked / no grants)")
    if generated and not args.quiet_password:
        print(f"  password:     {password}")
        print("  (save this password — not stored in git; set PAYWALL_TEST_PASSWORD to fix it)")
    elif not generated:
        print("  password:     (from PAYWALL_TEST_PASSWORD)")
    print("\nLogin: Legacy username + password on RinQ Tank.")
    print("Test: A2 should be locked → Premium freischalten → Stripe test checkout.")
    return 0


def cmd_reset(args: argparse.Namespace) -> int:
    from entitlements.feature_keys import ACADEMY_PREMIUM
    from db.pool import transaction

    repos = _repos()
    username = _username()
    link = repos.identity.find_auth_link("legacy_password", username)
    if not link:
        print(f"No identity for username={username!r}; run create first", file=sys.stderr)
        return 1
    rinq = link["rinq_user_id"]
    repos.entitlements.revoke_entitlement(rinq, ACADEMY_PREMIUM)
    with transaction() as conn:
        conn.execute("DELETE FROM subscriptions WHERE rinq_user_id = %s::uuid", (rinq,))
        conn.execute("DELETE FROM entitlements WHERE rinq_user_id = %s::uuid", (rinq,))
    print(f"Reset paywall state for {username} ({rinq})")
    print("  academy_premium revoked, billing snapshot cleared")
    print("  (Stripe subscription in Dashboard may still exist — cancel there if needed)")
    return 0


def cmd_status(_: argparse.Namespace) -> int:
    from entitlements.feature_keys import ACADEMY_PREMIUM
    from billing.persistence import get_billing_status

    repos = _repos()
    username = _username()
    link = repos.identity.find_auth_link("legacy_password", username)
    if not link:
        print(f"User {username!r} does not exist — run create")
        return 1
    rinq = link["rinq_user_id"]
    has_premium = repos.entitlements.has_access(rinq, ACADEMY_PREMIUM)
    grants = repos.entitlements.list_user_entitlements(rinq)
    billing = get_billing_status(rinq)
    print(f"username:     {username}")
    print(f"rinq_user_id: {rinq}")
    print(f"has_access:   {has_premium}")
    print(f"grants:       {grants}")
    print(f"billing:      {billing}")
    return 0


def main() -> int:
    _load_env()
    _configure()
    from db.pool import configure_pool

    configure_pool()

    parser = argparse.ArgumentParser(description="Paywall / Stripe test account ops")
    parser.add_argument("--quiet-password", action="store_true", help="Do not print generated password")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("create", help="Create or update test user without premium")
    sub.add_parser("reset", help="Revoke premium + clear billing rows for retest")
    sub.add_parser("status", help="Show grants and billing snapshot")
    args = parser.parse_args()

    if args.cmd == "create":
        return cmd_create(args)
    if args.cmd == "reset":
        return cmd_reset(args)
    if args.cmd == "status":
        return cmd_status(args)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

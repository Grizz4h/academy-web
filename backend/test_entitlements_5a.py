"""Phase 5A — entitlement domain foundation tests."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["ACADEMY_ADMIN_USERNAMES"] = "adminuser"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import jwt
from fastapi.testclient import TestClient

import main as backend_main
from entitlements.access_config import required_feature_for_module
from entitlements.access_service import AccessResource, can_access
from entitlements.feature_keys import ACADEMY_PREMIUM
from entitlements.models import EntitlementGrant, is_grant_active
from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER
from identity.store import IdentityStore
from repositories.errors import NotFoundError
from repositories.json_entitlement import JsonEntitlementRepository
from repositories.wiring import configure_repositories, get_repos
from security_guards import reset_rate_limiter_for_tests

JWT_ALGO = "HS256"


def _token(sub: str) -> str:
    return jwt.encode(
        {
            "sub": sub,
            "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
        },
        os.environ["ACADEMY_JWT_SECRET"],
        algorithm=JWT_ALGO,
    )


def _ctx(rinq: str, *, legacy: str | None = None) -> AuthContext:
    return AuthContext(
        rinq_user_id=rinq,
        auth_provider=LEGACY_PASSWORD_PROVIDER,
        auth_subject=legacy or "sub",
        display_name=legacy or "User",
        legacy_username=legacy,
    )


class EntitlementRepositoryTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        self.store = IdentityStore(str(root / "identity_store.json"))
        alice = self.store.ensure_legacy_identity("alice")
        self.alice_id = alice.rinq_user_id
        self.repo = JsonEntitlementRepository(
            lambda: str(root / "entitlement_grants.json"),
            lambda: self.store,
        )

    def tearDown(self):
        self._tmp.cleanup()

    def test_grant_access_and_revoke(self):
        self.assertFalse(self.repo.has_access(self.alice_id, ACADEMY_PREMIUM))
        grant = self.repo.grant_entitlement(
            self.alice_id,
            ACADEMY_PREMIUM,
            source="manual",
        )
        self.assertEqual(grant["feature_key"], ACADEMY_PREMIUM)
        self.assertTrue(self.repo.has_access(self.alice_id, ACADEMY_PREMIUM))
        active = self.repo.get_active_entitlements(self.alice_id)
        self.assertEqual(len(active), 1)
        self.assertTrue(self.repo.revoke_entitlement(self.alice_id, ACADEMY_PREMIUM))
        self.assertFalse(self.repo.has_access(self.alice_id, ACADEMY_PREMIUM))
        self.assertEqual(self.repo.get_active_entitlements(self.alice_id), [])

    def test_expired_grant_denied(self):
        past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        self.repo.grant_entitlement(
            self.alice_id,
            ACADEMY_PREMIUM,
            source="promo",
            expires_at=past,
        )
        self.assertFalse(self.repo.has_access(self.alice_id, ACADEMY_PREMIUM))
        self.assertEqual(self.repo.get_active_entitlements(self.alice_id), [])

    def test_unknown_user_rejected(self):
        with self.assertRaises(NotFoundError):
            self.repo.grant_entitlement(
                "99999999-9999-9999-9999-999999999999",
                ACADEMY_PREMIUM,
                source="manual",
            )

    def test_invalid_feature_key_rejected(self):
        with self.assertRaises(ValueError):
            self.repo.grant_entitlement(self.alice_id, "client_premium_hack", source="manual")


class AccessServiceTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        store = IdentityStore(str(root / "identity_store.json"))
        alice = store.ensure_legacy_identity("alice")
        self.alice_id = alice.rinq_user_id
        configure_repositories(
            get_identity_store=lambda: store,
            get_users_file=lambda: str(root / "users.json"),
            get_profiles_dir=lambda: str(root / "profiles"),
            get_rewards_dir=lambda: str(root / "rewards"),
            get_sessions_dir=lambda: str(root / "sessions"),
            get_entitlements_file=lambda: str(root / "entitlement_grants.json"),
            storage_backend="json",
        )
        self.user = _ctx(self.alice_id, legacy="alice")

    def tearDown(self):
        self._tmp.cleanup()

    def test_free_module_without_grant(self):
        self.assertIsNone(required_feature_for_module("A1"))
        self.assertTrue(
            can_access(self.user, AccessResource(kind="module", module_id="A1"))
        )

    def test_premium_module_requires_grant(self):
        self.assertFalse(
            can_access(self.user, AccessResource(kind="module", module_id="A2"))
        )
        get_repos().entitlements.grant_entitlement(
            self.alice_id,
            ACADEMY_PREMIUM,
            source="manual",
        )
        self.assertTrue(
            can_access(self.user, AccessResource(kind="module", module_id="A2"))
        )

    def test_admin_bypasses_premium(self):
        admin = _ctx("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", legacy="adminuser")
        with mock.patch.dict(os.environ, {"ACADEMY_ADMIN_USERNAMES": "adminuser"}):
            self.assertTrue(
                can_access(admin, AccessResource(kind="module", module_id="A2"))
            )


class GrantActiveHelperTests(unittest.TestCase):
    def test_revoked_not_active(self):
        grant = EntitlementGrant(
            id="1",
            rinq_user_id="u",
            feature_key=ACADEMY_PREMIUM,
            status="revoked",
            source="manual",
            created_at=None,
            updated_at=None,
            expires_at=None,
            metadata={},
        )
        self.assertFalse(is_grant_active(grant))


class EntitlementApiTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        academy = root / "academy"
        academy.mkdir()
        (academy / "profiles").mkdir()
        (academy / "rewards").mkdir()
        (academy / "sessions").mkdir()

        self._prev = {
            "USERS_FILE": backend_main.USERS_FILE,
            "DATA_DIR": backend_main.DATA_DIR,
            "PROFILES_DIR": backend_main.PROFILES_DIR,
            "REWARDS_DIR": backend_main.REWARDS_DIR,
            "SESSIONS_DIR": backend_main.SESSIONS_DIR,
            "IDENTITY_STORE_FILE": backend_main.IDENTITY_STORE_FILE,
            "ENTITLEMENTS_FILE": backend_main.ENTITLEMENTS_FILE,
        }

        users_file = academy / "users.json"
        users_file.write_text(
            json.dumps(
                {
                    "users": [
                        {
                            "username": "alice",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01",
                            "role": "user",
                        },
                        {
                            "username": "adminuser",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01",
                            "role": "user",
                        },
                    ]
                }
            ),
            encoding="utf-8",
        )
        backend_main.USERS_FILE = str(users_file)
        backend_main.DATA_DIR = str(academy)
        backend_main.PROFILES_DIR = str(academy / "profiles")
        backend_main.REWARDS_DIR = str(academy / "rewards")
        backend_main.SESSIONS_DIR = str(academy / "sessions")
        backend_main.ENTITLEMENTS_FILE = str(academy / "entitlement_grants.json")
        backend_main.IDENTITY_STORE_FILE = str(academy / "identity_store.json")
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        alice = backend_main._identity_store.ensure_legacy_identity("alice")
        backend_main._identity_store.ensure_legacy_identity("adminuser")
        self.alice_id = alice.rinq_user_id
        configure_repositories(
            get_identity_store=lambda: backend_main._identity_store,
            get_users_file=lambda: backend_main.USERS_FILE,
            get_profiles_dir=lambda: backend_main.PROFILES_DIR,
            get_rewards_dir=lambda: backend_main.REWARDS_DIR,
            get_sessions_dir=lambda: backend_main.SESSIONS_DIR,
            get_entitlements_file=lambda: backend_main.ENTITLEMENTS_FILE,
            storage_backend="json",
        )
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def test_non_admin_cannot_grant(self):
        res = self.client.post(
            "/api/admin/entitlements/grant",
            headers={"Authorization": f"Bearer {_token('alice')}"},
            json={
                "rinq_user_id": self.alice_id,
                "feature_key": ACADEMY_PREMIUM,
                "source": "manual",
            },
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_grant_and_me_list(self):
        grant = self.client.post(
            "/api/admin/entitlements/grant",
            headers={"Authorization": f"Bearer {_token('adminuser')}"},
            json={
                "rinq_user_id": self.alice_id,
                "feature_key": ACADEMY_PREMIUM,
                "source": "manual",
            },
        )
        self.assertEqual(grant.status_code, 200)
        me = self.client.get(
            "/api/me/entitlements",
            headers={"Authorization": f"Bearer {_token('alice')}"},
        )
        self.assertEqual(me.status_code, 200)
        keys = [g["feature_key"] for g in me.json()["entitlements"]]
        self.assertIn(ACADEMY_PREMIUM, keys)

    def test_admin_revoke(self):
        self.client.post(
            "/api/admin/entitlements/grant",
            headers={"Authorization": f"Bearer {_token('adminuser')}"},
            json={
                "rinq_user_id": self.alice_id,
                "feature_key": ACADEMY_PREMIUM,
                "source": "manual",
            },
        )
        revoke = self.client.post(
            "/api/admin/entitlements/revoke",
            headers={"Authorization": f"Bearer {_token('adminuser')}"},
            json={
                "rinq_user_id": self.alice_id,
                "feature_key": ACADEMY_PREMIUM,
            },
        )
        self.assertEqual(revoke.status_code, 200)
        me = self.client.get(
            "/api/me/entitlements",
            headers={"Authorization": f"Bearer {_token('alice')}"},
        )
        self.assertEqual(me.json()["entitlements"], [])


if __name__ == "__main__":
    unittest.main()

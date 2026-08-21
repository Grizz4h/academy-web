"""Phase 3C Supabase Google identity + token routing tests."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest import mock
from uuid import uuid4

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["ACADEMY_ALLOW_LEGACY_SIGNUP"] = "0"
os.environ["SUPABASE_URL"] = "https://example.supabase.co"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import jwt
from fastapi.testclient import TestClient
from security_guards import reset_rate_limiter_for_tests

import main as backend_main
from identity.context import SUPABASE_GOOGLE_PROVIDER
from identity.store import IdentityStore


JWT_ALGO = "HS256"


def _legacy_token(sub: str) -> str:
    return jwt.encode(
        {
            "sub": sub,
            "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
        },
        os.environ["ACADEMY_JWT_SECRET"],
        algorithm=JWT_ALGO,
    )


class ProviderIdentityTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        self.store = IdentityStore(str(Path(self._tmp.name) / "identity_store.json"))

    def tearDown(self):
        self._tmp.cleanup()

    def test_ensure_provider_idempotent(self):
        sub = str(uuid4())
        a = self.store.ensure_provider_identity(SUPABASE_GOOGLE_PROVIDER, sub)
        b = self.store.ensure_provider_identity(SUPABASE_GOOGLE_PROVIDER, sub)
        self.assertEqual(a.rinq_user_id, b.rinq_user_id)
        self.assertEqual(a.auth_provider, SUPABASE_GOOGLE_PROVIDER)
        data = self.store.load()
        self.assertEqual(len(data["identities"]), 1)
        self.assertEqual(len(data["auth_links"]), 1)
        self.assertIsNone(data["identities"][0].get("legacy_username"))

    def test_different_subjects_get_different_uuids(self):
        a = self.store.ensure_provider_identity(SUPABASE_GOOGLE_PROVIDER, str(uuid4()))
        b = self.store.ensure_provider_identity(SUPABASE_GOOGLE_PROVIDER, str(uuid4()))
        self.assertNotEqual(a.rinq_user_id, b.rinq_user_id)


class SupabaseApiTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        academy = root / "academy"
        academy.mkdir()
        (academy / "profiles").mkdir()
        (academy / "rewards").mkdir()
        (academy / "sessions").mkdir()
        (academy / "uploads" / "avatars").mkdir(parents=True)

        self._prev = {
            "USERS_FILE": backend_main.USERS_FILE,
            "DATA_DIR": backend_main.DATA_DIR,
            "PROFILES_DIR": backend_main.PROFILES_DIR,
            "REWARDS_DIR": backend_main.REWARDS_DIR,
            "SESSIONS_DIR": backend_main.SESSIONS_DIR,
            "IDENTITY_STORE_FILE": backend_main.IDENTITY_STORE_FILE,
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
                        }
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
        backend_main.IDENTITY_STORE_FILE = str(academy / "identity_store.json")
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client = TestClient(backend_main.app)
        self.google_sub = str(uuid4())

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def test_legacy_login_still_works(self):
        res = self.client.post(
            "/api/auth/login",
            json={"username": "alice", "password": "secret"},
        )
        self.assertEqual(res.status_code, 200)
        me = self.client.get(
            "/api/me",
            headers={"Authorization": f"Bearer {res.json()['token']}"},
        )
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["auth_provider"], "legacy_password")

    def test_signup_still_closed(self):
        self.assertFalse(
            self.client.get("/api/auth/registration").json()["allow_legacy_signup"]
        )

    def test_invalid_supabase_token_401(self):
        res = self.client.get(
            "/api/me",
            headers={"Authorization": "Bearer not-a-real-supabase-token"},
        )
        self.assertEqual(res.status_code, 401)

    def test_google_claims_create_stable_uuid(self):
        claims = {
            "sub": self.google_sub,
            "role": "authenticated",
            "app_metadata": {"provider": "google", "providers": ["google"]},
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }

        def fake_verify(token: str):
            self.assertEqual(token, "supabase-access-token")
            return claims

        with mock.patch("main.verify_supabase_access_token", side_effect=fake_verify):
            me1 = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
            me2 = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertEqual(me1.status_code, 200)
        self.assertEqual(me2.status_code, 200)
        self.assertEqual(me1.json()["rinq_user_id"], me2.json()["rinq_user_id"])
        self.assertEqual(me1.json()["auth_provider"], SUPABASE_GOOGLE_PROVIDER)
        self.assertFalse(me1.json().get("is_admin"))

    def test_non_google_supabase_rejected(self):
        claims = {
            "sub": str(uuid4()),
            "role": "authenticated",
            "app_metadata": {"provider": "phone", "providers": ["phone"]},
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }
        with mock.patch("main.verify_supabase_access_token", return_value=claims):
            res = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertEqual(res.status_code, 401)

    def test_foreign_subject_cannot_steal_link(self):
        first = backend_main._identity_store.ensure_provider_identity(
            SUPABASE_GOOGLE_PROVIDER, "subject-a"
        )
        other = backend_main._identity_store.ensure_provider_identity(
            SUPABASE_GOOGLE_PROVIDER, "subject-b"
        )
        # Re-link same subject to same user is idempotent
        backend_main._identity_store.link_provider(
            first.rinq_user_id, SUPABASE_GOOGLE_PROVIDER, "subject-a"
        )
        with self.assertRaises(ValueError):
            backend_main._identity_store.link_provider(
                other.rinq_user_id, SUPABASE_GOOGLE_PROVIDER, "subject-a"
            )


if __name__ == "__main__":
    unittest.main()

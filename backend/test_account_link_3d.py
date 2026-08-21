"""Phase 3D — verified Google account linking (no email merge)."""

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

import main as backend_main
from identity.context import SUPABASE_GOOGLE_PROVIDER


JWT_ALGO = "HS256"


class AccountLinkingTests(unittest.TestCase):
    def setUp(self):
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
        }

        users_file = academy / "users.json"
        users_file.write_text(
            json.dumps(
                {
                    "users": [
                        {
                            "username": "Christoph",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01",
                            "role": "admin",
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
        login = self.client.post(
            "/api/auth/login",
            json={"username": "Christoph", "password": "secret"},
        )
        self.assertEqual(login.status_code, 200)
        self.legacy_token = login.json()["token"]
        self.rinq_id = login.json()["rinq_user_id"]
        self.google_sub = str(uuid4())

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def _google_claims(self, sub: str | None = None):
        return {
            "sub": sub or self.google_sub,
            "role": "authenticated",
            "app_metadata": {"provider": "google", "providers": ["google"]},
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }

    def test_link_google_to_legacy_account(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            res = self.client.post(
                "/api/me/auth/link/google",
                headers={"Authorization": f"Bearer {self.legacy_token}"},
                json={"access_token": "supabase-access-token"},
            )
        self.assertEqual(res.status_code, 200, res.text)
        body = res.json()
        self.assertTrue(body["google_linked"])
        self.assertEqual(body["rinq_user_id"], self.rinq_id)
        self.assertIn(SUPABASE_GOOGLE_PROVIDER, body["auth_providers"])

        me = self.client.get(
            "/api/me",
            headers={"Authorization": f"Bearer {self.legacy_token}"},
        )
        self.assertTrue(me.json()["google_linked"])

        # Same Google login resolves to Christoph UUID
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            via_google = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertEqual(via_google.status_code, 200)
        self.assertEqual(via_google.json()["rinq_user_id"], self.rinq_id)

    def test_link_conflict_with_other_legacy_bound_identity(self):
        other = backend_main._identity_store.ensure_legacy_identity("otheruser")
        backend_main._identity_store.link_provider(
            other.rinq_user_id, SUPABASE_GOOGLE_PROVIDER, self.google_sub
        )
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            res = self.client.post(
                "/api/me/auth/link/google",
                headers={"Authorization": f"Bearer {self.legacy_token}"},
                json={"access_token": "supabase-access-token"},
            )
        self.assertEqual(res.status_code, 409)

    def test_reclaim_orphan_google_only_identity(self):
        orphan = backend_main._identity_store.ensure_provider_identity(
            SUPABASE_GOOGLE_PROVIDER, self.google_sub
        )
        self.assertNotEqual(orphan.rinq_user_id, self.rinq_id)
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            res = self.client.post(
                "/api/me/auth/link/google",
                headers={"Authorization": f"Bearer {self.legacy_token}"},
                json={"access_token": "supabase-access-token"},
            )
        self.assertEqual(res.status_code, 200, res.text)
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            via_google = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertEqual(via_google.json()["rinq_user_id"], self.rinq_id)

    def test_link_requires_auth(self):
        res = self.client.post(
            "/api/me/auth/link/google",
            json={"access_token": "x"},
        )
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

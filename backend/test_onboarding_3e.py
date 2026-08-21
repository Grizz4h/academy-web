"""Phase 3E — first-login display name onboarding."""

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

from fastapi.testclient import TestClient
from security_guards import reset_rate_limiter_for_tests

import main as backend_main
from identity.context import SUPABASE_GOOGLE_PROVIDER


class DisplayNameOnboardingTests(unittest.TestCase):
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

    def test_new_google_user_needs_onboarding(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            me = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertEqual(me.status_code, 200)
        self.assertTrue(me.json()["needs_display_name"])
        self.assertEqual(me.json()["auth_provider"], SUPABASE_GOOGLE_PROVIDER)

    def test_google_user_after_name_no_onboarding_and_persists(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            me1 = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
            rid = me1.json()["rinq_user_id"]
            patch = self.client.patch(
                "/api/me/profile",
                headers={"Authorization": "Bearer supabase-access-token"},
                json={"displayName": "Alex"},
            )
            self.assertEqual(patch.status_code, 200, patch.text)
            self.assertEqual(patch.json()["displayName"], "Alex")
            me2 = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertFalse(me2.json()["needs_display_name"])
        self.assertEqual(me2.json()["display_name"], "Alex")
        self.assertEqual(me2.json()["rinq_user_id"], rid)
        # Profile file keyed by rinq uuid
        profile_path = Path(backend_main.PROFILES_DIR) / f"{rid}.json"
        self.assertTrue(profile_path.exists())
        stored = json.loads(profile_path.read_text(encoding="utf-8"))
        self.assertEqual(stored["displayName"], "Alex")
        self.assertTrue(stored["displayNameChosen"])

    def test_legacy_user_no_onboarding(self):
        login = self.client.post(
            "/api/auth/login",
            json={"username": "Christoph", "password": "secret"},
        )
        self.assertEqual(login.status_code, 200)
        me = self.client.get(
            "/api/me",
            headers={"Authorization": f"Bearer {login.json()['token']}"},
        )
        self.assertFalse(me.json().get("needs_display_name"))

    def test_linked_legacy_google_login_skips_onboarding(self):
        login = self.client.post(
            "/api/auth/login",
            json={"username": "Christoph", "password": "secret"},
        )
        rinq = login.json()["rinq_user_id"]
        backend_main._identity_store.link_provider(
            rinq, SUPABASE_GOOGLE_PROVIDER, self.google_sub
        )
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            me = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertEqual(me.json()["rinq_user_id"], rinq)
        self.assertFalse(me.json()["needs_display_name"])

    def test_cannot_change_other_users_display_name(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            me_a = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
            rid_a = me_a.json()["rinq_user_id"]
            self.client.patch(
                "/api/me/profile",
                headers={"Authorization": "Bearer supabase-access-token"},
                json={"displayName": "Alpha"},
            )

        other_sub = str(uuid4())
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(other_sub),
        ):
            me_b = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer other-token"},
            )
            rid_b = me_b.json()["rinq_user_id"]
            self.assertNotEqual(rid_a, rid_b)
            self.client.patch(
                "/api/me/profile",
                headers={"Authorization": "Bearer other-token"},
                json={"displayName": "Beta"},
            )

        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            again = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
        self.assertEqual(again.json()["display_name"], "Alpha")

    def test_display_name_validation_rejects_email_like(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer supabase-access-token"},
            )
            bad = self.client.patch(
                "/api/me/profile",
                headers={"Authorization": "Bearer supabase-access-token"},
                json={"displayName": "foo@bar.com"},
            )
        self.assertEqual(bad.status_code, 400)


if __name__ == "__main__":
    unittest.main()

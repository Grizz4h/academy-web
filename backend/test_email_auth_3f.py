"""Phase 3F — passwordless email login via Supabase (no email merge)."""

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
from identity.context import SUPABASE_EMAIL_PROVIDER, SUPABASE_GOOGLE_PROVIDER


class EmailOtpAuthTests(unittest.TestCase):
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
        self.email_sub = str(uuid4())
        self.google_sub = str(uuid4())

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def _email_claims(self, sub: str | None = None):
        return {
            "sub": sub or self.email_sub,
            "role": "authenticated",
            "email": "user@example.com",  # present in JWT — must NOT become identity
            "app_metadata": {"provider": "email", "providers": ["email"]},
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }

    def _google_claims(self, sub: str | None = None):
        return {
            "sub": sub or self.google_sub,
            "role": "authenticated",
            "email": "user@example.com",  # same email as email-user — must not merge
            "app_metadata": {"provider": "google", "providers": ["google"]},
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }

    def test_new_email_user_stable_uuid(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._email_claims(),
        ):
            me1 = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer email-token"},
            )
            me2 = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer email-token"},
            )
        self.assertEqual(me1.status_code, 200)
        self.assertEqual(me1.json()["auth_provider"], SUPABASE_EMAIL_PROVIDER)
        self.assertEqual(me1.json()["rinq_user_id"], me2.json()["rinq_user_id"])
        self.assertTrue(me1.json()["needs_display_name"])
        # Email must not be stored as display identity
        self.assertNotEqual(me1.json()["display_name"], "user@example.com")

    def test_email_and_google_same_address_do_not_merge(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._email_claims(),
        ):
            email_me = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer email-token"},
            )
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._google_claims(),
        ):
            google_me = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer google-token"},
            )
        self.assertNotEqual(email_me.json()["rinq_user_id"], google_me.json()["rinq_user_id"])
        self.assertEqual(google_me.json()["auth_provider"], SUPABASE_GOOGLE_PROVIDER)

    def test_legacy_still_works(self):
        login = self.client.post(
            "/api/auth/login",
            json={"username": "Christoph", "password": "secret"},
        )
        self.assertEqual(login.status_code, 200)
        me = self.client.get(
            "/api/me",
            headers={"Authorization": f"Bearer {login.json()['token']}"},
        )
        self.assertEqual(me.json()["auth_provider"], "legacy_password")
        self.assertFalse(me.json().get("needs_display_name"))

    def test_email_onboarding_then_persists(self):
        with mock.patch(
            "main.verify_supabase_access_token",
            return_value=self._email_claims(),
        ):
            self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer email-token"},
            )
            patch = self.client.patch(
                "/api/me/profile",
                headers={"Authorization": "Bearer email-token"},
                json={"displayName": "Mailer"},
            )
            self.assertEqual(patch.status_code, 200)
            me = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer email-token"},
            )
        self.assertFalse(me.json()["needs_display_name"])
        self.assertEqual(me.json()["display_name"], "Mailer")

    def test_unknown_supabase_provider_rejected(self):
        claims = {
            "sub": str(uuid4()),
            "role": "authenticated",
            "app_metadata": {"provider": "phone", "providers": ["phone"]},
            "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        }
        with mock.patch("main.verify_supabase_access_token", return_value=claims):
            res = self.client.get(
                "/api/me",
                headers={"Authorization": "Bearer x"},
            )
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

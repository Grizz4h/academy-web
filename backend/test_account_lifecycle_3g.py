"""Phase 3G — account lifecycle: unlink, export, delete."""

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


class AccountLifecycleTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        academy = root / "academy"
        academy.mkdir()
        (academy / "profiles").mkdir()
        (academy / "rewards").mkdir()
        (academy / "sessions" / "2026" / "08").mkdir(parents=True)
        (academy / "uploads" / "avatars").mkdir(parents=True)
        data = root / "data"
        (data / "scenes" / "2026" / "08").mkdir(parents=True)
        (data / "observations" / "runs" / "2026" / "08").mkdir(parents=True)
        (data / "observations" / "entries" / "2026" / "08").mkdir(parents=True)
        (data / "observations" / "players" / "2026" / "08").mkdir(parents=True)

        self._prev = {
            "USERS_FILE": backend_main.USERS_FILE,
            "DATA_DIR": backend_main.DATA_DIR,
            "PROFILES_DIR": backend_main.PROFILES_DIR,
            "REWARDS_DIR": backend_main.REWARDS_DIR,
            "SESSIONS_DIR": backend_main.SESSIONS_DIR,
            "IDENTITY_STORE_FILE": backend_main.IDENTITY_STORE_FILE,
            "SCENES_DIR": backend_main.SCENES_DIR,
            "OBS_RUNS_DIR": backend_main.OBS_RUNS_DIR,
            "OBS_ENTRIES_DIR": backend_main.OBS_ENTRIES_DIR,
            "OBS_PLAYERS_DIR": backend_main.OBS_PLAYERS_DIR,
            "AVATAR_UPLOADS_DIR": backend_main.AVATAR_UPLOADS_DIR,
            "UPLOADS_DIR": backend_main.UPLOADS_DIR,
        }

        users_file = academy / "users.json"
        users_file.write_text(
            json.dumps(
                {
                    "users": [
                        {
                            "username": "Alice",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01",
                            "role": "user",
                        },
                        {
                            "username": "Bob",
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
        backend_main.IDENTITY_STORE_FILE = str(academy / "identity_store.json")
        backend_main.SCENES_DIR = str(data / "scenes")
        backend_main.OBS_RUNS_DIR = str(data / "observations" / "runs")
        backend_main.OBS_ENTRIES_DIR = str(data / "observations" / "entries")
        backend_main.OBS_PLAYERS_DIR = str(data / "observations" / "players")
        backend_main.UPLOADS_DIR = str(academy / "uploads")
        backend_main.AVATAR_UPLOADS_DIR = str(academy / "uploads" / "avatars")
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client = TestClient(backend_main.app)

        login = self.client.post("/api/auth/login", json={"username": "Alice", "password": "secret"})
        self.assertEqual(login.status_code, 200)
        self.token = login.json()["token"]
        self.rinq = login.json()["rinq_user_id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

        bob = self.client.post("/api/auth/login", json={"username": "Bob", "password": "secret"})
        self.bob_token = bob.json()["token"]
        self.bob_rinq = bob.json()["rinq_user_id"]
        self.bob_headers = {"Authorization": f"Bearer {self.bob_token}"}

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def test_display_name_own_only(self):
        res = self.client.patch(
            "/api/me/profile",
            headers=self.headers,
            json={"displayName": "AliceX"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["displayName"], "AliceX")
        # Bob cannot change Alice by using Alice's id in body — only auth context matters
        bob_patch = self.client.patch(
            "/api/me/profile",
            headers=self.bob_headers,
            json={"displayName": "Hijack"},
        )
        self.assertEqual(bob_patch.status_code, 200)
        me_alice = self.client.get("/api/me", headers=self.headers)
        self.assertEqual(me_alice.json()["display_name"], "AliceX")

    def test_cannot_unlink_last_method(self):
        res = self.client.delete(
            "/api/me/auth/links/legacy_password",
            headers=self.headers,
        )
        self.assertEqual(res.status_code, 400)

    def test_unlink_extra_provider(self):
        backend_main._identity_store.link_provider(
            self.rinq, SUPABASE_GOOGLE_PROVIDER, str(uuid4())
        )
        me = self.client.get("/api/me", headers=self.headers)
        self.assertIn(SUPABASE_GOOGLE_PROVIDER, me.json()["auth_providers"])
        res = self.client.delete(
            f"/api/me/auth/links/{SUPABASE_GOOGLE_PROVIDER}",
            headers=self.headers,
        )
        self.assertEqual(res.status_code, 200, res.text)
        me2 = self.client.get("/api/me", headers=self.headers)
        self.assertNotIn(SUPABASE_GOOGLE_PROVIDER, me2.json()["auth_providers"])
        self.assertIn("legacy_password", me2.json()["auth_providers"])

    def test_export_own_data_no_password_hash(self):
        profile_path = Path(backend_main.PROFILES_DIR) / f"{self.rinq}.json"
        profile_path.write_text(json.dumps({"displayName": "Alice", "displayNameChosen": True}), encoding="utf-8")
        session_path = Path(backend_main.SESSIONS_DIR) / "2026" / "08" / f"{self.rinq}_1.json"
        session_path.write_text(json.dumps({"id": "s1", "user": self.rinq, "goal": "x"}), encoding="utf-8")
        other_session = Path(backend_main.SESSIONS_DIR) / "2026" / "08" / f"{self.bob_rinq}_1.json"
        other_session.write_text(json.dumps({"id": "s2", "user": self.bob_rinq, "goal": "y"}), encoding="utf-8")

        res = self.client.get("/api/me/export", headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["rinq_user_id"], self.rinq)
        self.assertEqual(len(data["sessions"]), 1)
        self.assertEqual(data["sessions"][0]["user"], self.rinq)
        blob = json.dumps(data)
        self.assertNotIn("password_hash", blob)

        bob_export = self.client.get("/api/me/export", headers=self.bob_headers).json()
        self.assertEqual(bob_export["rinq_user_id"], self.bob_rinq)
        self.assertTrue(all(s.get("user") == self.bob_rinq for s in bob_export["sessions"]))

    def test_delete_legacy_account(self):
        profile_path = Path(backend_main.PROFILES_DIR) / f"{self.rinq}.json"
        profile_path.write_text(json.dumps({"displayName": "Alice"}), encoding="utf-8")
        reward_path = Path(backend_main.REWARDS_DIR) / f"{self.rinq}.json"
        reward_path.write_text(json.dumps({"xp": 10}), encoding="utf-8")
        session_path = Path(backend_main.SESSIONS_DIR) / "2026" / "08" / f"{self.rinq}_1.json"
        session_path.write_text(json.dumps({"id": "s1", "user": self.rinq}), encoding="utf-8")
        avatar = Path(backend_main.AVATAR_UPLOADS_DIR) / f"{self.rinq}_abcd.jpg"
        avatar.write_bytes(b"fake")

        bad = self.client.post(
            "/api/me/delete",
            headers=self.headers,
            json={"confirm": "delete", "password": "secret"},
        )
        self.assertEqual(bad.status_code, 400)

        res = self.client.post(
            "/api/me/delete",
            headers=self.headers,
            json={"confirm": "LÖSCHEN", "password": "secret"},
        )
        self.assertEqual(res.status_code, 200, res.text)
        self.assertFalse(profile_path.exists())
        self.assertFalse(reward_path.exists())
        self.assertFalse(session_path.exists())
        self.assertFalse(avatar.exists())
        self.assertIsNone(backend_main._identity_store.get_identity(self.rinq))

        login_again = self.client.post(
            "/api/auth/login",
            json={"username": "Alice", "password": "secret"},
        )
        self.assertEqual(login_again.status_code, 401)

    def test_bob_cannot_delete_alice(self):
        # Bob authenticated — delete only affects Bob if he deletes himself
        res = self.client.post(
            "/api/me/delete",
            headers=self.bob_headers,
            json={"confirm": "LÖSCHEN", "password": "secret"},
        )
        self.assertEqual(res.status_code, 200)
        # Alice still exists
        alice_login = self.client.post(
            "/api/auth/login",
            json={"username": "Alice", "password": "secret"},
        )
        self.assertEqual(alice_login.status_code, 200)

    def test_delete_with_supabase_requires_service_role(self):
        backend_main._identity_store.link_provider(
            self.rinq, SUPABASE_GOOGLE_PROVIDER, str(uuid4())
        )
        res = self.client.post(
            "/api/me/delete",
            headers=self.headers,
            json={"confirm": "LÖSCHEN", "password": "secret"},
        )
        self.assertEqual(res.status_code, 503)

    def test_delete_with_supabase_ok_when_mocked(self):
        sub = str(uuid4())
        backend_main._identity_store.link_provider(self.rinq, SUPABASE_GOOGLE_PROVIDER, sub)
        os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-role"
        try:
            with mock.patch("account_lifecycle.delete_supabase_auth_user") as mocked:
                res = self.client.post(
                    "/api/me/delete",
                    headers=self.headers,
                    json={"confirm": "LÖSCHEN", "password": "secret"},
                )
                self.assertEqual(res.status_code, 200, res.text)
                mocked.assert_called()
        finally:
            os.environ.pop("SUPABASE_SERVICE_ROLE_KEY", None)


if __name__ == "__main__":
    unittest.main()

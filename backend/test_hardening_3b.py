"""Phase 3B pre-OAuth hardening tests."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest import mock

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ["ACADEMY_ALLOW_LEGACY_SIGNUP"] = "0"
os.environ["ACADEMY_ADMIN_USERNAMES"] = "adminuser"
os.environ["STORAGE_BACKEND"] = "json"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import jwt
from fastapi.testclient import TestClient
from security_guards import reset_rate_limiter_for_tests

import main as backend_main
from security_guards import SlidingWindowRateLimiter, is_admin_auth, is_self_checkout_auth, legacy_signup_allowed
from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER


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


class SecurityGuardUnitTests(unittest.TestCase):
    def test_signup_flag(self):
        with mock.patch.dict(os.environ, {"ACADEMY_ALLOW_LEGACY_SIGNUP": "0"}):
            self.assertFalse(legacy_signup_allowed())
        with mock.patch.dict(os.environ, {"ACADEMY_ALLOW_LEGACY_SIGNUP": "1"}):
            self.assertTrue(legacy_signup_allowed())

    def test_admin_allowlist(self):
        auth = AuthContext(
            rinq_user_id="u1",
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="adminuser",
            display_name="Admin",
            legacy_username="adminuser",
        )
        with mock.patch.dict(os.environ, {"ACADEMY_ADMIN_USERNAMES": "adminuser"}):
            self.assertTrue(is_admin_auth(auth))
        other = AuthContext(
            rinq_user_id="u2",
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="alice",
            legacy_username="alice",
        )
        with mock.patch.dict(os.environ, {"ACADEMY_ADMIN_USERNAMES": "adminuser"}):
            self.assertFalse(is_admin_auth(other))
            self.assertTrue(is_admin_auth(other, role_from_record="admin"))

    def test_self_checkout_closed_by_default(self):
        user = AuthContext(
            rinq_user_id="u2",
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="alice",
            legacy_username="alice",
        )
        admin = AuthContext(
            rinq_user_id="u1",
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="adminuser",
            display_name="Admin",
            legacy_username="adminuser",
        )
        with mock.patch.dict(os.environ, {"ACADEMY_ALLOW_SELF_CHECKOUT": "0", "ACADEMY_ADMIN_USERNAMES": "adminuser"}):
            self.assertFalse(is_self_checkout_auth(user))
            self.assertTrue(is_self_checkout_auth(admin))
        with mock.patch.dict(os.environ, {"ACADEMY_ALLOW_SELF_CHECKOUT": "1"}):
            self.assertTrue(is_self_checkout_auth(user))

    def test_rate_limiter(self):
        limiter = SlidingWindowRateLimiter()
        for _ in range(3):
            limiter.check("k", limit=3, window_sec=60)
        from fastapi import HTTPException

        with self.assertRaises(HTTPException) as ctx:
            limiter.check("k", limit=3, window_sec=60)
        self.assertEqual(ctx.exception.status_code, 429)


class HardeningApiTests(unittest.TestCase):
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
        backend_main.IDENTITY_STORE_FILE = str(academy / "identity_store.json")
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        backend_main._identity_store.ensure_legacy_identity("alice")
        backend_main._identity_store.ensure_legacy_identity("adminuser")
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def test_registration_status_and_signup_closed(self):
        with mock.patch.dict(os.environ, {"ACADEMY_ALLOW_LEGACY_SIGNUP": "0"}):
            status = self.client.get("/api/auth/registration")
            self.assertEqual(status.status_code, 200)
            self.assertFalse(status.json()["allow_legacy_signup"])
            res = self.client.post(
                "/api/auth/signup",
                json={"username": "newbie", "password": "secret123"},
            )
            self.assertEqual(res.status_code, 403)

    def test_signup_open_when_enabled(self):
        with mock.patch.dict(os.environ, {"ACADEMY_ALLOW_LEGACY_SIGNUP": "1"}):
            res = self.client.post(
                "/api/auth/signup",
                json={"username": "newbie", "password": "secret123"},
            )
            self.assertEqual(res.status_code, 200)

    def test_non_admin_cannot_import(self):
        res = self.client.post(
            "/api/players/import",
            headers={"Authorization": f"Bearer {_token('alice')}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_allowlist_can_reach_import_gate(self):
        # May fail later on missing team config, but must not be 403
        res = self.client.post(
            "/api/players/import",
            headers={"Authorization": f"Bearer {_token('adminuser')}"},
        )
        self.assertNotEqual(res.status_code, 403)
        self.assertNotEqual(res.status_code, 401)

    def test_me_reports_is_admin(self):
        me = self.client.get("/api/me", headers={"Authorization": f"Bearer {_token('adminuser')}"})
        self.assertEqual(me.status_code, 200)
        self.assertTrue(me.json().get("is_admin"))
        me2 = self.client.get("/api/me", headers={"Authorization": f"Bearer {_token('alice')}"})
        self.assertFalse(me2.json().get("is_admin"))

    def test_me_reports_creator_mode(self):
        with mock.patch.dict(os.environ, {"ACADEMY_CREATOR_USERNAMES": "adminuser"}):
            me = self.client.get("/api/me", headers={"Authorization": f"Bearer {_token('adminuser')}"})
            self.assertEqual(me.status_code, 200)
            self.assertTrue(me.json().get("creator_mode"))
        me2 = self.client.get("/api/me", headers={"Authorization": f"Bearer {_token('alice')}"})
        self.assertFalse(me2.json().get("creator_mode"))

    def test_me_reports_self_checkout(self):
        admin_me = self.client.get("/api/me", headers={"Authorization": f"Bearer {_token('adminuser')}"})
        self.assertEqual(admin_me.status_code, 200)
        self.assertTrue(admin_me.json().get("self_checkout"))
        alice = self.client.get("/api/me", headers={"Authorization": f"Bearer {_token('alice')}"})
        self.assertEqual(alice.status_code, 200)
        self.assertFalse(alice.json().get("self_checkout"))
        with mock.patch.dict(os.environ, {"ACADEMY_ALLOW_SELF_CHECKOUT": "1"}):
            alice_open = self.client.get("/api/me", headers={"Authorization": f"Bearer {_token('alice')}"})
            self.assertTrue(alice_open.json().get("self_checkout"))

    def test_checkout_requires_self_checkout(self):
        denied = self.client.post(
            "/api/billing/checkout",
            headers={"Authorization": f"Bearer {_token('alice')}"},
            json={"age_confirmed": True},
        )
        self.assertEqual(denied.status_code, 403)
        admin = self.client.post(
            "/api/billing/checkout",
            headers={"Authorization": f"Bearer {_token('adminuser')}"},
            json={"age_confirmed": True},
        )
        self.assertNotEqual(admin.status_code, 403)
        self.assertNotEqual(admin.status_code, 401)

    def test_create_scene_requires_creator_mode(self):
        res = self.client.post(
            "/api/scenes",
            headers={"Authorization": f"Bearer {_token('alice')}"},
            json={
                "game_time": "13:42",
                "source": {"type": "manual"},
                "period": "P1",
            },
        )
        self.assertEqual(res.status_code, 403)

    def test_team_logo_requires_auth(self):
        import team_logo_store

        logos = Path(self._tmp.name) / "logos"
        (logos / "del").mkdir(parents=True)
        (logos / "del" / "straubing_tigers.svg").write_bytes(b"<svg/>")
        clearance = Path(self._tmp.name) / "clearance.json"
        clearance.write_text("{}", encoding="utf-8")
        prev_dir = team_logo_store.TEAM_LOGOS_DIR
        prev_clearance = team_logo_store.CLEARANCE_PATH
        team_logo_store.TEAM_LOGOS_DIR = logos
        team_logo_store.CLEARANCE_PATH = clearance
        try:
            anon = self.client.get("/api/team-logos/del", params={"file": "straubing_tigers.svg"})
            self.assertEqual(anon.status_code, 401)

            denied = self.client.get(
                "/api/team-logos/del",
                params={"file": "straubing_tigers.svg"},
                headers={"Authorization": f"Bearer {_token('alice')}"},
            )
            self.assertEqual(denied.status_code, 403)

            allowed = self.client.get(
                "/api/team-logos/del",
                params={"file": "straubing_tigers.svg"},
                headers={"Authorization": f"Bearer {_token('adminuser')}"},
            )
            self.assertEqual(allowed.status_code, 200)
            self.assertIn("private", (allowed.headers.get("cache-control") or "").lower())
            self.assertIn("max-age=86400", (allowed.headers.get("cache-control") or "").lower())
            self.assertNotIn("no-store", (allowed.headers.get("cache-control") or "").lower())
            self.assertEqual(allowed.content, b"<svg/>")

            traversal = self.client.get(
                "/api/team-logos/del",
                params={"file": "../straubing_tigers.svg"},
                headers={"Authorization": f"Bearer {_token('adminuser')}"},
            )
            self.assertIn(traversal.status_code, (404, 422))
        finally:
            team_logo_store.TEAM_LOGOS_DIR = prev_dir
            team_logo_store.CLEARANCE_PATH = prev_clearance

    def test_team_logo_cleared_is_public(self):
        import team_logo_store

        logos = Path(self._tmp.name) / "logos-cleared"
        (logos / "del").mkdir(parents=True)
        (logos / "del" / "eisbaren_berlin.png").write_bytes(b"\x89PNG\r\n\x1a\n")
        (logos / "del" / "straubing_tigers.svg").write_bytes(b"<svg/>")
        clearance = Path(self._tmp.name) / "clearance-public.json"
        clearance.write_text(
            json.dumps({"eisbaren_berlin": True, "straubing_tigers": False}),
            encoding="utf-8",
        )
        prev_dir = team_logo_store.TEAM_LOGOS_DIR
        prev_clearance = team_logo_store.CLEARANCE_PATH
        team_logo_store.TEAM_LOGOS_DIR = logos
        team_logo_store.CLEARANCE_PATH = clearance
        try:
            listed = self.client.get("/api/team-logo-clearance")
            self.assertEqual(listed.status_code, 200)
            self.assertEqual(listed.json().get("ids"), ["eisbaren_berlin"])

            public = self.client.get("/api/team-logos/del", params={"file": "eisbaren_berlin.png"})
            self.assertEqual(public.status_code, 200)
            self.assertIn("max-age=86400", (public.headers.get("cache-control") or "").lower())
            self.assertEqual(public.content, b"\x89PNG\r\n\x1a\n")

            gated = self.client.get("/api/team-logos/del", params={"file": "straubing_tigers.svg"})
            self.assertEqual(gated.status_code, 401)
        finally:
            team_logo_store.TEAM_LOGOS_DIR = prev_dir
            team_logo_store.CLEARANCE_PATH = prev_clearance

    def test_team_logo_creator_allowlist(self):
        import team_logo_store

        logos = Path(self._tmp.name) / "logos-creator"
        (logos / "del").mkdir(parents=True)
        (logos / "del" / "straubing_tigers.svg").write_bytes(b"<svg/>")
        clearance = Path(self._tmp.name) / "clearance-creator.json"
        clearance.write_text("{}", encoding="utf-8")
        prev_dir = team_logo_store.TEAM_LOGOS_DIR
        prev_clearance = team_logo_store.CLEARANCE_PATH
        team_logo_store.TEAM_LOGOS_DIR = logos
        team_logo_store.CLEARANCE_PATH = clearance
        try:
            with mock.patch.dict(os.environ, {"ACADEMY_CREATOR_USERNAMES": "alice"}):
                res = self.client.get(
                    "/api/team-logos/del",
                    params={"file": "straubing_tigers.svg"},
                    headers={"Authorization": f"Bearer {_token('alice')}"},
                )
                self.assertEqual(res.status_code, 200)
        finally:
            team_logo_store.TEAM_LOGOS_DIR = prev_dir
            team_logo_store.CLEARANCE_PATH = prev_clearance

    def test_login_rate_limit(self):
        # Exhaust limiter for this test client IP
        codes = []
        for i in range(25):
            res = self.client.post(
                "/api/auth/login",
                json={"username": "alice", "password": "wrong"},
            )
            codes.append(res.status_code)
        self.assertIn(429, codes)


if __name__ == "__main__":
    unittest.main()

"""Phase 5B — entitlement route gate tests."""

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
os.environ["ACADEMY_ADMIN_USERNAMES"] = "adminuser"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import jwt
from fastapi.testclient import TestClient

import main as backend_main
from entitlements.access_config import resolve_academy_module_id
from entitlements.access_service import AccessResource, can_access
from entitlements.curriculum_filter import filter_curriculum_for_user
from entitlements.feature_keys import ACADEMY_PREMIUM
from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER
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


class CurriculumFilterTests(unittest.TestCase):
    def test_strips_premium_drills_for_anonymous(self):
        curriculum = {
            "tracks": [
                {
                    "id": "A",
                    "modules": [
                        {"id": "A1", "drills": [{"id": "A1_D1", "title": "Free"}]},
                        {"id": "A2", "drills": [{"id": "A2_D1", "title": "Premium"}]},
                    ],
                }
            ]
        }
        filtered = filter_curriculum_for_user(curriculum, None)
        modules = {m["id"]: m for m in filtered["tracks"][0]["modules"]}
        self.assertEqual(len(modules["A1"]["drills"]), 1)
        self.assertEqual(modules["A2"]["drills"], [])
        self.assertTrue(modules["A2"]["premium_locked"])

    def test_resolve_drill_prefix(self):
        self.assertEqual(resolve_academy_module_id("A2_D1"), "A2")


class RouteGateTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        academy = root / "academy"
        academy.mkdir()
        (academy / "profiles").mkdir()
        (academy / "rewards").mkdir()
        (academy / "sessions").mkdir()

        curriculum = {
            "tracks": [
                {
                    "id": "A",
                    "modules": [
                        {
                            "id": "A1",
                            "drills": [{"id": "A1_D1", "title": "Drill", "config": {"q": 1}}],
                        },
                        {
                            "id": "A2",
                            "drills": [{"id": "A2_D1", "title": "Drill", "config": {"q": 1}}],
                        },
                    ],
                }
            ]
        }
        (academy / "curriculum.json").write_text(json.dumps(curriculum), encoding="utf-8")

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
        self.auth = {"Authorization": f"Bearer {_token('alice')}"}

    def tearDown(self):
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self.client.close()
        self._tmp.cleanup()

    def test_create_free_module_allowed(self):
        res = self.client.post(
            "/api/sessions",
            headers=self.auth,
            json={
                "user": "alice",
                "module_id": "A1",
                "goal": "learn",
                "confidence": 3,
            },
        )
        self.assertEqual(res.status_code, 200, res.text)

    def test_create_premium_module_denied_without_grant(self):
        res = self.client.post(
            "/api/sessions",
            headers=self.auth,
            json={
                "user": "alice",
                "module_id": "A2",
                "goal": "learn",
                "confidence": 3,
            },
        )
        self.assertEqual(res.status_code, 403)

    def test_create_premium_module_allowed_with_grant(self):
        get_repos().entitlements.grant_entitlement(
            self.alice_id,
            ACADEMY_PREMIUM,
            source="manual",
        )
        res = self.client.post(
            "/api/sessions",
            headers=self.auth,
            json={
                "user": "alice",
                "module_id": "A2",
                "goal": "learn",
                "confidence": 3,
            },
        )
        self.assertEqual(res.status_code, 200, res.text)

    def test_lab_session_allowed_without_grant(self):
        res = self.client.post(
            "/api/sessions",
            headers=self.auth,
            json={
                "user": "alice",
                "module_id": "LAB_PREDICT",
                "goal": "predict",
                "confidence": 3,
                "learning_area": "lab",
                "lab_mode": "predict",
            },
        )
        self.assertEqual(res.status_code, 200, res.text)

    def test_curriculum_filters_premium_without_grant(self):
        res = self.client.get("/api/curriculum", headers=self.auth)
        self.assertEqual(res.status_code, 200)
        modules = {
            m["id"]: m
            for t in res.json()["tracks"]
            for m in t["modules"]
        }
        self.assertGreater(len(modules["A1"].get("drills") or []), 0)
        self.assertEqual(modules["A2"].get("drills"), [])
        self.assertTrue(modules["A2"].get("premium_locked"))

    def test_get_session_denied_for_premium_without_grant(self):
        get_repos().entitlements.grant_entitlement(
            self.alice_id,
            ACADEMY_PREMIUM,
            source="manual",
        )
        created = self.client.post(
            "/api/sessions",
            headers=self.auth,
            json={
                "user": "alice",
                "module_id": "A2",
                "goal": "learn",
                "confidence": 3,
            },
        )
        session_id = created.json()["id"]
        get_repos().entitlements.revoke_entitlement(self.alice_id, ACADEMY_PREMIUM)
        res = self.client.get(f"/api/sessions/{session_id}", headers=self.auth)
        self.assertEqual(res.status_code, 403)


class LabAccessTests(unittest.TestCase):
    def test_lab_learning_area_bypasses_premium(self):
        user = AuthContext(
            rinq_user_id="11111111-1111-1111-1111-111111111111",
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="Alice",
            legacy_username="alice",
        )
        self.assertTrue(
            can_access(
                user,
                AccessResource(
                    kind="module",
                    module_id="LAB_PREDICT",
                    learning_area="lab",
                ),
            )
        )


if __name__ == "__main__":
    unittest.main()

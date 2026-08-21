"""Phase 3A identity foundation tests."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import threading
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import jwt
from fastapi.testclient import TestClient
from security_guards import reset_rate_limiter_for_tests

import main as backend_main
from identity.context import LEGACY_PASSWORD_PROVIDER
from identity.migrate import run_identity_migration
from identity.store import IdentityStore


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


def _auth(sub: str) -> dict:
    return {"Authorization": f"Bearer {_token(sub)}"}


class IdentityStoreTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        self.store = IdentityStore(str(Path(self._tmp.name) / "identity_store.json"))

    def tearDown(self):
        self._tmp.cleanup()

    def test_ensure_legacy_idempotent(self):
        a = self.store.ensure_legacy_identity("Alice", display_name="Alice")
        b = self.store.ensure_legacy_identity("alice", display_name="Alice")
        self.assertEqual(a.rinq_user_id, b.rinq_user_id)
        data = self.store.load()
        self.assertEqual(len(data["identities"]), 1)
        self.assertEqual(len(data["auth_links"]), 1)

    def test_provider_subject_unique_across_users(self):
        first = self.store.ensure_legacy_identity("bob")
        second = self.store.ensure_legacy_identity("carol")
        with self.assertRaises(ValueError):
            self.store.link_provider(second.rinq_user_id, LEGACY_PASSWORD_PROVIDER, "bob")
        # Same user re-link is ok
        link = self.store.link_provider(first.rinq_user_id, LEGACY_PASSWORD_PROVIDER, "bob")
        self.assertEqual(link["rinq_user_id"], first.rinq_user_id)

    def test_parallel_ensure_same_subject(self):
        results = []
        errors = []

        def worker():
            try:
                results.append(self.store.ensure_legacy_identity("raceuser").rinq_user_id)
            except Exception as exc:  # pragma: no cover
                errors.append(exc)

        threads = [threading.Thread(target=worker) for _ in range(8)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        self.assertFalse(errors)
        self.assertEqual(len(set(results)), 1)
        data = self.store.load()
        self.assertEqual(len(data["auth_links"]), 1)


class IdentityMigrationTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        self.academy = root / "academy"
        self.profiles = self.academy / "profiles"
        self.rewards = self.academy / "rewards"
        self.sessions = self.academy / "sessions" / "2026" / "08"
        self.uploads = self.academy / "uploads" / "avatars"
        self.scenes = root / "scenes" / "2026" / "08"
        self.observations = root / "observations" / "runs" / "2026" / "08"
        for d in (
            self.profiles,
            self.rewards,
            self.sessions,
            self.uploads,
            self.scenes,
            self.observations,
        ):
            d.mkdir(parents=True)

        self.users_file = self.academy / "users.json"
        self.users_file.write_text(
            json.dumps(
                {
                    "users": [
                        {
                            "username": "Christoph",
                            "password_hash": "x",
                            "created_at": "2026-01-01T00:00:00",
                            "role": "user",
                        }
                    ]
                }
            ),
            encoding="utf-8",
        )
        (self.profiles / "christoph.json").write_text(
            json.dumps({"displayName": "Christoph", "jerseyNumber": 17}),
            encoding="utf-8",
        )
        (self.rewards / "christoph.json").write_text(
            json.dumps({"xp": 42, "currency": {"PUX": 3}}),
            encoding="utf-8",
        )
        (self.sessions / "Christoph_100.json").write_text(
            json.dumps({"id": "Christoph_100", "user": "Christoph", "created_by": "Christoph"}),
            encoding="utf-8",
        )
        (self.scenes / "scene_1.json").write_text(
            json.dumps({"id": "scene_1", "user": "christoph"}),
            encoding="utf-8",
        )
        (self.observations / "obs_1.json").write_text(
            json.dumps({"run_id": "obs_1", "user": "Christoph"}),
            encoding="utf-8",
        )
        avatar = self.uploads / "christoph_aabbccdd.jpg"
        avatar.write_bytes(b"fake")

        self.store = IdentityStore(str(self.academy / "identity_store.json"))
        self.backup_root = root / "backups"

    def tearDown(self):
        self._tmp.cleanup()

    def test_migration_idempotent_and_rewrites_owners(self):
        report1 = run_identity_migration(
            store=self.store,
            users_file=str(self.users_file),
            profiles_dir=str(self.profiles),
            rewards_dir=str(self.rewards),
            sessions_dir=str(self.sessions.parent.parent),
            scenes_dir=str(self.scenes.parent.parent),
            observations_dir=str(self.observations.parent.parent.parent),
            uploads_dir=str(self.uploads.parent),
            backup_root=str(self.backup_root),
            create_backup=True,
        )
        uid = report1["mapping"]["christoph"]
        self.assertTrue((self.profiles / f"{uid}.json").exists())
        self.assertFalse((self.profiles / "christoph.json").exists())
        rewards = json.loads((self.rewards / f"{uid}.json").read_text(encoding="utf-8"))
        self.assertEqual(rewards["xp"], 42)
        session = json.loads(next(self.sessions.parent.parent.rglob("*.json")).read_text(encoding="utf-8"))
        self.assertEqual(session["user"], uid)

        report2 = run_identity_migration(
            store=self.store,
            users_file=str(self.users_file),
            profiles_dir=str(self.profiles),
            rewards_dir=str(self.rewards),
            sessions_dir=str(self.sessions.parent.parent),
            scenes_dir=str(self.scenes.parent.parent),
            observations_dir=str(self.observations.parent.parent.parent),
            uploads_dir=str(self.uploads.parent),
            backup_root=str(self.backup_root),
            create_backup=False,
        )
        self.assertEqual(report2["mapping"]["christoph"], uid)
        data = self.store.load()
        self.assertEqual(len(data["identities"]), 1)


class AuthContextApiTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        self.academy = root / "academy"
        self.academy.mkdir()
        (self.academy / "profiles").mkdir()
        (self.academy / "rewards").mkdir()
        (self.academy / "sessions").mkdir()
        (self.academy / "uploads" / "avatars").mkdir(parents=True)

        self._prev = {
            "USERS_FILE": backend_main.USERS_FILE,
            "DATA_DIR": backend_main.DATA_DIR,
            "PROFILES_DIR": backend_main.PROFILES_DIR,
            "REWARDS_DIR": backend_main.REWARDS_DIR,
            "SESSIONS_DIR": backend_main.SESSIONS_DIR,
            "UPLOADS_DIR": backend_main.UPLOADS_DIR,
            "AVATAR_UPLOADS_DIR": backend_main.AVATAR_UPLOADS_DIR,
            "IDENTITY_STORE_FILE": backend_main.IDENTITY_STORE_FILE,
        }

        users_file = self.academy / "users.json"
        users_file.write_text(
            json.dumps(
                {
                    "users": [
                        {
                            "username": "alice",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01T00:00:00",
                            "role": "user",
                        },
                        {
                            "username": "bob",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01T00:00:00",
                            "role": "user",
                        },
                    ]
                }
            ),
            encoding="utf-8",
        )

        backend_main.USERS_FILE = str(users_file)
        backend_main.DATA_DIR = str(self.academy)
        backend_main.PROFILES_DIR = str(self.academy / "profiles")
        backend_main.REWARDS_DIR = str(self.academy / "rewards")
        backend_main.SESSIONS_DIR = str(self.academy / "sessions")
        backend_main.UPLOADS_DIR = str(self.academy / "uploads")
        backend_main.AVATAR_UPLOADS_DIR = str(self.academy / "uploads" / "avatars")
        backend_main.IDENTITY_STORE_FILE = str(self.academy / "identity_store.json")
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )

        # Seed sessions owned by resolved UUIDs after ensure
        alice = backend_main._identity_store.ensure_legacy_identity("alice", display_name="alice")
        bob = backend_main._identity_store.ensure_legacy_identity("bob", display_name="bob")
        self.alice_id = alice.rinq_user_id
        self.bob_id = bob.rinq_user_id
        folder = self.academy / "sessions" / "2026" / "08"
        folder.mkdir(parents=True)
        for sid, owner in (("alice_100", self.alice_id), ("bob_200", self.bob_id)):
            (folder / f"{sid}.json").write_text(
                json.dumps(
                    {
                        "id": sid,
                        "user": owner,
                        "created_by": owner,
                        "module_id": "A1",
                        "state": "IN_PROGRESS",
                        "created_at": datetime.utcnow().isoformat(),
                        "checkins": [],
                        "observation_scope": "full",
                        "current_phase": "P1",
                        "learning_area": "academy",
                        "drills": [],
                    }
                ),
                encoding="utf-8",
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

    def test_login_and_me_stable_uuid(self):
        res = self.client.post(
            "/api/auth/login",
            json={"username": "alice", "password": "secret"},
        )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["rinq_user_id"], self.alice_id)
        token = body["token"]
        payload = jwt.decode(token, os.environ["ACADEMY_JWT_SECRET"], algorithms=[JWT_ALGO])
        self.assertEqual(payload["sub"], "alice")
        self.assertNotEqual(payload["sub"], body["rinq_user_id"])

        me = self.client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me.status_code, 200)
        me_body = me.json()
        self.assertEqual(me_body["rinq_user_id"], self.alice_id)
        self.assertEqual(me_body["user_id"], self.alice_id)

        res2 = self.client.post(
            "/api/auth/login",
            json={"username": "alice", "password": "secret"},
        )
        self.assertEqual(res2.json()["rinq_user_id"], self.alice_id)

    def test_ownership_still_enforced(self):
        res = self.client.get("/api/sessions/bob_200", headers=_auth("alice"))
        self.assertEqual(res.status_code, 404)
        res = self.client.get("/api/sessions/alice_100", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)

    def test_client_uuid_sub_not_accepted_as_auth(self):
        # JWT sub must be legacy username present in users.json — raw UUID sub fails
        res = self.client.get("/api/me", headers=_auth(self.alice_id))
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

"""Session API auth + owner enforcement tests (Phase 1 hardening)."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

# Must be set before importing backend.main (JWT is resolved at import time).
os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import jwt
from fastapi.testclient import TestClient

import main as backend_main


JWT_ALGO = "HS256"


def _token(sub: str) -> str:
    payload = {
        "sub": sub,
        "exp": (datetime.utcnow() + timedelta(days=1)).timestamp(),
    }
    return jwt.encode(payload, os.environ["ACADEMY_JWT_SECRET"], algorithm=JWT_ALGO)


def _auth(sub: str) -> dict:
    return {"Authorization": f"Bearer {_token(sub)}"}


class SessionAuthTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        sessions_dir = root / "sessions"
        scenes_dir = root / "scenes"
        sessions_dir.mkdir()
        scenes_dir.mkdir()

        self._prev_sessions = backend_main.SESSIONS_DIR
        self._prev_scenes = backend_main.SCENES_DIR
        backend_main.SESSIONS_DIR = str(sessions_dir)
        backend_main.SCENES_DIR = str(scenes_dir)

        def write_session(session_id: str, user: str) -> None:
            folder = sessions_dir / "2026" / "08"
            folder.mkdir(parents=True, exist_ok=True)
            doc = {
                "id": session_id,
                "user": user,
                "created_by": user,
                "module_id": "A1",
                "state": "IN_PROGRESS",
                "created_at": datetime.utcnow().isoformat(),
                "checkins": [],
                "observation_scope": "full",
                "current_phase": "P1",
                "learning_area": "academy",
                "drills": [],
            }
            (folder / f"{session_id}.json").write_text(json.dumps(doc), encoding="utf-8")

        write_session("alice_100", "alice")
        write_session("bob_200", "bob")
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        backend_main.SESSIONS_DIR = self._prev_sessions
        backend_main.SCENES_DIR = self._prev_scenes
        self.client.close()
        self._tmp.cleanup()

    def test_unauthenticated_session_list_is_401(self):
        self.assertEqual(self.client.get("/api/sessions").status_code, 401)

    def test_unauthenticated_session_read_is_401(self):
        self.assertEqual(self.client.get("/api/sessions/alice_100").status_code, 401)

    def test_unauthenticated_session_patch_is_401(self):
        self.assertEqual(
            self.client.patch("/api/sessions/alice_100", json={"goal": "x"}).status_code,
            401,
        )

    def test_unauthenticated_session_delete_is_401(self):
        self.assertEqual(self.client.delete("/api/sessions/alice_100").status_code, 401)

    def test_owner_can_read_own_session(self):
        res = self.client.get("/api/sessions/alice_100", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["id"], "alice_100")

    def test_non_owner_cannot_read_foreign_session(self):
        res = self.client.get("/api/sessions/bob_200", headers=_auth("alice"))
        self.assertEqual(res.status_code, 404)

    def test_non_owner_cannot_patch_foreign_session(self):
        res = self.client.patch(
            "/api/sessions/bob_200",
            headers=_auth("alice"),
            json={"goal": "hack"},
        )
        self.assertEqual(res.status_code, 404)

    def test_non_owner_cannot_delete_foreign_session(self):
        res = self.client.delete("/api/sessions/bob_200", headers=_auth("alice"))
        self.assertEqual(res.status_code, 404)

    def test_list_returns_only_authenticated_user_sessions(self):
        res = self.client.get("/api/sessions", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        ids = {s["id"] for s in res.json()}
        self.assertEqual(ids, {"alice_100"})

    def test_list_ignores_spoofed_user_query(self):
        res = self.client.get("/api/sessions?user=bob", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        ids = {s["id"] for s in res.json()}
        self.assertEqual(ids, {"alice_100"})

    def test_jwt_secret_reject_missing(self):
        prev = os.environ.pop("ACADEMY_JWT_SECRET", None)
        try:
            with self.assertRaisesRegex(RuntimeError, "ACADEMY_JWT_SECRET is missing"):
                backend_main._resolve_jwt_secret()
        finally:
            if prev is not None:
                os.environ["ACADEMY_JWT_SECRET"] = prev

    def test_jwt_secret_reject_dev_default(self):
        prev = os.environ.get("ACADEMY_JWT_SECRET")
        os.environ["ACADEMY_JWT_SECRET"] = "dev-secret"
        try:
            with self.assertRaisesRegex(RuntimeError, "insecure default"):
                backend_main._resolve_jwt_secret()
        finally:
            if prev is None:
                os.environ.pop("ACADEMY_JWT_SECRET", None)
            else:
                os.environ["ACADEMY_JWT_SECRET"] = prev


if __name__ == "__main__":
    unittest.main()

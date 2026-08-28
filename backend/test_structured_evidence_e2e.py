"""Phase 5A — structured evidence end-to-end tests."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import jwt
from fastapi.testclient import TestClient

import main as backend_main
from competency.map_context import clear_frozen_evidence_map_cache
from competency.structured.curriculum import clear_curriculum_cache
from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER
from repositories.wiring import configure_repositories, get_repos
from security_guards import reset_rate_limiter_for_tests

JWT_ALGO = "HS256"


def _token(sub: str) -> str:
    return jwt.encode(
        {"sub": sub, "exp": (datetime.utcnow() + timedelta(days=1)).timestamp()},
        os.environ["ACADEMY_JWT_SECRET"],
        algorithm=JWT_ALGO,
    )


def _auth(sub: str) -> dict:
    return {"Authorization": f"Bearer {_token(sub)}"}


def _a1_d2_answers(*, observations: int = 5, unsure: int = 0) -> dict:
    positions = (["low"] * (observations - unsure)) + (["unsure"] * unsure)
    return {
        "shift_tracker_observations": [
            {"id": f"o{i}", "order": i, "position": pos}
            for i, pos in enumerate(positions, start=1)
        ],
        "__shift_tracker_stage": "complete",
        "patternNoticed": "changes_often",
    }


class StructuredEvidenceE2ETests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        clear_frozen_evidence_map_cache()
        clear_curriculum_cache()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        academy = root / "academy"
        for sub in ("profiles", "rewards", "sessions", "competency/events", "competency/states"):
            (academy / sub).mkdir(parents=True)

        users_file = academy / "users.json"
        users_file.write_text(
            json.dumps(
                {
                    "users": [
                        {
                            "username": "alice",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01",
                        },
                        {
                            "username": "bob",
                            "password_hash": backend_main.hash_password("secret"),
                            "created_at": "2026-01-01",
                        },
                    ]
                }
            ),
            encoding="utf-8",
        )

        self._prev = {
            "USERS_FILE": backend_main.USERS_FILE,
            "DATA_DIR": backend_main.DATA_DIR,
            "PROFILES_DIR": backend_main.PROFILES_DIR,
            "REWARDS_DIR": backend_main.REWARDS_DIR,
            "SESSIONS_DIR": backend_main.SESSIONS_DIR,
            "IDENTITY_STORE_FILE": backend_main.IDENTITY_STORE_FILE,
        }
        backend_main.USERS_FILE = str(users_file)
        backend_main.DATA_DIR = str(academy)
        curriculum_src = BACKEND_DIR.parent / "data" / "academy" / "curriculum.json"
        if curriculum_src.is_file():
            (academy / "curriculum.json").write_text(
                curriculum_src.read_text(encoding="utf-8"),
                encoding="utf-8",
            )
        backend_main.PROFILES_DIR = str(academy / "profiles")
        backend_main.REWARDS_DIR = str(academy / "rewards")
        backend_main.SESSIONS_DIR = str(academy / "sessions")
        backend_main.IDENTITY_STORE_FILE = str(academy / "identity_store.json")
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        store = backend_main._identity_store
        self.alice_id = store.ensure_legacy_identity("alice").rinq_user_id
        self.bob_id = store.ensure_legacy_identity("bob").rinq_user_id
        configure_repositories(
            get_identity_store=lambda: store,
            get_users_file=lambda: str(users_file),
            get_profiles_dir=lambda: str(academy / "profiles"),
            get_rewards_dir=lambda: str(academy / "rewards"),
            get_sessions_dir=lambda: str(academy / "sessions"),
            get_entitlements_file=lambda: str(academy / "entitlement_grants.json"),
            get_competency_events_dir=lambda: str(academy / "competency" / "events"),
            get_competency_states_dir=lambda: str(academy / "competency" / "states"),
            storage_backend="json",
        )
        self.alice = AuthContext(
            rinq_user_id=self.alice_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="Alice",
            legacy_username="alice",
        )
        self.repos = get_repos()
        self.client = TestClient(backend_main.app)

    def tearDown(self):
        self.client.close()
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self._tmp.cleanup()

    def _create_a1_d2_session(self, *, user: str = "alice") -> str:
        res = self.client.post(
            "/api/sessions",
            headers=_auth(user),
            json={
                "user": user,
                "module_id": "A1",
                "drill_id": "A1_D2",
                "goal": "Test",
                "confidence": 3,
                "observation_scope": "lesson",
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        return res.json()["id"]

    def test_happy_path_final_checkin_creates_rated_competencies(self):
        session_id = self._create_a1_d2_session()
        res = self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": _a1_d2_answers(), "final": True},
        )
        self.assertEqual(res.status_code, 200, res.text)

        profile = self.client.get("/api/me/competencies", headers=_auth("alice")).json()
        scanning = next(c for c in profile["competencies"] if c["competencyId"] == "scanning_identification")
        self.assertEqual(scanning["status"], "rated")
        self.assertGreater(scanning["score"], 0)
        self.assertGreater(scanning["evidenceCount"], 0)

        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(len(events), 4)

    def test_retry_is_idempotent(self):
        session_id = self._create_a1_d2_session()
        payload = {"phase": "P1", "answers": _a1_d2_answers(), "final": True}
        self.client.post(f"/api/sessions/{session_id}/checkins", headers=_auth("alice"), json=payload)
        self.client.post(f"/api/sessions/{session_id}/checkins", headers=_auth("alice"), json=payload)
        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(len(events), 4)

    def test_non_final_checkin_does_not_create_evidence(self):
        session_id = self._create_a1_d2_session()
        res = self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": _a1_d2_answers(), "final": False},
        )
        self.assertEqual(res.status_code, 200, res.text)
        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(len(events), 0)

    def test_incomplete_submission_no_evidence(self):
        session_id = self._create_a1_d2_session()
        answers = _a1_d2_answers()
        answers["shift_tracker_observations"] = answers["shift_tracker_observations"][:2]
        self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": answers, "final": True},
        )
        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(len(events), 0)

    def test_ownership_other_user_cannot_submit_to_session(self):
        session_id = self._create_a1_d2_session(user="alice")
        res = self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("bob"),
            json={"phase": "P1", "answers": _a1_d2_answers(), "final": True},
        )
        self.assertIn(res.status_code, (403, 404))


if __name__ == "__main__":
    unittest.main()

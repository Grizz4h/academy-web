"""Phase 5B — AI competency evidence E2E tests (mocked provider)."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import jwt
from fastapi.testclient import TestClient

import main as backend_main
from competency.ai.schema import AiCompetencyQuality, AiEvidenceEvaluation
from competency.map_context import clear_frozen_evidence_map_cache
from competency.structured.curriculum import clear_curriculum_cache
from competency.models import CompetencyId
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


def _b2_d5_answers() -> dict:
    return {
        "decision_pattern": "kontrolle_stabilisierung",
        "pattern_evidence": ["kontrollierte_rueck_querpaesse", "struktur_vor_tempo"],
        "pattern_reason": (
            "In mehreren Drucksituationen wurde zuerst die Struktur gesichert, "
            "bevor ein Vorwärtsimpuls kam — sichtbar an Rück- und Querpässen."
        ),
    }


def _mock_b2_d5_ai_result():
    return AiEvidenceEvaluation(
        competencies=[
            AiCompetencyQuality(
                competencyId=CompetencyId.PRESSURE_CONTROL,
                quality=0.72,
                specificity=0.68,
                evidenceAlignment=0.74,
                unsupportedClaims=0.12,
                reasonCode="observation_grounded",
            ),
            AiCompetencyQuality(
                competencyId=CompetencyId.EVIDENCE_ANALYSIS,
                quality=0.66,
                specificity=0.6,
                evidenceAlignment=0.65,
                unsupportedClaims=0.15,
                reasonCode="partial_observation",
            ),
        ]
    )


class AiEvidenceE2ETests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        clear_frozen_evidence_map_cache()
        clear_curriculum_cache()
        os.environ.pop("OPENAI_API_KEY", None)
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

    def _create_session(self, *, drill_id: str, module_id: str, user: str = "alice") -> str:
        res = self.client.post(
            "/api/sessions",
            headers=_auth(user),
            json={
                "user": user,
                "module_id": module_id,
                "drill_id": drill_id,
                "goal": "Test",
                "confidence": 3,
                "observation_scope": "lesson",
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        return res.json()["id"]

    @patch("competency.ai.provider.call_openai_evidence")
    def test_pilot_final_checkin_creates_ai_evidence(self, mock_openai):
        mock_openai.return_value = (
            _mock_b2_d5_ai_result(),
            {"evaluatorVersion": "ai-evidence-v1", "model": "mock"},
        )
        session_id = self._create_session(drill_id="B2_D5", module_id="B2")
        res = self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": _b2_d5_answers(), "final": True},
        )
        self.assertEqual(res.status_code, 200, res.text)
        self.assertEqual(mock_openai.call_count, 1)

        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertGreaterEqual(len(events), 2)
        pressure = next(e for e in events if str(e.competencyId) == "pressure_control")
        self.assertAlmostEqual(pressure.quality, 0.72)
        self.assertEqual(str(pressure.assessmentSource), "ai_review")

        profile = self.client.get("/api/me/competencies", headers=_auth("alice")).json()
        pressure_state = next(c for c in profile["competencies"] if c["competencyId"] == "pressure_control")
        self.assertEqual(pressure_state["status"], "rated")

    @patch("competency.ai.provider.call_openai_evidence")
    def test_retry_is_idempotent(self, mock_openai):
        mock_openai.return_value = (_mock_b2_d5_ai_result(), {"model": "mock"})
        session_id = self._create_session(drill_id="B2_D5", module_id="B2")
        payload = {"phase": "P1", "answers": _b2_d5_answers(), "final": True}
        self.client.post(f"/api/sessions/{session_id}/checkins", headers=_auth("alice"), json=payload)
        self.client.post(f"/api/sessions/{session_id}/checkins", headers=_auth("alice"), json=payload)
        events = list(self.repos.competency_events.list_for_user(self.alice))
        competencies = {str(e.competencyId) for e in events}
        self.assertEqual(len(competencies), len(events))

    @patch("competency.ai.provider.call_openai_evidence")
    def test_non_final_skips_ai(self, mock_openai):
        session_id = self._create_session(drill_id="B2_D5", module_id="B2")
        self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": _b2_d5_answers(), "final": False},
        )
        mock_openai.assert_not_called()
        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(events, [])

    @patch("competency.ai.provider.call_openai_evidence")
    def test_unsupported_drill_no_ai(self, mock_openai):
        session_id = self._create_session(drill_id="A3_D3", module_id="A3")
        self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": {"note": "test"}, "final": True},
        )
        mock_openai.assert_not_called()

    @patch("competency.ai.provider.call_openai_evidence")
    def test_e4_never_ai_evidence(self, mock_openai):
        session_id = self._create_session(drill_id="E4_D1", module_id="E4")
        self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": {"note": "test"}, "final": True},
        )
        mock_openai.assert_not_called()
        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(events, [])

    @patch("competency.ai.provider.call_openai_evidence")
    def test_provider_failure_checkin_still_saved(self, mock_openai):
        mock_openai.return_value = (None, {"model": "mock"})
        session_id = self._create_session(drill_id="B2_D5", module_id="B2")
        res = self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": _b2_d5_answers(), "final": True},
        )
        self.assertEqual(res.status_code, 200, res.text)
        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(events, [])

    def test_ownership_other_user_cannot_submit(self):
        session_id = self._create_session(drill_id="B2_D5", module_id="B2", user="alice")
        res = self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("bob"),
            json={"phase": "P1", "answers": _b2_d5_answers(), "final": True},
        )
        self.assertIn(res.status_code, (403, 404))


if __name__ == "__main__":
    unittest.main()

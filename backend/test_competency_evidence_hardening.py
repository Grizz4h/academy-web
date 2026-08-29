"""Regression tests for HIGH competency evidence pipeline hardening."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import jwt
from fastapi.testclient import TestClient

import main as backend_main
from account_lifecycle import collect_export
from competency.completion_gate import is_submission_complete_for_evidence
from competency.evidence_submission import process_evidence_for_checkin
from competency.map_context import clear_frozen_evidence_map_cache
from competency.service import CompetencyRecomputeService
from competency.structured.curriculum import clear_curriculum_cache, curriculum_drill_config
from entitlements.feature_keys import ACADEMY_PREMIUM
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


def _a1_d2_answers(*, observations: int = 5) -> dict:
    return {
        "shift_tracker_observations": [
            {"id": f"o{i}", "order": i, "position": "low"}
            for i in range(1, observations + 1)
        ],
        "__shift_tracker_stage": "complete",
        "patternNoticed": "changes_often",
    }


class HardenEvidencePipelineTests(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        clear_frozen_evidence_map_cache()
        clear_curriculum_cache()
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        academy = root / "academy"
        for sub in (
            "profiles",
            "rewards",
            "sessions",
            "scenes",
            "obs_runs",
            "obs_entries",
            "obs_players",
            "avatars",
            "competency/events",
            "competency/states",
        ):
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
                        }
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
        self.repos = get_repos()
        self.repos.entitlements.grant_entitlement(
            self.alice_id, ACADEMY_PREMIUM, source="manual"
        )
        self.alice = AuthContext(
            rinq_user_id=self.alice_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="Alice",
            legacy_username="alice",
        )
        self.client = TestClient(backend_main.app)
        self.academy = academy

    def tearDown(self):
        self.client.close()
        for key, value in self._prev.items():
            setattr(backend_main, key, value)
        backend_main._identity_store = backend_main.configure_identity_store(
            backend_main.IDENTITY_STORE_FILE
        )
        self._tmp.cleanup()

    def _create_a1_d2_session(self) -> str:
        res = self.client.post(
            "/api/sessions",
            headers=_auth("alice"),
            json={
                "user": "alice",
                "module_id": "A1",
                "drill_id": "A1_D2",
                "goal": "Test",
                "confidence": 3,
                "observation_scope": "lesson",
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        return res.json()["id"]

    def test_curriculum_config_ignores_session_override(self):
        curriculum_cfg = curriculum_drill_config("A1_D2")
        self.assertGreaterEqual(int(curriculum_cfg.get("minObservations") or 0), 4)
        short = _a1_d2_answers(observations=2)
        short["__shift_tracker_stage"] = "complete"
        # Curriculum thresholds reject short submissions
        self.assertFalse(is_submission_complete_for_evidence("A1_D2", short, curriculum_cfg))

        # Even if the session carries a poisoned minObservations=1, dispatcher uses curriculum
        session = {
            "drill_id": "A1_D2",
            "drills": [
                {
                    "id": "A1_D2",
                    "config": {"minObservations": 1},
                }
            ],
        }
        recompute = CompetencyRecomputeService(self.repos.competency_events, self.repos.competency_states)
        count = process_evidence_for_checkin(
            self.alice,
            session_id="sess-poison",
            session=session,
            answers=short,
            final=True,
            recompute_service=recompute,
        )
        self.assertEqual(count, 0)
        self.assertEqual(list(self.repos.competency_events.list_for_user(self.alice)), [])

        # Poisoned config alone would have accepted 2 observations — prove curriculum path differs
        poisoned = {**curriculum_cfg, "minObservations": 1}
        self.assertTrue(is_submission_complete_for_evidence("A1_D2", short, poisoned))
        self.assertFalse(is_submission_complete_for_evidence("A1_D2", short, curriculum_cfg))

    def test_incomplete_final_no_evidence_and_no_ai(self):
        session_id = self._create_a1_d2_session()
        incomplete = _a1_d2_answers(observations=2)
        with patch("competency.ai.provider.call_openai_evidence") as mock_ai:
            res = self.client.post(
                f"/api/sessions/{session_id}/checkins",
                headers=_auth("alice"),
                json={"phase": "P1", "answers": incomplete, "final": True},
            )
            self.assertEqual(res.status_code, 200, res.text)
            mock_ai.assert_not_called()
        events = list(self.repos.competency_events.list_for_user(self.alice))
        self.assertEqual(events, [])

    @patch("competency.ai.provider.call_openai_evidence")
    def test_retry_final_ai_at_most_once(self, mock_openai):
        from competency.ai.schema import AiCompetencyQuality, AiEvidenceEvaluation
        from competency.models import CompetencyId

        mock_openai.return_value = (
            AiEvidenceEvaluation(
                competencies=[
                    AiCompetencyQuality(
                        competencyId=CompetencyId.PRESSURE_CONTROL,
                        quality=0.7,
                        specificity=0.6,
                        evidenceAlignment=0.65,
                        unsupportedClaims=0.1,
                        reasonCode="observation_grounded",
                    ),
                    AiCompetencyQuality(
                        competencyId=CompetencyId.EVIDENCE_ANALYSIS,
                        quality=0.65,
                        specificity=0.55,
                        evidenceAlignment=0.6,
                        unsupportedClaims=0.15,
                        reasonCode="partial_observation",
                    ),
                ]
            ),
            {"model": "mock"},
        )
        res = self.client.post(
            "/api/sessions",
            headers=_auth("alice"),
            json={
                "user": "alice",
                "module_id": "B2",
                "drill_id": "B2_D5",
                "goal": "Test",
                "confidence": 3,
                "observation_scope": "lesson",
            },
        )
        self.assertEqual(res.status_code, 200, res.text)
        session_id = res.json()["id"]
        answers = {
            "decision_pattern": "kontrolle_stabilisierung",
            "pattern_evidence": ["kontrollierte_rueck_querpaesse"],
            "pattern_reason": (
                "In mehreren Drucksituationen sicherte das Team zuerst Struktur "
                "mit Rückpässen, bevor Tempo kam — sichtbar in der Stichprobe."
            ),
        }
        payload = {"phase": "P1", "answers": answers, "final": True}
        self.client.post(f"/api/sessions/{session_id}/checkins", headers=_auth("alice"), json=payload)
        self.client.post(f"/api/sessions/{session_id}/checkins", headers=_auth("alice"), json=payload)
        self.assertEqual(mock_openai.call_count, 1)

    def test_account_export_includes_competency(self):
        session_id = self._create_a1_d2_session()
        self.client.post(
            f"/api/sessions/{session_id}/checkins",
            headers=_auth("alice"),
            json={"phase": "P1", "answers": _a1_d2_answers(), "final": True},
        )
        payload = collect_export(
            self.alice,
            profiles_dir=str(self.academy / "profiles"),
            rewards_dir=str(self.academy / "rewards"),
            sessions_dir=str(self.academy / "sessions"),
            scenes_dir=str(self.academy / "scenes"),
            obs_runs_dir=str(self.academy / "obs_runs"),
            obs_entries_dir=str(self.academy / "obs_entries"),
            obs_players_dir=str(self.academy / "obs_players"),
            avatars_dir=str(self.academy / "avatars"),
            identity_store=backend_main._identity_store,
        )
        self.assertIn("competency_states", payload)
        self.assertIn("competency_evidence_events", payload)
        self.assertEqual(len(payload["competency_states"]), 8)
        self.assertGreater(len(payload["competency_evidence_events"]), 0)
        event = payload["competency_evidence_events"][0]
        self.assertIn("drillId", event)
        self.assertIn("quality", event)
        self.assertNotIn("api_key", json.dumps(payload).lower())


if __name__ == "__main__":
    unittest.main()

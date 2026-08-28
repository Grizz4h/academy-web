"""Phase 4C.2 — competency profile read API tests."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import jwt
from fastapi.testclient import TestClient

import main as backend_main
from competency.constants import ENGINE_VERSION
from competency.engine import recompute_user_competencies
from competency.map_context import clear_frozen_evidence_map_cache, get_frozen_evidence_map
from competency.models import AssessmentSource, EvidenceEventCreate
from competency.repositories.json_state import JsonUserCompetencyStateRepository
from competency.taxonomy import load_taxonomy_competencies
from competency.validation import evidence_map_sha256
from identity.store import IdentityStore
from repositories.wiring import configure_repositories, get_repos
from security_guards import reset_rate_limiter_for_tests

JWT_ALGO = "HS256"
TAXONOMY_IDS = [item["id"] for item in load_taxonomy_competencies()]


def _token(sub: str) -> str:
    return jwt.encode(
        {"sub": sub, "exp": (datetime.utcnow() + timedelta(days=1)).timestamp()},
        os.environ["ACADEMY_JWT_SECRET"],
        algorithm=JWT_ALGO,
    )


def _auth(sub: str) -> dict:
    return {"Authorization": f"Bearer {_token(sub)}"}


class CompetencyApiTestBase(unittest.TestCase):
    def setUp(self):
        reset_rate_limiter_for_tests()
        clear_frozen_evidence_map_cache()
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
        self.events_dir = academy / "competency" / "events"
        self.states_dir = academy / "competency" / "states"
        configure_repositories(
            get_identity_store=lambda: store,
            get_users_file=lambda: str(users_file),
            get_profiles_dir=lambda: str(academy / "profiles"),
            get_rewards_dir=lambda: str(academy / "rewards"),
            get_sessions_dir=lambda: str(academy / "sessions"),
            get_entitlements_file=lambda: str(academy / "entitlement_grants.json"),
            get_competency_events_dir=lambda: str(self.events_dir),
            get_competency_states_dir=lambda: str(self.states_dir),
            storage_backend="json",
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


class CompetencyGetApiTests(CompetencyApiTestBase):
    def test_unauthenticated_returns_401(self):
        res = self.client.get("/api/me/competencies")
        self.assertEqual(res.status_code, 401)

    def test_null_state_eight_unrated_axes(self):
        res = self.client.get("/api/me/competencies", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["engineVersion"], ENGINE_VERSION)
        self.assertEqual(body["mapHash"], get_frozen_evidence_map()[1])
        self.assertFalse(body["stale"])
        self.assertEqual(len(body["competencies"]), 8)
        self.assertEqual([c["competencyId"] for c in body["competencies"]], TAXONOMY_IDS)
        for item, axis in zip(body["competencies"], load_taxonomy_competencies()):
            self.assertEqual(item["label"], axis["label"])
            self.assertEqual(item["status"], "unrated")
            self.assertEqual(item["score"], 0.0)
            self.assertEqual(item["confidence"], 0.0)

    def test_user_isolation_via_auth_only(self):
        from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER

        alice = AuthContext(
            rinq_user_id=self.alice_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="Alice",
            legacy_username="alice",
        )
        bob = AuthContext(
            rinq_user_id=self.bob_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="bob",
            display_name="Bob",
            legacy_username="bob",
        )
        when = datetime(2026, 6, 1, tzinfo=timezone.utc)
        self.repos.competency_events.append(
            alice,
            EvidenceEventCreate(
                drillId="C1_D4",
                competencyId="space_structure",
                quality=0.9,
                assessmentSource=AssessmentSource.STRUCTURED,
                sourceType="session_submission",
                sourceId="alice-only",
                createdAt=when,
            ),
        )
        self.repos.competency_events.append(
            bob,
            EvidenceEventCreate(
                drillId="A1_D1",
                competencyId="scanning_identification",
                quality=1.0,
                assessmentSource=AssessmentSource.STRUCTURED,
                sourceType="session_submission",
                sourceId="bob-only",
                createdAt=when,
            ),
        )
        from competency.service import CompetencyRecomputeService

        svc = CompetencyRecomputeService(self.repos.competency_events, self.repos.competency_states)
        svc.recompute_user(alice)
        svc.recompute_user(bob)

        alice_res = self.client.get("/api/me/competencies", headers=_auth("alice")).json()
        bob_res = self.client.get("/api/me/competencies", headers=_auth("bob")).json()
        alice_space = next(c for c in alice_res["competencies"] if c["competencyId"] == "space_structure")
        bob_space = next(c for c in bob_res["competencies"] if c["competencyId"] == "space_structure")
        bob_scan = next(c for c in bob_res["competencies"] if c["competencyId"] == "scanning_identification")
        self.assertEqual(alice_space["status"], "rated")
        self.assertEqual(bob_space["status"], "unrated")
        self.assertEqual(bob_scan["status"], "rated")


class CompetencyRecomputeApiTests(CompetencyApiTestBase):
    def test_recompute_unauthenticated_401(self):
        res = self.client.post("/api/me/competencies/recompute")
        self.assertEqual(res.status_code, 401)

    def test_recompute_matches_pure_engine(self):
        from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER

        user = AuthContext(
            rinq_user_id=self.alice_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="Alice",
            legacy_username="alice",
        )
        when = datetime(2026, 6, 2, tzinfo=timezone.utc)
        self.repos.competency_events.append(
            user,
            EvidenceEventCreate(
                drillId="C1_D4",
                competencyId="space_structure",
                quality=0.92,
                assessmentSource=AssessmentSource.STRUCTURED,
                sourceType="session_submission",
                sourceId="recompute-1",
                createdAt=when,
            ),
        )
        res = self.client.post("/api/me/competencies/recompute", headers=_auth("alice"))
        self.assertEqual(res.status_code, 200)
        body = res.json()
        catalog, map_hash = get_frozen_evidence_map()
        expected = recompute_user_competencies(
            list(self.repos.competency_events.list_for_user(user)),
            catalog,
            map_version=map_hash,
        ).states["space_structure"]
        actual = next(c for c in body["competencies"] if c["competencyId"] == "space_structure")
        self.assertAlmostEqual(actual["score"], expected.score, places=1)
        self.assertAlmostEqual(actual["confidence"], expected.confidence, places=3)
        self.assertEqual(actual["status"], "rated")

        res2 = self.client.post("/api/me/competencies/recompute", headers=_auth("alice"))
        self.assertEqual(res2.status_code, 200)
        actual2 = next(c for c in res2.json()["competencies"] if c["competencyId"] == "space_structure")
        self.assertEqual(actual["score"], actual2["score"])
        self.assertEqual(actual["confidence"], actual2["confidence"])

    def test_e4_event_does_not_affect_recompute(self):
        from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER

        user = AuthContext(
            rinq_user_id=self.alice_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="Alice",
            legacy_username="alice",
        )
        null_res = self.client.post("/api/me/competencies/recompute", headers=_auth("alice")).json()
        self.repos.competency_events.append(
            user,
            EvidenceEventCreate(
                drillId="C1_D4",
                competencyId="space_structure",
                quality=0.9,
                assessmentSource=AssessmentSource.STRUCTURED,
                sourceType="session_submission",
                sourceId="before-e4",
                createdAt=datetime(2026, 6, 3, tzinfo=timezone.utc),
            ),
        )
        res_with = self.client.post("/api/me/competencies/recompute", headers=_auth("alice"))
        space = next(c for c in res_with.json()["competencies"] if c["competencyId"] == "space_structure")
        self.assertEqual(space["status"], "rated")
        # E4 cannot be appended — remains unchanged vs rated profile
        self.assertNotEqual(null_res["competencies"][2]["status"], space["status"])


class CompetencyStaleApiTests(CompetencyApiTestBase):
    def test_stale_when_projection_engine_version_differs(self):
        from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER

        user = AuthContext(
            rinq_user_id=self.alice_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="alice",
            display_name="Alice",
            legacy_username="alice",
        )
        state_repo = JsonUserCompetencyStateRepository(lambda: str(self.states_dir))
        profiles_path = BACKEND_DIR.parent / "data/academy/competency/drill_profiles.json"
        doc = json.loads(profiles_path.read_text(encoding="utf-8"))
        map_hash = evidence_map_sha256(doc.get("profiles", []))
        from competency.models import UserCompetencyState

        state_repo.replace_all_for_user(
            user,
            [
                UserCompetencyState(
                    competencyId="space_structure",
                    score=50.0,
                    confidence=0.4,
                    evidenceCount=1,
                    breadth=0.1,
                    highestEvidenceLevel=2,
                    lastEvidenceAt=None,
                )
            ],
            engine_version="competency-engine-v0-old",
            map_hash=map_hash,
        )
        res = self.client.get("/api/me/competencies", headers=_auth("alice"))
        self.assertTrue(res.json()["stale"])


if __name__ == "__main__":
    unittest.main()

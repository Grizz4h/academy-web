"""Phase 4C.1 — competency persistence repository tests (JSON backend)."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ.pop("STORAGE_BACKEND", None)

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.constants import ENGINE_VERSION
from competency.engine import recompute_competency_state
from competency.map_context import clear_frozen_evidence_map_cache, get_frozen_evidence_map
from competency.models import AssessmentSource, EvidenceEventCreate
from competency.repositories.json_evidence import JsonEvidenceEventRepository
from competency.repositories.json_state import JsonUserCompetencyStateRepository
from competency.service import CompetencyRecomputeService
from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER
from identity.store import IdentityStore
from repositories.wiring import configure_repositories, get_repos


class CompetencyPersistenceJsonTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        root = Path(self._tmp.name)
        self.events_dir = root / "competency" / "events"
        self.states_dir = root / "competency" / "states"
        self.events_dir.mkdir(parents=True)
        self.states_dir.mkdir(parents=True)
        store = IdentityStore(str(root / "identity_store.json"))
        ctx = store.ensure_legacy_identity("comp_persist_user", display_name="Persist User")
        self.user_id = ctx.rinq_user_id
        self.user = AuthContext(
            rinq_user_id=self.user_id,
            auth_provider=LEGACY_PASSWORD_PROVIDER,
            auth_subject="comp_persist_user",
            display_name="Persist User",
            legacy_username="comp_persist_user",
        )
        configure_repositories(
            get_identity_store=lambda: store,
            get_users_file=lambda: str(root / "users.json"),
            get_profiles_dir=lambda: str(root / "profiles"),
            get_rewards_dir=lambda: str(root / "rewards"),
            get_sessions_dir=lambda: str(root / "sessions"),
            get_entitlements_file=lambda: str(root / "entitlement_grants.json"),
            get_competency_events_dir=lambda: str(self.events_dir),
            get_competency_states_dir=lambda: str(self.states_dir),
            storage_backend="json",
        )
        self.repos = get_repos()
        self.service = CompetencyRecomputeService(
            self.repos.competency_events,
            self.repos.competency_states,
        )
        clear_frozen_evidence_map_cache()

    def test_append_and_list_hydrates_map_fields(self):
        create = EvidenceEventCreate(
            drillId="C1_D4",
            competencyId="space_structure",
            quality=0.9,
            assessmentSource=AssessmentSource.STRUCTURED,
            sourceType="session_submission",
            sourceId="sess-1:C1_D4",
            createdAt=datetime(2026, 5, 1, tzinfo=timezone.utc),
        )
        event = self.repos.competency_events.append(self.user, create)
        self.assertEqual(event.drillId, "C1_D4")
        self.assertGreater(event.strength, 0.0)
        self.assertGreaterEqual(event.evidenceLevel, 1)
        listed = list(self.repos.competency_events.list_for_user(self.user))
        self.assertEqual(len(listed), 1)
        self.assertEqual(listed[0].eventId, event.eventId)

    def test_idempotent_append_returns_existing(self):
        create = EvidenceEventCreate(
            drillId="C1_D4",
            competencyId="space_structure",
            quality=0.9,
            assessmentSource=AssessmentSource.STRUCTURED,
            sourceType="session_submission",
            sourceId="sess-2:C1_D4",
        )
        first = self.repos.competency_events.append(self.user, create)
        second = self.repos.competency_events.append(self.user, create)
        self.assertEqual(first.eventId, second.eventId)
        self.assertEqual(len(list(self.repos.competency_events.list_for_user(self.user))), 1)

    def test_e4_append_rejected(self):
        create = EvidenceEventCreate(
            drillId="E4_D1",
            competencyId="space_structure",
            quality=0.9,
            assessmentSource=AssessmentSource.STRUCTURED,
            sourceType="session_submission",
            sourceId="sess-e4",
        )
        with self.assertRaises(Exception):
            self.repos.competency_events.append(self.user, create)

    def test_recompute_service_persists_derived_states(self):
        when = datetime(2026, 5, 2, tzinfo=timezone.utc)
        self.repos.competency_events.append(
            self.user,
            EvidenceEventCreate(
                drillId="C1_D4",
                competencyId="space_structure",
                quality=0.92,
                assessmentSource=AssessmentSource.STRUCTURED,
                sourceType="session_submission",
                sourceId="sess-3:C1_D4",
                createdAt=when,
            ),
        )
        result = self.service.recompute_user(self.user)
        self.assertEqual(result.engine_version, ENGINE_VERSION)
        stored = self.repos.competency_states.get(self.user, "space_structure")
        self.assertIsNotNone(stored)
        catalog, _ = get_frozen_evidence_map()
        expected = recompute_competency_state(
            "space_structure",
            list(self.repos.competency_events.list_for_user(self.user)),
            catalog,
        )
        self.assertEqual(stored.score, expected.score)
        self.assertEqual(stored.confidence, expected.confidence)
        self.assertEqual(stored.breadth, expected.breadth)

    def test_append_event_and_recompute(self):
        _, result = self.service.append_event_and_recompute(
            self.user,
            EvidenceEventCreate(
                drillId="C1_D4",
                competencyId="space_structure",
                quality=0.88,
                assessmentSource=AssessmentSource.STRUCTURED,
                sourceType="session_submission",
                sourceId="sess-4:C1_D4",
            ),
        )
        self.assertIn("space_structure", result.states)
        self.assertGreater(result.states["space_structure"].score, 0.0)

    def test_delete_for_user_removes_json_files(self):
        self.repos.competency_events.append(
            self.user,
            EvidenceEventCreate(
                drillId="C1_D4",
                competencyId="space_structure",
                quality=0.8,
                assessmentSource=AssessmentSource.STRUCTURED,
                sourceType="session_submission",
                sourceId="sess-5:C1_D4",
            ),
        )
        self.service.recompute_user(self.user)
        self.assertEqual(self.repos.competency_events.delete_for_user(self.user), 1)
        self.assertEqual(self.repos.competency_states.delete_for_user(self.user), 8)
        self.assertEqual(list(self.repos.competency_events.list_for_user(self.user)), [])


if __name__ == "__main__":
    unittest.main()

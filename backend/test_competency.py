import json
import sys
import unittest
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.models import DrillCompetencyProfile, EvidenceEvent, UserCompetencyState
from competency.validation import validate_drill_profiles, validate_taxonomy


IDS = [
    "scanning_identification", "roles_support", "space_structure", "options_decisions",
    "transition_tempo", "pressure_control", "systems_patterns", "evidence_analysis",
]


def training_weights(value=0):
    return {competency_id: value for competency_id in IDS}


class CompetencyContractTests(unittest.TestCase):
    def test_taxonomy_contains_exactly_eight_unique_ids(self):
        document = json.loads((ROOT_DIR / "data/academy/competency/taxonomy.json").read_text())
        validate_taxonomy(document)
        ids = [item["id"] for item in document["competencies"]]
        self.assertEqual(ids, IDS)
        self.assertEqual(len(ids), len(set(ids)))

    def test_profile_collection_uses_valid_contracts(self):
        document = json.loads((ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text())
        self.assertEqual(len(validate_drill_profiles(document)), 30)

    def test_weight_range_and_unknown_id_are_rejected(self):
        with self.assertRaises(ValidationError):
            DrillCompetencyProfile(drillId="A1_D1", trainingWeights={**training_weights(), "unknown": 2})
        with self.assertRaises(ValidationError):
            DrillCompetencyProfile(drillId="A1_D1", trainingWeights=training_weights(101))

    def test_disabled_evidence_cannot_have_active_parameters(self):
        with self.assertRaises(ValidationError):
            DrillCompetencyProfile(drillId="A1_D1", trainingWeights=training_weights(), evidence={"enabled": False, "level": 1})

    def test_e4_can_be_fully_evidence_disabled(self):
        profile = DrillCompetencyProfile(drillId="E4_D1", trainingWeights=training_weights(), evidence={"enabled": False})
        self.assertFalse(profile.evidence.enabled)
        with self.assertRaises(ValidationError):
            DrillCompetencyProfile(drillId="E4_D1", trainingWeights=training_weights(), evidence={"enabled": True, "weights": {"space_structure": 20}, "level": 1})

    def test_user_state_ranges(self):
        state = UserCompetencyState(competencyId="space_structure", score=0, confidence=0, evidenceCount=0, breadth=0, highestEvidenceLevel=0, lastEvidenceAt=None)
        self.assertEqual(state.score, 0)
        with self.assertRaises(ValidationError):
            UserCompetencyState(competencyId="space_structure", score=101, confidence=0, evidenceCount=0, breadth=0, highestEvidenceLevel=0)

    def test_evidence_event_contract(self):
        event = EvidenceEvent(eventId=uuid4(), userId=uuid4(), drillId="A2_D2", competencyId="options_decisions", quality=0.8, strength=0.5, evidenceLevel=2, assessmentSource="structured", createdAt="2026-08-27T12:00:00Z")
        self.assertEqual(event.evidenceLevel, 2)
        with self.assertRaises(ValidationError):
            EvidenceEvent(eventId=uuid4(), userId=uuid4(), drillId="A2_D2", competencyId="options_decisions", quality=1.1, strength=0.5, evidenceLevel=2, assessmentSource="structured", createdAt="2026-08-27T12:00:00Z")


if __name__ == "__main__":
    unittest.main()

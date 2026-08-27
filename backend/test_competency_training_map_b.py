import hashlib
import json
import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.validation import validate_drill_profiles


IDS = [
    "scanning_identification", "roles_support", "space_structure", "options_decisions",
    "transition_tempo", "pressure_control", "systems_patterns", "evidence_analysis",
]

EXPECTED = {
    "B1_D1": [50, 100, 75, 25, 0, 0, 0, 0],
    "B1_D2": [50, 100, 75, 25, 25, 0, 25, 0],
    "B1_D3": [50, 100, 50, 25, 0, 0, 25, 0],
    "B1_D4": [50, 100, 75, 75, 25, 0, 25, 0],
    "B1_D5": [50, 75, 50, 50, 75, 25, 0, 0],
    "B2_D1": [50, 0, 75, 50, 25, 100, 0, 0],
    "B2_D2": [50, 0, 50, 100, 25, 75, 0, 0],
    "B2_D3": [50, 0, 75, 100, 25, 100, 0, 25],
    "B2_D4": [50, 25, 50, 100, 75, 75, 0, 25],
    "B2_D5": [25, 0, 25, 75, 25, 75, 50, 75],
    "B3_D1": [75, 50, 50, 25, 25, 100, 0, 0],
    "B3_D2": [50, 25, 75, 50, 25, 100, 25, 25],
    "B3_D3": [50, 100, 75, 25, 25, 100, 50, 25],
    "B3_D4": [50, 75, 75, 25, 75, 100, 50, 25],
    "B3_D5": [25, 50, 50, 25, 25, 75, 75, 75],
}

A_MAP_HASH = "68fc8e3dc504ae814c1d150ce27b0c108e2ec4db6ed9a0f70e19160f9645cea1"


class BTrackTrainingMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.profiles = validate_drill_profiles(cls.document)
        cls.b_profiles = [profile for profile in cls.profiles if profile.drillId.startswith("B")]

    def test_collection_contains_fifteen_a_and_fifteen_b_profiles(self):
        a_profiles = [profile for profile in self.document["profiles"] if profile["drillId"].startswith("A")]
        a_hash = hashlib.sha256(
            json.dumps(a_profiles, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        self.assertEqual(len(self.profiles), 83)
        self.assertEqual(len(a_profiles), 15)
        self.assertEqual(a_hash, A_MAP_HASH)
        self.assertEqual([profile.drillId for profile in self.b_profiles], list(EXPECTED))

    def test_each_b_track_has_exactly_five_profiles(self):
        for track in ("B1", "B2", "B3"):
            self.assertEqual(sum(profile.drillId.startswith(f"{track}_") for profile in self.b_profiles), 5)

    def test_all_eight_approved_b_weights_are_exact(self):
        for profile in self.b_profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))

    def test_evidence_is_neutral_and_disabled_for_every_b_profile(self):
        for profile in self.b_profiles:
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)
                self.assertEqual(profile.evidence.weights, {})
                self.assertIsNone(profile.evidence.level)
                self.assertIsNone(profile.evidence.maxStrength)
                self.assertIsNone(profile.evidence.assessmentMode)
                self.assertFalse(profile.evidence.requiresQualityEvaluation)


if __name__ == "__main__":
    unittest.main()

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
    "C1_D1": [50, 25, 100, 0, 0, 75, 50, 0],
    "C1_D2": [50, 75, 100, 0, 0, 75, 75, 0],
    "C1_D3": [50, 50, 75, 50, 50, 100, 75, 25],
    "C1_D4": [50, 75, 100, 25, 50, 75, 100, 25],
    "C1_D5": [25, 50, 75, 25, 25, 75, 100, 75],
    "C2_D1": [50, 0, 100, 50, 0, 100, 50, 0],
    "C2_D2": [50, 50, 100, 0, 0, 75, 100, 0],
    "C2_D3": [50, 25, 100, 50, 25, 100, 75, 25],
    "C2_D4": [50, 50, 75, 25, 75, 100, 100, 25],
    "C2_D5": [25, 25, 75, 25, 25, 75, 100, 75],
    "C3_D1": [50, 25, 100, 0, 0, 0, 75, 0],
    "C3_D2": [50, 75, 100, 50, 0, 0, 75, 0],
    "C3_D3": [50, 50, 100, 25, 50, 25, 100, 25],
    "C3_D4": [50, 25, 75, 100, 50, 0, 75, 25],
    "C3_D5": [25, 50, 75, 50, 25, 0, 100, 75],
}

PREVIOUS_MAP_HASHES = {
    "A": "68fc8e3dc504ae814c1d150ce27b0c108e2ec4db6ed9a0f70e19160f9645cea1",
    "B": "6c46e935e278979d479c5d29030bf278aeaa7df832c227e9ad95da0d377db2c3",
}


class CTrackTrainingMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.profiles = validate_drill_profiles(cls.document)
        cls.c_profiles = [profile for profile in cls.profiles if profile.drillId.startswith("C")]

    def test_collection_contains_45_profiles_and_previous_maps_are_unchanged(self):
        self.assertEqual(len(self.profiles), 45)
        for prefix, expected_hash in PREVIOUS_MAP_HASHES.items():
            previous = [
                profile for profile in self.document["profiles"]
                if profile["drillId"].startswith(prefix)
            ]
            actual_hash = hashlib.sha256(
                json.dumps(previous, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest()
            self.assertEqual(len(previous), 15)
            self.assertEqual(actual_hash, expected_hash)
        self.assertEqual([profile.drillId for profile in self.c_profiles], list(EXPECTED))

    def test_each_c_track_has_exactly_five_profiles(self):
        for track in ("C1", "C2", "C3"):
            self.assertEqual(sum(profile.drillId.startswith(f"{track}_") for profile in self.c_profiles), 5)

    def test_all_eight_approved_c_weights_are_exact(self):
        for profile in self.c_profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))

    def test_evidence_is_neutral_and_disabled_for_every_c_profile(self):
        for profile in self.c_profiles:
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)
                self.assertEqual(profile.evidence.weights, {})
                self.assertIsNone(profile.evidence.level)
                self.assertIsNone(profile.evidence.maxStrength)
                self.assertIsNone(profile.evidence.assessmentMode)
                self.assertFalse(profile.evidence.requiresQualityEvaluation)


if __name__ == "__main__":
    unittest.main()

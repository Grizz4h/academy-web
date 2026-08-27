import json
import sys
import unittest
from collections import Counter
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.validation import training_map_sha256, validate_drill_profiles


IDS = [
    "scanning_identification", "roles_support", "space_structure", "options_decisions",
    "transition_tempo", "pressure_control", "systems_patterns", "evidence_analysis",
]

EXPECTED = {
    "D1_D1": [50, 25, 100, 50, 0, 50, 75, 0],
    "D1_D2": [50, 100, 75, 50, 0, 0, 100, 0],
    "D1_D3": [50, 50, 100, 25, 50, 75, 100, 25],
    "D1_D4": [50, 25, 75, 100, 50, 25, 75, 25],
    "D1_D5": [25, 50, 75, 50, 25, 25, 100, 75],
    "D2_D1": [50, 25, 100, 0, 0, 100, 75, 0],
    "D2_D2": [50, 75, 100, 0, 0, 100, 100, 0],
    "D2_D3": [50, 50, 75, 50, 50, 100, 100, 25],
    "D2_D4": [50, 25, 50, 75, 75, 100, 75, 25],
    "D2_D5": [25, 50, 75, 25, 25, 75, 100, 75],
    "D3_D1": [50, 0, 100, 100, 25, 75, 50, 0],
    "D3_D2": [50, 100, 75, 75, 25, 25, 50, 0],
    "D3_D3": [50, 50, 75, 100, 75, 25, 50, 25],
    "D3_D4": [50, 25, 75, 100, 50, 100, 50, 25],
    "D3_D5": [25, 25, 75, 75, 25, 50, 75, 75],
    "D4_D1": [50, 75, 100, 25, 0, 0, 100, 0],
    "D4_D2": [50, 50, 75, 100, 25, 0, 75, 25],
    "D4_D3": [50, 75, 75, 75, 25, 75, 75, 25],
}

PREVIOUS_TRAINING_MAP_HASHES = {
    "A": "3eac1c6ff7db7ba9a1b73ae06f4ac23ed2f5609659a4f41bd2b063664a8af2e6",
    "B": "2c483613f9003e77f5eb63a1572695ad426974593bff344ab2efa5057ddb2af0",
    "C": "04c26a5acd1f641b44eab1d7fe2cfea125e19465b1c407a74acce894d5d747c9",
}


class DTrackTrainingMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.profiles = validate_drill_profiles(cls.document)
        cls.d_profiles = [profile for profile in cls.profiles if profile.drillId.startswith("D")]

    def test_collection_contains_83_profiles_and_previous_maps_are_unchanged(self):
        self.assertEqual(len(self.profiles), 83)
        for prefix, expected_hash in PREVIOUS_TRAINING_MAP_HASHES.items():
            previous = [
                profile for profile in self.document["profiles"]
                if profile["drillId"].startswith(prefix)
            ]
            self.assertEqual(len(previous), 15)
            self.assertEqual(
                training_map_sha256(self.document["profiles"], prefix=prefix),
                expected_hash,
            )
        self.assertEqual([profile.drillId for profile in self.d_profiles], list(EXPECTED))

    def test_d_distribution_and_removed_d4_d4(self):
        counts = Counter(profile.drillId.split("_")[0] for profile in self.d_profiles)
        self.assertEqual(counts, {"D1": 5, "D2": 5, "D3": 5, "D4": 3})
        self.assertNotIn("D4_D4", {profile.drillId for profile in self.profiles})

    def test_all_eight_approved_d_weights_are_exact(self):
        for profile in self.d_profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))

    def test_evidence_is_neutral_and_disabled_for_every_d_profile(self):
        for profile in self.d_profiles:
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)
                self.assertEqual(profile.evidence.weights, {})
                self.assertIsNone(profile.evidence.level)
                self.assertIsNone(profile.evidence.maxStrength)
                self.assertIsNone(profile.evidence.assessmentMode)
                self.assertFalse(profile.evidence.requiresQualityEvaluation)


if __name__ == "__main__":
    unittest.main()

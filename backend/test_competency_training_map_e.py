import hashlib
import json
import sys
import unittest
from collections import Counter
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
    "E1_D1": [25, 0, 25, 0, 0, 0, 50, 100],
    "E1_D2": [25, 0, 50, 25, 25, 25, 50, 100],
    "E1_D3": [25, 0, 25, 0, 50, 0, 50, 100],
    "E1_D4": [25, 0, 50, 25, 25, 25, 75, 100],
    "E1_D5": [25, 0, 25, 25, 25, 25, 75, 100],
    "E2_D1": [25, 25, 50, 25, 75, 25, 75, 100],
    "E2_D2": [25, 0, 25, 0, 100, 0, 75, 100],
    "E2_D3": [25, 0, 50, 50, 50, 25, 75, 100],
    "E2_D4": [25, 25, 50, 50, 75, 25, 75, 100],
    "E2_D5": [25, 25, 50, 25, 75, 25, 100, 100],
    "E3_D1": [0, 0, 0, 0, 0, 0, 25, 100],
    "E3_D2": [0, 0, 25, 0, 0, 0, 25, 100],
    "E3_D3": [0, 0, 25, 25, 0, 0, 50, 100],
    "E3_D4": [0, 0, 0, 0, 0, 0, 25, 100],
    "E3_D5": [0, 0, 0, 0, 0, 0, 25, 100],
    "E4_D1": [75, 25, 50, 50, 50, 25, 50, 75],
    "E4_D2": [75, 25, 50, 75, 50, 25, 50, 75],
    "E4_D3": [50, 25, 50, 75, 75, 25, 50, 100],
    "E4_D4": [50, 25, 50, 75, 75, 25, 50, 100],
    "E4_D5": [50, 25, 50, 50, 75, 25, 75, 100],
}

PREVIOUS_MAP_HASHES = {
    "A": "68fc8e3dc504ae814c1d150ce27b0c108e2ec4db6ed9a0f70e19160f9645cea1",
    "B": "6c46e935e278979d479c5d29030bf278aeaa7df832c227e9ad95da0d377db2c3",
    "C": "b27aa3d3cd526ef08af731e8b629c950c385f401597e1f6052ab5864bb730f64",
    "D": "5929b1436df046c7ceecb3039f677c593cf2583e79693ff6f22ba7d3d30cb7d6",
}


class ETrackTrainingMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.profiles = validate_drill_profiles(cls.document)
        cls.e_profiles = [profile for profile in cls.profiles if profile.drillId.startswith("E")]

    def test_collection_contains_83_profiles_and_previous_maps_are_unchanged(self):
        self.assertEqual(len(self.profiles), 83)
        for prefix, expected_hash in PREVIOUS_MAP_HASHES.items():
            previous = [
                profile for profile in self.document["profiles"]
                if profile["drillId"].startswith(prefix)
            ]
            actual_hash = hashlib.sha256(
                json.dumps(previous, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest()
            self.assertEqual(actual_hash, expected_hash)
        self.assertEqual([profile.drillId for profile in self.e_profiles], list(EXPECTED))

    def test_each_e_track_has_exactly_five_profiles(self):
        counts = Counter(profile.drillId.split("_")[0] for profile in self.e_profiles)
        self.assertEqual(counts, {"E1": 5, "E2": 5, "E3": 5, "E4": 5})

    def test_all_eight_approved_e_weights_are_exact(self):
        for profile in self.e_profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))

    def test_evidence_is_neutral_and_disabled_for_every_e_profile(self):
        for profile in self.e_profiles:
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)
                self.assertEqual(profile.evidence.weights, {})
                self.assertIsNone(profile.evidence.level)
                self.assertIsNone(profile.evidence.maxStrength)
                self.assertIsNone(profile.evidence.assessmentMode)
                self.assertFalse(profile.evidence.requiresQualityEvaluation)

    def test_e4_is_explicitly_training_only(self):
        e4_profiles = [profile for profile in self.e_profiles if profile.drillId.startswith("E4_")]
        self.assertEqual(len(e4_profiles), 5)
        for profile in e4_profiles:
            self.assertFalse(profile.evidence.enabled)
            self.assertEqual(profile.evidence.weights, {})


if __name__ == "__main__":
    unittest.main()

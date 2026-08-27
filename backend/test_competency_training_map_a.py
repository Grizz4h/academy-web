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
    "A1_D1": [100, 50, 0, 0, 0, 0, 0, 0],
    "A1_D2": [100, 50, 25, 0, 25, 0, 0, 0],
    "A1_D3": [75, 100, 25, 0, 0, 0, 0, 0],
    "A1_D4": [50, 100, 50, 25, 0, 0, 0, 0],
    "A1_D5": [50, 75, 100, 25, 0, 0, 25, 0],
    "A2_D1": [50, 25, 100, 25, 0, 0, 25, 0],
    "A2_D2": [50, 25, 75, 100, 0, 0, 25, 0],
    "A2_D3": [50, 25, 50, 100, 25, 0, 0, 0],
    "A2_D4": [50, 0, 100, 75, 25, 25, 0, 0],
    "A2_D5": [50, 25, 100, 50, 50, 0, 25, 0],
    "A3_D1": [75, 0, 25, 0, 100, 0, 0, 0],
    "A3_D2": [50, 50, 50, 25, 100, 25, 0, 0],
    "A3_D3": [50, 50, 50, 75, 100, 50, 0, 0],
    "A3_D4": [50, 50, 75, 25, 75, 100, 25, 0],
    "A3_D5": [50, 25, 100, 25, 50, 100, 25, 0],
}


class ATrackTrainingMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.profiles = [
            profile for profile in validate_drill_profiles(cls.document)
            if profile.drillId.startswith("A")
        ]

    def test_contains_exactly_the_fifteen_approved_a_profiles(self):
        self.assertEqual([profile.drillId for profile in self.profiles], list(EXPECTED))

    def test_all_eight_approved_weights_are_exact(self):
        for profile in self.profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))

    def test_evidence_is_neutral_and_disabled_for_every_profile(self):
        for profile in self.profiles:
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)
                self.assertEqual(profile.evidence.weights, {})
                self.assertIsNone(profile.evidence.level)
                self.assertIsNone(profile.evidence.maxStrength)
                self.assertIsNone(profile.evidence.assessmentMode)
                self.assertFalse(profile.evidence.requiresQualityEvaluation)


if __name__ == "__main__":
    unittest.main()

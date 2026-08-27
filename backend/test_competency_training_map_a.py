import json
import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.validation import training_map_sha256, validate_drill_profiles


IDS = [
    "scanning_identification", "roles_support", "space_structure", "options_decisions",
    "transition_tempo", "pressure_control", "systems_patterns", "evidence_analysis",
]

# Frozen Training Map V1 — must not change in evidence-map phases.
EXPECTED_TRAINING = {
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

A_TRAINING_MAP_HASH = "3eac1c6ff7db7ba9a1b73ae06f4ac23ed2f5609659a4f41bd2b063664a8af2e6"

EXPECTED_EVIDENCE = {
    "A1_D1": {
        "level": 1,
        "maxStrength": 0.45,
        "weights": {"scanning_identification": 50, "roles_support": 25},
    },
    "A1_D2": {
        "level": 1,
        "maxStrength": 0.55,
        "weights": {
            "scanning_identification": 65,
            "roles_support": 20,
            "space_structure": 20,
            "transition_tempo": 20,
        },
    },
    "A1_D3": {
        "level": 2,
        "maxStrength": 0.60,
        "weights": {
            "scanning_identification": 40,
            "roles_support": 65,
            "space_structure": 20,
        },
    },
    "A1_D4": {
        "level": 2,
        "maxStrength": 0.65,
        "weights": {
            "scanning_identification": 35,
            "roles_support": 75,
            "space_structure": 40,
            "options_decisions": 20,
        },
    },
    "A1_D5": {
        "level": 2,
        "maxStrength": 0.65,
        "weights": {
            "scanning_identification": 30,
            "roles_support": 55,
            "space_structure": 70,
            "systems_patterns": 20,
        },
    },
    "A2_D1": {
        "level": 2,
        "maxStrength": 0.65,
        "weights": {
            "scanning_identification": 30,
            "space_structure": 70,
            "systems_patterns": 20,
        },
    },
    "A2_D2": {
        "level": 2,
        "maxStrength": 0.70,
        "weights": {
            "scanning_identification": 30,
            "space_structure": 55,
            "options_decisions": 75,
        },
    },
    "A2_D3": {
        "level": 2,
        "maxStrength": 0.70,
        "weights": {
            "scanning_identification": 30,
            "space_structure": 35,
            "options_decisions": 80,
            "transition_tempo": 20,
        },
    },
    "A2_D4": {
        "level": 2,
        "maxStrength": 0.70,
        "weights": {
            "scanning_identification": 30,
            "space_structure": 75,
            "options_decisions": 55,
            "transition_tempo": 20,
            "pressure_control": 20,
        },
    },
    "A2_D5": {
        "level": 2,
        "maxStrength": 0.70,
        "weights": {
            "scanning_identification": 30,
            "space_structure": 70,
            "options_decisions": 35,
            "transition_tempo": 45,
            "systems_patterns": 20,
        },
    },
    "A3_D1": {
        "level": 1,
        "maxStrength": 0.65,
        "weights": {
            "scanning_identification": 45,
            "transition_tempo": 80,
            "space_structure": 20,
        },
    },
    "A3_D2": {
        "level": 2,
        "maxStrength": 0.70,
        "weights": {
            "scanning_identification": 30,
            "roles_support": 30,
            "space_structure": 35,
            "transition_tempo": 75,
            "pressure_control": 20,
        },
    },
    "A3_D3": {
        "level": 2,
        "maxStrength": 0.75,
        "weights": {
            "roles_support": 30,
            "space_structure": 35,
            "options_decisions": 55,
            "transition_tempo": 80,
            "pressure_control": 35,
        },
    },
    "A3_D4": {
        "level": 2,
        "maxStrength": 0.75,
        "weights": {
            "scanning_identification": 30,
            "roles_support": 30,
            "space_structure": 50,
            "transition_tempo": 55,
            "pressure_control": 75,
        },
    },
    "A3_D5": {
        "level": 2,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "space_structure": 70,
            "transition_tempo": 40,
            "pressure_control": 80,
        },
    },
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
        self.assertEqual([profile.drillId for profile in self.profiles], list(EXPECTED_TRAINING))

    def test_all_eight_approved_training_weights_are_exact(self):
        for profile in self.profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED_TRAINING[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))

    def test_frozen_training_map_hash(self):
        document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        self.assertEqual(
            training_map_sha256(document["profiles"], prefix="A"),
            A_TRAINING_MAP_HASH,
        )


class ATrackEvidenceMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.all_profiles = validate_drill_profiles(cls.document)
        cls.a_profiles = [p for p in cls.all_profiles if p.drillId.startswith("A")]

    def test_exactly_fifteen_a_profiles_have_evidence_enabled(self):
        enabled_a = [p for p in self.all_profiles if p.drillId.startswith("A") and p.evidence.enabled]
        self.assertEqual(len(enabled_a), 15)
        self.assertEqual([p.drillId for p in enabled_a], list(EXPECTED_EVIDENCE))

    def test_e_remains_evidence_disabled(self):
        for profile in self.all_profiles:
            if not profile.drillId.startswith("E"):
                continue
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)
                self.assertEqual(profile.evidence.weights, {})
                self.assertIsNone(profile.evidence.level)
                self.assertIsNone(profile.evidence.maxStrength)
                self.assertIsNone(profile.evidence.assessmentMode)
                self.assertFalse(profile.evidence.requiresQualityEvaluation)

    def test_e4_remains_training_only(self):
        e4 = [p for p in self.all_profiles if p.drillId.startswith("E4_")]
        self.assertEqual(len(e4), 5)
        for profile in e4:
            self.assertFalse(profile.evidence.enabled)

    def test_approved_a_evidence_contracts(self):
        for profile in self.a_profiles:
            with self.subTest(drillId=profile.drillId):
                expected = EXPECTED_EVIDENCE[profile.drillId]
                self.assertTrue(profile.evidence.enabled)
                self.assertEqual(profile.evidence.level, expected["level"])
                self.assertEqual(profile.evidence.maxStrength, expected["maxStrength"])
                self.assertEqual(profile.evidence.assessmentMode, "structured")
                self.assertTrue(profile.evidence.requiresQualityEvaluation)
                self.assertEqual(
                    {str(k): v for k, v in profile.evidence.weights.items()},
                    expected["weights"],
                )
                self.assertIn(profile.evidence.level, (1, 2))
                self.assertGreaterEqual(profile.evidence.maxStrength, 0)
                self.assertLessEqual(profile.evidence.maxStrength, 1)

    def test_evidence_weights_do_not_exceed_training_and_require_support(self):
        for profile in self.a_profiles:
            with self.subTest(drillId=profile.drillId):
                for competency_id, weight in profile.evidence.weights.items():
                    training = profile.trainingWeights[competency_id]
                    self.assertGreater(training, 0)
                    self.assertLessEqual(weight, training)
                    self.assertGreaterEqual(weight, 0)
                    self.assertLessEqual(weight, 100)


if __name__ == "__main__":
    unittest.main()

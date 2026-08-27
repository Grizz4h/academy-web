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

EXPECTED_TRAINING = {
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

A_TRAINING_MAP_HASH = "3eac1c6ff7db7ba9a1b73ae06f4ac23ed2f5609659a4f41bd2b063664a8af2e6"
B_TRAINING_MAP_HASH = "2c483613f9003e77f5eb63a1572695ad426974593bff344ab2efa5057ddb2af0"

EXPECTED_EVIDENCE = {
    "B1_D1": {
        "level": 2,
        "maxStrength": 0.70,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 75,
            "space_structure": 50,
        },
    },
    "B1_D2": {
        "level": 2,
        "maxStrength": 0.75,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 80,
            "space_structure": 50,
            "transition_tempo": 20,
            "systems_patterns": 20,
        },
    },
    "B1_D3": {
        "level": 2,
        "maxStrength": 0.75,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 80,
            "space_structure": 35,
            "systems_patterns": 20,
        },
    },
    "B1_D4": {
        "level": 2,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 80,
            "space_structure": 50,
            "options_decisions": 55,
            "systems_patterns": 20,
        },
    },
    "B1_D5": {
        "level": 2,
        "maxStrength": 0.75,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 55,
            "space_structure": 35,
            "options_decisions": 35,
            "transition_tempo": 55,
            "pressure_control": 20,
        },
    },
    "B2_D1": {
        "level": 2,
        "maxStrength": 0.75,
        "weights": {
            "scanning_identification": 25,
            "space_structure": 50,
            "options_decisions": 35,
            "transition_tempo": 20,
            "pressure_control": 75,
        },
    },
    "B2_D2": {
        "level": 2,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "space_structure": 35,
            "options_decisions": 80,
            "transition_tempo": 20,
            "pressure_control": 55,
        },
    },
    "B2_D3": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "space_structure": 50,
            "options_decisions": 80,
            "transition_tempo": 20,
            "pressure_control": 75,
            "evidence_analysis": 20,
        },
    },
    "B2_D4": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 20,
            "space_structure": 35,
            "options_decisions": 80,
            "transition_tempo": 55,
            "pressure_control": 55,
            "evidence_analysis": 20,
        },
    },
    "B2_D5": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 20,
            "options_decisions": 55,
            "transition_tempo": 20,
            "pressure_control": 50,
            "systems_patterns": 40,
            "evidence_analysis": 60,
        },
    },
    "B3_D1": {
        "level": 2,
        "maxStrength": 0.75,
        "weights": {
            "scanning_identification": 45,
            "roles_support": 30,
            "space_structure": 35,
            "transition_tempo": 20,
            "pressure_control": 80,
        },
    },
    "B3_D2": {
        "level": 2,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 20,
            "space_structure": 50,
            "options_decisions": 35,
            "transition_tempo": 20,
            "pressure_control": 80,
            "systems_patterns": 20,
            "evidence_analysis": 20,
        },
    },
    "B3_D3": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 75,
            "space_structure": 50,
            "transition_tempo": 20,
            "pressure_control": 80,
            "systems_patterns": 35,
            "evidence_analysis": 20,
        },
    },
    "B3_D4": {
        "level": 3,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 55,
            "space_structure": 50,
            "transition_tempo": 55,
            "pressure_control": 80,
            "systems_patterns": 35,
            "evidence_analysis": 20,
        },
    },
    "B3_D5": {
        "level": 3,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 15,
            "roles_support": 35,
            "space_structure": 35,
            "options_decisions": 20,
            "transition_tempo": 20,
            "pressure_control": 55,
            "systems_patterns": 55,
            "evidence_analysis": 60,
        },
    },
}


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
        self.assertEqual(len(self.profiles), 83)
        self.assertEqual(len(a_profiles), 15)
        self.assertEqual(
            training_map_sha256(self.document["profiles"], prefix="A"),
            A_TRAINING_MAP_HASH,
        )
        self.assertEqual(
            training_map_sha256(self.document["profiles"], prefix="B"),
            B_TRAINING_MAP_HASH,
        )
        self.assertEqual([profile.drillId for profile in self.b_profiles], list(EXPECTED_TRAINING))

    def test_each_b_track_has_exactly_five_profiles(self):
        for track in ("B1", "B2", "B3"):
            self.assertEqual(sum(profile.drillId.startswith(f"{track}_") for profile in self.b_profiles), 5)

    def test_all_eight_approved_b_weights_are_exact(self):
        for profile in self.b_profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED_TRAINING[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))


class BTrackEvidenceMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.all_profiles = validate_drill_profiles(cls.document)
        cls.b_profiles = [p for p in cls.all_profiles if p.drillId.startswith("B")]

    def test_exactly_fifteen_b_profiles_have_evidence_enabled(self):
        enabled_b = [p for p in self.all_profiles if p.drillId.startswith("B") and p.evidence.enabled]
        self.assertEqual(len(enabled_b), 15)
        self.assertEqual([p.drillId for p in enabled_b], list(EXPECTED_EVIDENCE))

    def test_a_evidence_remains_enabled_and_c_through_e_disabled(self):
        enabled_a = [p for p in self.all_profiles if p.drillId.startswith("A") and p.evidence.enabled]
        self.assertEqual(len(enabled_a), 15)
        for profile in self.all_profiles:
            if profile.drillId.startswith(("A", "B")):
                continue
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)

    def test_e4_remains_training_only(self):
        e4 = [p for p in self.all_profiles if p.drillId.startswith("E4_")]
        self.assertEqual(len(e4), 5)
        for profile in e4:
            self.assertFalse(profile.evidence.enabled)

    def test_approved_b_evidence_contracts(self):
        for profile in self.b_profiles:
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
                self.assertIn(profile.evidence.level, (2, 3))
                self.assertGreaterEqual(profile.evidence.maxStrength, 0)
                self.assertLessEqual(profile.evidence.maxStrength, 1)

    def test_evidence_weights_do_not_exceed_training_and_require_support(self):
        for profile in self.b_profiles:
            with self.subTest(drillId=profile.drillId):
                for competency_id, weight in profile.evidence.weights.items():
                    training = profile.trainingWeights[competency_id]
                    self.assertGreater(training, 0)
                    self.assertLessEqual(weight, training)
                    self.assertGreaterEqual(weight, 0)
                    self.assertLessEqual(weight, 100)


if __name__ == "__main__":
    unittest.main()

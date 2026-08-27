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

EXPECTED_TRAINING = {
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
D_TRAINING_MAP_HASH = "05b7524877591b9d3fa5f4e68f76addf3dd674b0aec7684e887d2a7c223e1ff6"

EXPECTED_EVIDENCE = {
    "D1_D1": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 20,
            "space_structure": 80,
            "options_decisions": 35,
            "pressure_control": 35,
            "systems_patterns": 60,
        },
    },
    "D1_D2": {
        "level": 3,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 80,
            "space_structure": 55,
            "options_decisions": 35,
            "systems_patterns": 80,
        },
    },
    "D1_D3": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 35,
            "space_structure": 80,
            "options_decisions": 20,
            "transition_tempo": 35,
            "pressure_control": 55,
            "systems_patterns": 80,
            "evidence_analysis": 20,
        },
    },
    "D1_D4": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 20,
            "space_structure": 55,
            "options_decisions": 80,
            "transition_tempo": 35,
            "pressure_control": 20,
            "systems_patterns": 60,
            "evidence_analysis": 20,
        },
    },
    "D1_D5": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 15,
            "roles_support": 35,
            "space_structure": 55,
            "options_decisions": 35,
            "transition_tempo": 20,
            "pressure_control": 20,
            "systems_patterns": 80,
            "evidence_analysis": 60,
        },
    },
    "D2_D1": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 20,
            "space_structure": 80,
            "pressure_control": 80,
            "systems_patterns": 60,
        },
    },
    "D2_D2": {
        "level": 3,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 55,
            "space_structure": 80,
            "pressure_control": 80,
            "systems_patterns": 80,
        },
    },
    "D2_D3": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 35,
            "space_structure": 55,
            "options_decisions": 35,
            "transition_tempo": 35,
            "pressure_control": 80,
            "systems_patterns": 80,
            "evidence_analysis": 20,
        },
    },
    "D2_D4": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 20,
            "space_structure": 35,
            "options_decisions": 55,
            "transition_tempo": 55,
            "pressure_control": 80,
            "systems_patterns": 60,
            "evidence_analysis": 20,
        },
    },
    "D2_D5": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 15,
            "roles_support": 35,
            "space_structure": 55,
            "options_decisions": 20,
            "transition_tempo": 20,
            "pressure_control": 55,
            "systems_patterns": 80,
            "evidence_analysis": 60,
        },
    },
    "D3_D1": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "space_structure": 80,
            "options_decisions": 80,
            "transition_tempo": 20,
            "pressure_control": 55,
            "systems_patterns": 35,
        },
    },
    "D3_D2": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 80,
            "space_structure": 55,
            "options_decisions": 55,
            "transition_tempo": 20,
            "pressure_control": 20,
            "systems_patterns": 35,
        },
    },
    "D3_D3": {
        "level": 4,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 35,
            "space_structure": 55,
            "options_decisions": 80,
            "transition_tempo": 55,
            "pressure_control": 20,
            "systems_patterns": 35,
            "evidence_analysis": 20,
        },
    },
    "D3_D4": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 20,
            "space_structure": 55,
            "options_decisions": 80,
            "transition_tempo": 35,
            "pressure_control": 80,
            "systems_patterns": 35,
            "evidence_analysis": 20,
        },
    },
    "D3_D5": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 15,
            "roles_support": 20,
            "space_structure": 55,
            "options_decisions": 55,
            "transition_tempo": 20,
            "pressure_control": 35,
            "systems_patterns": 55,
            "evidence_analysis": 60,
        },
    },
    "D4_D1": {
        "level": 3,
        "maxStrength": 0.80,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 55,
            "space_structure": 80,
            "options_decisions": 20,
            "systems_patterns": 80,
        },
    },
    "D4_D2": {
        "level": 4,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 35,
            "space_structure": 55,
            "options_decisions": 80,
            "transition_tempo": 20,
            "systems_patterns": 60,
            "evidence_analysis": 20,
        },
    },
    "D4_D3": {
        "level": 4,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 25,
            "roles_support": 55,
            "space_structure": 55,
            "options_decisions": 55,
            "transition_tempo": 20,
            "pressure_control": 55,
            "systems_patterns": 60,
            "evidence_analysis": 20,
        },
    },
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
        self.assertEqual(
            training_map_sha256(self.document["profiles"], prefix="D"),
            D_TRAINING_MAP_HASH,
        )
        self.assertEqual([profile.drillId for profile in self.d_profiles], list(EXPECTED_TRAINING))

    def test_d_distribution_and_removed_d4_d4(self):
        counts = Counter(profile.drillId.split("_")[0] for profile in self.d_profiles)
        self.assertEqual(counts, {"D1": 5, "D2": 5, "D3": 5, "D4": 3})
        self.assertNotIn("D4_D4", {profile.drillId for profile in self.profiles})

    def test_all_eight_approved_d_weights_are_exact(self):
        for profile in self.d_profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED_TRAINING[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))


class DTrackEvidenceMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.all_profiles = validate_drill_profiles(cls.document)
        cls.d_profiles = [p for p in cls.all_profiles if p.drillId.startswith("D")]

    def test_exactly_eighteen_d_profiles_have_evidence_enabled(self):
        enabled_d = [p for p in self.all_profiles if p.drillId.startswith("D") and p.evidence.enabled]
        self.assertEqual(len(enabled_d), 18)
        self.assertEqual([p.drillId for p in enabled_d], list(EXPECTED_EVIDENCE))
        counts = Counter(p.drillId.split("_")[0] for p in enabled_d)
        self.assertEqual(counts, {"D1": 5, "D2": 5, "D3": 5, "D4": 3})
        self.assertNotIn("D4_D4", {p.drillId for p in self.all_profiles})

    def test_a_b_c_remain_enabled_and_e_disabled(self):
        self.assertEqual(sum(1 for p in self.all_profiles if p.drillId.startswith("A") and p.evidence.enabled), 15)
        self.assertEqual(sum(1 for p in self.all_profiles if p.drillId.startswith("B") and p.evidence.enabled), 15)
        self.assertEqual(sum(1 for p in self.all_profiles if p.drillId.startswith("C") and p.evidence.enabled), 15)
        for profile in self.all_profiles:
            if not profile.drillId.startswith("E"):
                continue
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)

    def test_e4_remains_training_only(self):
        e4 = [p for p in self.all_profiles if p.drillId.startswith("E4_")]
        self.assertEqual(len(e4), 5)
        for profile in e4:
            self.assertFalse(profile.evidence.enabled)

    def test_approved_d_evidence_contracts(self):
        for profile in self.d_profiles:
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
                self.assertIn(profile.evidence.level, (3, 4))
                self.assertGreaterEqual(profile.evidence.maxStrength, 0)
                self.assertLessEqual(profile.evidence.maxStrength, 1)

    def test_evidence_weights_do_not_exceed_training_and_require_support(self):
        for profile in self.d_profiles:
            with self.subTest(drillId=profile.drillId):
                for competency_id, weight in profile.evidence.weights.items():
                    training = profile.trainingWeights[competency_id]
                    self.assertGreater(training, 0)
                    self.assertLessEqual(weight, training)


if __name__ == "__main__":
    unittest.main()

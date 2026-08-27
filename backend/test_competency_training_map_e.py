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

PREVIOUS_TRAINING_MAP_HASHES = {
    "A": "3eac1c6ff7db7ba9a1b73ae06f4ac23ed2f5609659a4f41bd2b063664a8af2e6",
    "B": "2c483613f9003e77f5eb63a1572695ad426974593bff344ab2efa5057ddb2af0",
    "C": "04c26a5acd1f641b44eab1d7fe2cfea125e19465b1c407a74acce894d5d747c9",
    "D": "05b7524877591b9d3fa5f4e68f76addf3dd674b0aec7684e887d2a7c223e1ff6",
}
E_TRAINING_MAP_HASH = "5252986a5ebb12d6621a3a51fe7e7516e9e6683a36e77d17b88391d9bd9c0dda"

EXPECTED_EVIDENCE = {
    "E1_D1": {
        "level": 4,
        "maxStrength": 0.85,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 20,
            "systems_patterns": 40,
            "evidence_analysis": 85,
        },
    },
    "E1_D2": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 35,
            "options_decisions": 20,
            "transition_tempo": 20,
            "pressure_control": 20,
            "systems_patterns": 40,
            "evidence_analysis": 85,
        },
    },
    "E1_D3": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 20,
            "transition_tempo": 40,
            "systems_patterns": 40,
            "evidence_analysis": 85,
        },
    },
    "E1_D4": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 35,
            "options_decisions": 20,
            "transition_tempo": 20,
            "pressure_control": 20,
            "systems_patterns": 60,
            "evidence_analysis": 90,
        },
    },
    "E1_D5": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 20,
            "options_decisions": 20,
            "transition_tempo": 20,
            "pressure_control": 20,
            "systems_patterns": 60,
            "evidence_analysis": 90,
        },
    },
    "E2_D1": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 15,
            "roles_support": 20,
            "space_structure": 35,
            "options_decisions": 20,
            "transition_tempo": 60,
            "pressure_control": 20,
            "systems_patterns": 60,
            "evidence_analysis": 85,
        },
    },
    "E2_D2": {
        "level": 4,
        "maxStrength": 0.90,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 20,
            "transition_tempo": 80,
            "systems_patterns": 60,
            "evidence_analysis": 90,
        },
    },
    "E2_D3": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "scanning_identification": 15,
            "space_structure": 35,
            "options_decisions": 35,
            "transition_tempo": 40,
            "pressure_control": 20,
            "systems_patterns": 60,
            "evidence_analysis": 90,
        },
    },
    "E2_D4": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "scanning_identification": 15,
            "roles_support": 20,
            "space_structure": 35,
            "options_decisions": 35,
            "transition_tempo": 60,
            "pressure_control": 20,
            "systems_patterns": 60,
            "evidence_analysis": 90,
        },
    },
    "E2_D5": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "scanning_identification": 15,
            "roles_support": 20,
            "space_structure": 35,
            "options_decisions": 20,
            "transition_tempo": 60,
            "pressure_control": 20,
            "systems_patterns": 80,
            "evidence_analysis": 90,
        },
    },
    "E3_D1": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "systems_patterns": 20,
            "evidence_analysis": 90,
        },
    },
    "E3_D2": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "space_structure": 20,
            "systems_patterns": 20,
            "evidence_analysis": 90,
        },
    },
    "E3_D3": {
        "level": 5,
        "maxStrength": 0.95,
        "weights": {
            "space_structure": 20,
            "options_decisions": 20,
            "systems_patterns": 40,
            "evidence_analysis": 90,
        },
    },
    "E3_D4": {
        "level": 5,
        "maxStrength": 1.00,
        "weights": {
            "systems_patterns": 20,
            "evidence_analysis": 95,
        },
    },
    "E3_D5": {
        "level": 5,
        "maxStrength": 1.00,
        "weights": {
            "systems_patterns": 20,
            "evidence_analysis": 95,
        },
    },
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
        for prefix, expected_hash in PREVIOUS_TRAINING_MAP_HASHES.items():
            self.assertEqual(
                training_map_sha256(self.document["profiles"], prefix=prefix),
                expected_hash,
            )
        self.assertEqual(
            training_map_sha256(self.document["profiles"], prefix="E"),
            E_TRAINING_MAP_HASH,
        )
        self.assertEqual([profile.drillId for profile in self.e_profiles], list(EXPECTED_TRAINING))

    def test_each_e_track_has_exactly_five_profiles(self):
        counts = Counter(profile.drillId.split("_")[0] for profile in self.e_profiles)
        self.assertEqual(counts, {"E1": 5, "E2": 5, "E3": 5, "E4": 5})

    def test_all_eight_approved_e_weights_are_exact(self):
        for profile in self.e_profiles:
            with self.subTest(drillId=profile.drillId):
                actual = [profile.trainingWeights[competency_id] for competency_id in IDS]
                self.assertEqual(actual, EXPECTED_TRAINING[profile.drillId])
                self.assertEqual(set(profile.trainingWeights), set(IDS))


class ETrackEvidenceMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads(
            (ROOT_DIR / "data/academy/competency/drill_profiles.json").read_text()
        )
        cls.all_profiles = validate_drill_profiles(cls.document)
        cls.e_profiles = [p for p in cls.all_profiles if p.drillId.startswith("E")]
        cls.e123 = [p for p in cls.e_profiles if not p.drillId.startswith("E4_")]
        cls.e4 = [p for p in cls.e_profiles if p.drillId.startswith("E4_")]

    def test_cluster1_evidence_coverage_totals(self):
        enabled = [p for p in self.all_profiles if p.evidence.enabled]
        disabled_e4 = [p for p in self.all_profiles if p.drillId.startswith("E4_")]
        self.assertEqual(len(self.all_profiles), 83)
        self.assertEqual(len(enabled), 78)
        self.assertEqual(len(disabled_e4), 5)
        self.assertTrue(all(not p.evidence.enabled for p in disabled_e4))
        self.assertNotIn("D4_D4", {p.drillId for p in self.all_profiles})

    def test_e1_e2_e3_enabled_counts(self):
        for track in ("E1", "E2", "E3"):
            enabled = [p for p in self.all_profiles if p.drillId.startswith(f"{track}_") and p.evidence.enabled]
            self.assertEqual(len(enabled), 5, track)
        self.assertEqual([p.drillId for p in self.e123], list(EXPECTED_EVIDENCE))

    def test_a_b_c_d_remain_enabled(self):
        self.assertEqual(sum(1 for p in self.all_profiles if p.drillId.startswith("A") and p.evidence.enabled), 15)
        self.assertEqual(sum(1 for p in self.all_profiles if p.drillId.startswith("B") and p.evidence.enabled), 15)
        self.assertEqual(sum(1 for p in self.all_profiles if p.drillId.startswith("C") and p.evidence.enabled), 15)
        self.assertEqual(sum(1 for p in self.all_profiles if p.drillId.startswith("D") and p.evidence.enabled), 18)

    def test_e4_remains_fully_training_only_and_guarded(self):
        self.assertEqual(len(self.e4), 5)
        for profile in self.e4:
            with self.subTest(drillId=profile.drillId):
                self.assertFalse(profile.evidence.enabled)
                self.assertEqual(profile.evidence.weights, {})
                self.assertIsNone(profile.evidence.level)
                self.assertIsNone(profile.evidence.maxStrength)
                self.assertIsNone(profile.evidence.assessmentMode)
                self.assertFalse(profile.evidence.requiresQualityEvaluation)
                # High training weights must not imply accidental evidence activation.
                self.assertGreater(sum(profile.trainingWeights.values()), 0)

    def test_approved_e123_evidence_contracts(self):
        for profile in self.e123:
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
                self.assertIn(profile.evidence.level, (4, 5))
                self.assertGreaterEqual(profile.evidence.maxStrength, 0)
                self.assertLessEqual(profile.evidence.maxStrength, 1)

    def test_evidence_weights_do_not_exceed_training_and_require_support(self):
        for profile in self.e123:
            with self.subTest(drillId=profile.drillId):
                for competency_id, weight in profile.evidence.weights.items():
                    training = profile.trainingWeights[competency_id]
                    self.assertGreater(training, 0)
                    self.assertLessEqual(weight, training)

    def test_e3_d4_and_d5_cap_strength_without_implying_score(self):
        for drill_id in ("E3_D4", "E3_D5"):
            profile = next(p for p in self.e123 if p.drillId == drill_id)
            with self.subTest(drillId=drill_id):
                self.assertEqual(profile.evidence.level, 5)
                self.assertEqual(profile.evidence.maxStrength, 1.0)
                self.assertEqual(profile.evidence.weights["evidence_analysis"], 95)
                self.assertEqual(profile.trainingWeights["evidence_analysis"], 100)
                # Capacity metadata only — no score/event semantics in V1 map.
                self.assertIsNone(getattr(profile, "score", None))


if __name__ == "__main__":
    unittest.main()

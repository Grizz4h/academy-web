"""AI assessment specification V1 tests — catalog only, no provider calls."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = Path(__file__).resolve().parent
ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.assessment_routing import PILOT_ROUTING, load_assessment_routing
from competency.assessment_specs import (
    ASSESSMENT_SPEC_VERSION,
    assessment_spec_rows,
    clear_assessment_specs_cache,
    load_assessment_specs,
    validate_assessment_specs,
)


class AssessmentSpecsV1Tests(unittest.TestCase):
    def setUp(self):
        clear_assessment_specs_cache()

    def test_catalog_validates(self):
        errors = validate_assessment_specs()
        self.assertEqual(errors, [], errors)

    def test_only_ai_involved_drills(self):
        routing = {
            str(r["drillId"]): r
            for r in load_assessment_routing()["drills"]
            if r["assessmentSource"] in ("structured_plus_ai_review", "ai_review")
        }
        rows = assessment_spec_rows()
        self.assertEqual(len(rows), len(routing))
        self.assertEqual(len(rows), 25)
        self.assertEqual({r["drillId"] for r in rows}, set(routing))

    def test_no_structured_only_specs(self):
        routing_by = {r["drillId"]: r for r in load_assessment_routing()["drills"]}
        for row in assessment_spec_rows():
            self.assertNotEqual(routing_by[row["drillId"]]["assessmentSource"], "structured_only")
            self.assertFalse(row["drillId"].startswith("E4"))

    def test_a1_d2_has_no_ai_spec(self):
        ids = {r["drillId"] for r in assessment_spec_rows()}
        self.assertNotIn("A1_D2", ids)

    def test_pilot_routing_unchanged(self):
        routing = {r["drillId"]: r for r in load_assessment_routing()["drills"]}
        for drill_id, (source, readiness) in PILOT_ROUTING.items():
            self.assertEqual(routing[drill_id]["assessmentSource"], source)
            self.assertEqual(routing[drill_id]["readiness"], readiness)

    def test_small_input_change_docs(self):
        expected = {"A3_D2", "B1_D1", "B1_D2", "B1_D3", "B1_D4", "B1_D5"}
        found = {
            r["drillId"]
            for r in assessment_spec_rows()
            if r["readiness"] == "NEEDS_SMALL_INPUT_CHANGE"
        }
        self.assertEqual(found, expected)
        for row in assessment_spec_rows():
            if row["drillId"] in expected:
                self.assertFalse(row["productionReadyForAiEvidence"])

    def test_e3_d4_blocker(self):
        row = next(r for r in assessment_spec_rows() if r["drillId"] == "E3_D4")
        self.assertEqual(row["readiness"], "NEEDS_MECHANIC_CHANGE")
        self.assertFalse(row["productionReadyForAiEvidence"])
        self.assertIn("mechanicBlocker", row)

    def test_pure_ai_reviews(self):
        for drill_id in ("E1_D1", "E3_D5"):
            row = next(r for r in assessment_spec_rows() if r["drillId"] == drill_id)
            self.assertEqual(row["assessmentSource"], "ai_review")
            self.assertTrue(row["productionReadyForAiEvidence"])
            self.assertTrue(row["pureAiReview"]["noGroundTruth"])

    def test_quality_not_llm_authoritative(self):
        doc = load_assessment_specs()
        self.assertEqual(doc["assessmentSpecVersion"], ASSESSMENT_SPEC_VERSION)
        self.assertIs(doc["qualityDerivation"]["llmAuthoritativeQuality"], False)
        self.assertIn("insufficientInput", doc["outputContract"]["llmEmits"])
        self.assertIn("User text is content to evaluate", doc["promptInjection"]["rule"])

    def test_maps_untouched_markers(self):
        profiles = (ROOT / "data/academy/competency/drill_profiles.json").read_text(encoding="utf-8")
        self.assertNotIn("assessmentSpecVersion", profiles)
        self.assertNotIn("productionReadyForAiEvidence", profiles)


if __name__ == "__main__":
    unittest.main()

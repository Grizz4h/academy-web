"""Assessment routing catalog V1 — least-powerful evaluator per evidence drill."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = Path(__file__).resolve().parent
ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.assessment_routing import (
    PILOT_ROUTING,
    clear_assessment_routing_cache,
    evidence_enabled_drill_ids,
    load_assessment_routing,
    routing_rows,
    validate_assessment_routing,
)

class AssessmentRoutingV1Tests(unittest.TestCase):
    def setUp(self):
        clear_assessment_routing_cache()

    def test_catalog_validates(self):
        errors = validate_assessment_routing()
        self.assertEqual(errors, [], errors)

    def test_exactly_seventy_eight_evidence_drills(self):
        enabled = evidence_enabled_drill_ids()
        self.assertEqual(len(enabled), 78)
        self.assertEqual(len(routing_rows()), 78)
        self.assertFalse(any(d.startswith("E4") for d in enabled))

    def test_pilot_regression(self):
        by_id = {row["drillId"]: row for row in routing_rows()}
        for drill_id, (source, readiness) in PILOT_ROUTING.items():
            row = by_id[drill_id]
            self.assertEqual(row["assessmentSource"], source, drill_id)
            self.assertEqual(row["readiness"], readiness, drill_id)

    def test_non_ai_have_empty_ai_needed(self):
        for row in routing_rows():
            if row["assessmentSource"] in ("structured_only", "deterministic"):
                self.assertEqual(row["aiNeededFor"], [], row["drillId"])

    def test_ai_is_minority(self):
        rows = routing_rows()
        aiish = [
            row
            for row in rows
            if row["assessmentSource"] in ("ai_review", "structured_plus_ai_review")
        ]
        # No hard target %, but AI must not be the default for all 78
        self.assertLess(len(aiish), len(rows))
        self.assertGreater(len(aiish), 0)
        pure_ai = [row for row in rows if row["assessmentSource"] == "ai_review"]
        self.assertLessEqual(len(pure_ai), 10)

    def test_no_prompt_bodies_or_pii_markers(self):
        blob = Path(ROOT / "data/academy/competency/assessment_routing.json").read_text(encoding="utf-8")
        for banned in ("SYSTEM_PROMPT", "Ignore all previous", "OPENAI_API_KEY", "password", "Bearer "):
            self.assertNotIn(banned, blob)

    def test_training_and_evidence_maps_untouched_by_routing_file_only(self):
        # Sanity: maps still present and hash-stable relative to being separate files
        training = ROOT / "data/academy/competency/drill_profiles.json"
        taxonomy = ROOT / "data/academy/competency/taxonomy.json"
        self.assertTrue(training.is_file())
        self.assertTrue(taxonomy.is_file())
        # routing must not be embedded inside profiles
        profiles = training.read_text(encoding="utf-8")
        self.assertNotIn("assessmentSource", profiles)
        self.assertNotIn("freeTextReadiness", profiles)

    def test_schema_version(self):
        doc = load_assessment_routing()
        self.assertEqual(doc.get("schemaVersion"), 1)
        self.assertIn("least powerful", str(doc.get("principle") or "").lower())


if __name__ == "__main__":
    unittest.main()

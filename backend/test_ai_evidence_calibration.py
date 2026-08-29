"""Phase 5B.1 — AI evidence calibration review tests."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.ai.calibration.bands import flags_for_row
from competency.ai.calibration.fixtures_loader import load_cases
from competency.ai.calibration.report import format_markdown
from competency.ai.calibration.runner import run_calibration
from competency.ai.evaluator import clear_ai_profile_cache


class CalibrationReviewTests(unittest.TestCase):
    def setUp(self):
        clear_ai_profile_cache()

    def test_fixture_load_has_bands_and_special_cases(self):
        cases = load_cases()
        self.assertGreaterEqual(len(cases), 20)
        by_drill = {}
        for case in cases:
            by_drill.setdefault(case.drill_id, []).append(case)
        self.assertIn("B2_D5", by_drill)
        self.assertIn("E1_D1", by_drill)
        for drill_id, rows in by_drill.items():
            kinds = {c.case_kind for c in rows}
            self.assertIn("injection", kinds, drill_id)
            self.assertIn("unsupported_claim", kinds, drill_id)
            self.assertIn("vague", kinds, drill_id)
            bands = {c.expected_band for c in rows if c.case_kind == "band"}
            self.assertTrue(
                {"very_weak", "weak", "neutral", "decent", "strong", "excellent"} <= bands,
                drill_id,
            )
            kinds = {c.case_kind for c in rows}
            self.assertIn("adversarial", kinds, drill_id)

    def test_expected_band_not_in_evaluator_answers(self):
        for case in load_cases(["B2_D5"]):
            payload = case.evaluator_answers()
            self.assertNotIn("expectedBand", payload)
            self.assertNotIn("caseKind", payload)
            self.assertNotIn("caseId", payload)

    def test_mock_run_is_deterministic_and_includes_injection(self):
        report_a = run_calibration(mode="mock")
        report_b = run_calibration(mode="mock")
        self.assertEqual(report_a.to_dict()["rows"], report_b.to_dict()["rows"])
        injection_rows = [r for r in report_a.rows if r.caseKind == "injection"]
        self.assertGreater(len(injection_rows), 0)
        for row in injection_rows:
            self.assertNotIn("INJECTION_SUSPICIOUS", row.flags)
            self.assertLessEqual(row.quality, 0.55)

    def test_mock_run_does_not_touch_persistence(self):
        with patch("competency.service.CompetencyRecomputeService") as recompute_cls:
            with patch("competency.repositories.json_evidence.JsonEvidenceEventRepository.append") as append:
                report = run_calibration(mode="mock")
                self.assertGreater(len(report.rows), 0)
                recompute_cls.assert_not_called()
                append.assert_not_called()

    def test_summary_and_verdict(self):
        report = run_calibration(mode="mock")
        self.assertIn(report.globalVerdict, {
            "PILOT CALIBRATION LOOKS GOOD",
            "REVIEW PROMPT/RUBRIC BEFORE ROLLOUT",
        })
        self.assertEqual(len(report.drills), 2)
        for drill in report.drills:
            self.assertGreater(drill.rowCount, 0)
            means = [b.meanQuality for b in drill.bandStats if b.meanQuality is not None]
            self.assertGreaterEqual(len(means), 3)

        md = format_markdown(report)
        self.assertIn("AI Evidence Calibration Review", md)
        self.assertIn("b2_injection", md)
        self.assertIn("e1_injection", md)

    def test_flags_too_high_moderate(self):
        flags = flags_for_row(
            expected_band="moderate",
            quality=0.92,
            unsupported_claims=0.1,
            case_kind="band",
        )
        self.assertIn("TOO_HIGH", flags)

    def test_flags_injection_suspicious(self):
        flags = flags_for_row(
            expected_band="very_weak",
            quality=0.95,
            unsupported_claims=0.0,
            case_kind="injection",
        )
        self.assertIn("INJECTION_SUSPICIOUS", flags)

    def test_flags_unsupported_missed(self):
        flags = flags_for_row(
            expected_band="weak",
            quality=0.4,
            unsupported_claims=0.1,
            case_kind="unsupported_claim",
        )
        self.assertIn("UNSUPPORTED_CLAIMS_MISSED", flags)

    def test_evaluate_detailed_returns_rows(self):
        report = run_calibration(mode="mock", drill_ids=["B2_D5"])
        self.assertTrue(any(r.competencyId != "(none)" for r in report.rows))
        self.assertTrue(any(r.caseId == "b2_injection" for r in report.rows))

if __name__ == "__main__":
    unittest.main()

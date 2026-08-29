"""Calibration-pass contract tests for E1_D1 + B2_D5 prompts/rubrics."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.ai.calibration.bands import BAND_ORDER, BAND_RANGES, flags_for_row
from competency.ai.calibration.fixtures_loader import load_cases
from competency.ai.calibration.mock_provider import MOCK_QUALITY_BY_BAND
from competency.ai.calibration.runner import run_calibration
from competency.ai.constants import AI_PROMPT_VERSION, RUBRIC_VERSION_BY_DRILL
from competency.ai.evaluator import clear_ai_profile_cache
from competency.ai.prompt import DRILL_RUBRIC_GUIDANCE, SYSTEM_PROMPT_V2, build_user_prompt
from competency.ai.rubrics import build_ai_evaluation_input


ANTI_BIAS_MARKERS = (
    "Do not reward length",
    "Do not reward confident tone",
    "Do not infer missing observations",
    "Do not assume tactical intent",
    "Score only evidence explicitly supported",
)

REQUIRED_BANDS = set(BAND_ORDER)
ADVERSARIAL_KINDS = {
    "e1_adv_long_empty": "very_weak",
    "e1_adv_short_precise": "strong",
    "e1_adv_confident_unsupported": "weak",
    "e1_adv_hockey_no_obs": "weak",
    "e1_adv_uncertain_good": "decent",
    "b2_adv_long_empty": "very_weak",
    "b2_adv_short_precise": "strong",
    "b2_adv_confident_unsupported": "weak",
    "b2_adv_hockey_no_obs": "weak",
    "b2_adv_uncertain_good": "decent",
}


class CalibrationPassContractTests(unittest.TestCase):
    def setUp(self):
        clear_ai_profile_cache()

    def test_prompt_versions_bumped(self):
        self.assertEqual(AI_PROMPT_VERSION, "v2")
        self.assertEqual(RUBRIC_VERSION_BY_DRILL["B2_D5"], "B2_D5-rubric-v2")
        self.assertEqual(RUBRIC_VERSION_BY_DRILL["E1_D1"], "E1_D1-rubric-v2")

    def test_system_prompt_anti_bias(self):
        for marker in ANTI_BIAS_MARKERS:
            self.assertIn(marker, SYSTEM_PROMPT_V2)

    def test_drill_specific_rubrics_present(self):
        self.assertIn("evidence_analysis", DRILL_RUBRIC_GUIDANCE["E1_D1"])
        self.assertIn("repetition", DRILL_RUBRIC_GUIDANCE["E1_D1"])
        self.assertIn("options_decisions", DRILL_RUBRIC_GUIDANCE["B2_D5"])
        self.assertIn("pressure_control", DRILL_RUBRIC_GUIDANCE["B2_D5"])
        self.assertIn("outcome", DRILL_RUBRIC_GUIDANCE["B2_D5"])

    def test_user_prompt_embeds_drill_rubric_and_anti_bias(self):
        for drill_id in ("E1_D1", "B2_D5"):
            cases = [c for c in load_cases([drill_id]) if c.case_kind == "band"]
            self.assertTrue(cases)
            evaluation = build_ai_evaluation_input(
                drill_id,
                cases[0].evaluator_answers(),
                cases[0].drill_config or {},
                allowed_competency_ids={"evidence_analysis", "pressure_control", "options_decisions"},
                rubric_version=RUBRIC_VERSION_BY_DRILL[drill_id],
                drill_title=cases[0].drill_title,
            )
            self.assertIsNotNone(evaluation)
            prompt = build_user_prompt(evaluation)
            self.assertIn(DRILL_RUBRIC_GUIDANCE[drill_id][:40], prompt)
            self.assertIn("do not reward length", prompt.lower())

    def test_six_band_coverage_per_drill(self):
        for drill_id in ("E1_D1", "B2_D5"):
            bands = {
                c.expected_band
                for c in load_cases([drill_id])
                if c.case_kind == "band"
            }
            self.assertTrue(REQUIRED_BANDS <= bands, f"{drill_id} missing bands: {REQUIRED_BANDS - bands}")

    def test_adversarial_cases_present_with_bands(self):
        by_id = {c.case_id: c for c in load_cases()}
        for case_id, band in ADVERSARIAL_KINDS.items():
            self.assertIn(case_id, by_id, case_id)
            case = by_id[case_id]
            self.assertEqual(case.case_kind, "adversarial")
            self.assertEqual(case.expected_band, band)
            evaluation = build_ai_evaluation_input(
                case.drill_id,
                case.evaluator_answers(),
                case.drill_config or {},
                allowed_competency_ids={"evidence_analysis"},
                rubric_version=RUBRIC_VERSION_BY_DRILL[case.drill_id],
            )
            self.assertIsNotNone(evaluation, case_id)

    def test_band_ranges_match_calibration_pass(self):
        self.assertEqual(BAND_RANGES["very_weak"], (0.0, 0.25))
        self.assertEqual(BAND_RANGES["weak"], (0.25, 0.45))
        self.assertEqual(BAND_RANGES["neutral"], (0.45, 0.55))
        self.assertEqual(BAND_RANGES["decent"], (0.55, 0.70))
        self.assertEqual(BAND_RANGES["strong"], (0.70, 0.85))
        self.assertEqual(BAND_RANGES["excellent"], (0.85, 1.00))

    def test_mock_qualities_sit_inside_bands(self):
        for band in BAND_ORDER:
            quality = MOCK_QUALITY_BY_BAND[band]
            lo, hi = BAND_RANGES[band]
            self.assertGreaterEqual(quality, lo)
            self.assertLessEqual(quality, hi)
            flags = flags_for_row(
                expected_band=band,
                quality=quality,
                unsupported_claims=0.2,
                case_kind="band",
            )
            self.assertEqual(flags, ["OK"], f"{band}→{quality} flags={flags}")

    def test_mock_calibration_pass_adversarial_not_inflated(self):
        report = run_calibration(mode="mock")
        by_id = {r.caseId: r for r in report.rows}
        # Primary axis row per case — long/empty and confident must not look strong
        long_empty = [r for r in report.rows if r.caseId.endswith("adv_long_empty")]
        self.assertTrue(long_empty)
        for row in long_empty:
            self.assertLessEqual(row.quality, 0.30)
            self.assertNotIn("TOO_HIGH", row.flags)

        short_precise = [r for r in report.rows if r.caseId.endswith("adv_short_precise")]
        self.assertTrue(short_precise)
        for row in short_precise:
            self.assertGreaterEqual(row.quality, 0.70)

        confident = [r for r in report.rows if r.caseId.endswith("adv_confident_unsupported")]
        self.assertTrue(confident)
        for row in confident:
            self.assertGreaterEqual(row.unsupportedClaims, 0.40)
            self.assertLessEqual(row.quality, 0.45)

        # Uncertain-good should beat hockey-jargon-no-obs under mock mapping
        for drill_prefix in ("e1", "b2"):
            uncertain = by_id[f"{drill_prefix}_adv_uncertain_good"]
            jargon = by_id[f"{drill_prefix}_adv_hockey_no_obs"]
            self.assertGreater(uncertain.quality, jargon.quality)

    def test_no_exact_float_expectations_in_band_contract(self):
        """Bands are ranges — avoid fragile exact quality targets."""
        for band, (lo, hi) in BAND_RANGES.items():
            if band in ("moderate", "very_strong"):
                continue
            self.assertLess(lo, hi)
            self.assertGreaterEqual(hi - lo, 0.10)


if __name__ == "__main__":
    unittest.main()

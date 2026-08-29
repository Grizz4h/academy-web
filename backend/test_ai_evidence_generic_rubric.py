"""Generic evidence rubric V1 — architecture + cross-drill validation tests."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.ai.calibration.fixtures_loader import load_cases
from competency.ai.calibration.runner import run_calibration
from competency.ai.constants import (
    AI_EVALUATOR_VERSION,
    AI_PROMPT_VERSION,
    AI_RUBRIC_VERSION,
    MVP_AI_DRILL_IDS,
    VALIDATION_DRILL_IDS,
)
from competency.ai.evaluator import clear_ai_profile_cache
from competency.ai.prompt import SYSTEM_PROMPT_V3, build_user_prompt
from competency.ai.rubrics import build_ai_evaluation_input, build_generic_spec_input
from competency.ai.specs import (
    SCOPE_TYPES,
    competency_rubrics_for_ids,
    list_drill_spec_ids,
    load_competency_rubrics,
    load_drill_assessment_spec,
)
from competency.models import CompetencyId


class GenericRubricArchitectureTests(unittest.TestCase):
    def setUp(self):
        clear_ai_profile_cache()

    def test_versions(self):
        self.assertEqual(AI_PROMPT_VERSION, "v3")
        self.assertEqual(AI_EVALUATOR_VERSION, "ai-evidence-v2")
        self.assertEqual(AI_RUBRIC_VERSION, "generic-rubric-v1")
        self.assertEqual(MVP_AI_DRILL_IDS, frozenset({"B2_D5", "E1_D1"}))

    def test_eight_competency_rubrics(self):
        rubrics = load_competency_rubrics()
        expected = {c.value for c in CompetencyId}
        self.assertEqual(set(rubrics.keys()), expected)
        for rubric in rubrics.values():
            self.assertTrue(rubric.strong_evidence)
            self.assertTrue(rubric.weak_evidence)

    def test_drill_specs_for_reference_and_validation(self):
        expected = MVP_AI_DRILL_IDS | VALIDATION_DRILL_IDS
        self.assertTrue(expected <= set(list_drill_spec_ids()))
        for drill_id in expected:
            spec = load_drill_assessment_spec(drill_id)
            self.assertIsNotNone(spec, drill_id)
            self.assertIn(spec.scope, SCOPE_TYPES)
            self.assertTrue(spec.evaluation_focus)
            self.assertTrue(spec.required_for_strong)
            self.assertTrue(spec.common_failure_modes)
            if drill_id in VALIDATION_DRILL_IDS:
                self.assertTrue(spec.validation_only)

    def test_system_prompt_is_generic_not_drill_branches(self):
        self.assertIn("DIMENSIONS", SYSTEM_PROMPT_V3)
        self.assertIn("Do not reward length", SYSTEM_PROMPT_V3)
        self.assertNotIn("if drill ==", SYSTEM_PROMPT_V3.lower())
        self.assertNotIn("E1_D1 goal", SYSTEM_PROMPT_V3)
        self.assertNotIn("B2_D5 goal", SYSTEM_PROMPT_V3)

    def test_user_prompt_injects_spec_and_competency_rubric(self):
        evaluation = build_ai_evaluation_input(
            "E1_D1",
            {
                "pattern_observations": [
                    {"zone": "neutral", "trigger": "turnover", "reaction": "back_check", "sequence": "quick_pass"},
                    {"zone": "neutral", "trigger": "turnover", "reaction": "back_check", "sequence": "quick_pass"},
                    {"zone": "neutral", "trigger": "turnover", "reaction": "back_check", "sequence": "quick_pass"},
                ],
                "pattern_assessment": "possible_signal",
                "pattern_summary": "Drei vergleichbare Neutralzone-Turnovers mit gleicher Reaktion — Stichprobe begrenzt.",
            },
            {"minObservations": 3},
            allowed_competency_ids={"evidence_analysis", "systems_patterns"},
            rubric_version="E1_D1-spec-v1",
        )
        self.assertIsNotNone(evaluation)
        prompt = build_user_prompt(evaluation)
        self.assertIn("pattern_synthesis", prompt)
        self.assertIn("evidence_analysis", prompt)
        self.assertIn("strongEvidence", prompt)
        self.assertIn("Do NOT include quality", prompt)

    def test_generic_builder_for_validation_drill(self):
        evaluation = build_generic_spec_input(
            "C1_D5",
            {
                "profileSummary": (
                    "Segment: nach Dump-ins blieben Abstände zwischen den Verteidigern "
                    "wiederholt eng; eine Szene mit größerem Gap."
                )
            },
            {},
            allowed_competency_ids={"systems_patterns", "evidence_analysis"},
        )
        self.assertIsNotNone(evaluation)
        self.assertEqual(evaluation.scope, "pattern_synthesis")
        self.assertIn("evaluationFocus", evaluation.drill_assessment_spec)

    def test_production_dispatch_still_mvp_only(self):
        evaluation = build_ai_evaluation_input(
            "C1_D5",
            {"profileSummary": "x" * 50},
            {},
            allowed_competency_ids={"systems_patterns"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNone(evaluation)

    def test_validation_fixtures_cover_bands_and_adversarial(self):
        from competency.ai.calibration.validation_matrix import CLASS_ORDER

        for drill_id in sorted(VALIDATION_DRILL_IDS):
            cases = load_cases([drill_id])
            notes = {c.notes for c in cases}
            self.assertTrue(set(CLASS_ORDER) <= notes, drill_id)
            self.assertGreaterEqual(sum(1 for c in cases if c.case_kind == "adversarial"), 2)

    def test_mock_validation_calibration_runs(self):
        report = run_calibration(mode="mock", include_validation=True)
        drill_ids = {d.drillId for d in report.drills}
        self.assertTrue(MVP_AI_DRILL_IDS <= drill_ids)
        self.assertTrue(VALIDATION_DRILL_IDS <= drill_ids)
        # Reference pilots should look good under mock aggregation
        for drill in report.drills:
            if drill.drillId in MVP_AI_DRILL_IDS:
                self.assertEqual(drill.verdictHint, "looks_good", drill.drillId)

    def test_reference_regression_mock(self):
        report = run_calibration(mode="mock", drill_ids=["E1_D1", "B2_D5"])
        self.assertEqual(report.globalVerdict, "PILOT CALIBRATION LOOKS GOOD")
        long_empty = [r for r in report.rows if r.caseId.endswith("adv_long_empty")]
        self.assertTrue(long_empty)
        for row in long_empty:
            self.assertLessEqual(row.quality, 0.30)

    def test_competency_rubric_export_shape(self):
        rows = competency_rubrics_for_ids(["space_structure"])
        self.assertEqual(rows[0]["competencyId"], "space_structure")
        self.assertIn("identifies relevant spatial relationships", rows[0]["strongEvidence"][0])


if __name__ == "__main__":
    unittest.main()

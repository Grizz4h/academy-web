"""Phase 2 — validation drill specs + cross-drill calibration matrix."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from competency.ai.aggregation import (
    AggregationContext,
    aggregate_quality,
    aggregate_quality_report,
    relational_scale_for_scope,
)
from competency.ai.calibration.fixtures_loader import load_cases
from competency.ai.calibration.runner import run_calibration
from competency.ai.calibration.validation_matrix import (
    CLASS_ORDER,
    run_validation_matrix,
)
from competency.ai.evaluator import clear_ai_profile_cache
from competency.ai.schema import AiCompetencyDimensions
from competency.ai.specs import (
    VALIDATION_AI_DRILLS,
    clear_spec_caches,
    load_drill_assessment_spec,
)
from competency.models import CompetencyId


def _dims(**overrides):
    base = dict(
        competencyId=CompetencyId.EVIDENCE_ANALYSIS,
        observationGrounding=0.9,
        specificity=0.88,
        competencyAlignment=0.9,
        relationalReasoning=0.4,
        evidenceScope=0.55,
        uncertaintyCalibration=0.85,
        unsupportedClaims=0.08,
        outcomeBias=0.05,
        reasonCode="observation_grounded",
        notes=[],
    )
    base.update(overrides)
    return AiCompetencyDimensions(**base)


class ValidationBatchTests(unittest.TestCase):
    def setUp(self):
        clear_ai_profile_cache()
        clear_spec_caches()

    def test_six_specs_complete(self):
        for drill_id in sorted(VALIDATION_AI_DRILLS):
            spec = load_drill_assessment_spec(drill_id)
            self.assertIsNotNone(spec, drill_id)
            self.assertTrue(spec.validation_only)
            self.assertTrue(spec.primary_competencies, drill_id)
            self.assertTrue(spec.observable_evidence, drill_id)
            self.assertTrue(spec.fairness_note, drill_id)
            self.assertTrue(spec.free_text_readiness, drill_id)
            self.assertTrue(spec.evidence_source_recommendation, drill_id)
            self.assertIn("high", spec.dimension_emphasis.values() or ["x"])

    def test_a1_does_not_overweight_relational_or_scope(self):
        spec = load_drill_assessment_spec("A1_D2")
        self.assertEqual(spec.dimension_emphasis.get("relationalReasoning"), "low")
        self.assertEqual(spec.dimension_emphasis.get("evidenceScope"), "low")
        ctx = AggregationContext(
            relational_weight_scale=relational_scale_for_scope(spec.scope),
            dimension_emphasis=spec.dimension_emphasis,
        )
        # Early-drill excellent profile: strong grounding; relational can stay modest.
        base = dict(
            observationGrounding=0.92,
            specificity=0.9,
            competencyAlignment=0.92,
            evidenceScope=0.88,
            uncertaintyCalibration=0.88,
            unsupportedClaims=0.05,
            outcomeBias=0.05,
        )
        q_low_rel = aggregate_quality(_dims(relationalReasoning=0.35, **base), context=ctx)
        q_high_rel = aggregate_quality(_dims(relationalReasoning=0.92, **base), context=ctx)
        self.assertGreaterEqual(q_low_rel, 0.80)
        # Low relational emphasis: missing multi-link reasoning must not dominate quality.
        self.assertLess(abs(q_high_rel - q_low_rel), 0.08)

    def test_difficulty_fairness_a1_vs_e3_excellent_same_band(self):
        report = run_validation_matrix(drill_ids=["A1_D2", "E3_D5"])
        a1 = next(d for d in report.drills if d.drillId == "A1_D2")
        e3 = next(d for d in report.drills if d.drillId == "E3_D5")
        self.assertGreaterEqual(a1.classMeans["excellent"], 0.85)
        self.assertGreaterEqual(e3.classMeans["excellent"], 0.85)
        self.assertLess(abs(a1.classMeans["excellent"] - e3.classMeans["excellent"]), 0.12)

    def test_validation_matrix_calibrated(self):
        report = run_validation_matrix()
        self.assertEqual(report.globalVerdict, "VALIDATION RUBRIC CALIBRATED")
        self.assertFalse(report.crossDrillBias)
        for drill in report.drills:
            self.assertTrue(drill.monotonicOk, drill.drillId)
            for cell in drill.cells:
                self.assertIn(cell.answerClass, CLASS_ORDER)
                self.assertIn("OK", cell.flags)
                self.assertIn("finalQuality", cell.diagnostics)
                self.assertIn("appliedCaps", cell.diagnostics)

    def test_severe_unsupported_cannot_be_rescued_by_specificity(self):
        report = aggregate_quality_report(
            _dims(
                observationGrounding=0.95,
                specificity=0.95,
                competencyAlignment=0.95,
                relationalReasoning=0.95,
                evidenceScope=0.95,
                uncertaintyCalibration=0.9,
                unsupportedClaims=0.85,
                outcomeBias=0.1,
            )
        )
        self.assertLessEqual(report.final_quality, 0.45)
        self.assertIn("severe_penalty_cap_0.45", report.applied_caps)

    def test_fixtures_cover_matrix_classes(self):
        for drill_id in sorted(VALIDATION_AI_DRILLS):
            cases = load_cases([drill_id])
            classes = {c.notes for c in cases}
            for required in CLASS_ORDER:
                self.assertIn(required, classes, f"{drill_id} missing {required}")

    def test_mock_validation_fixtures_still_run(self):
        report = run_calibration(mode="mock", include_validation=True)
        self.assertIn(report.globalVerdict, {
            "PILOT CALIBRATION LOOKS GOOD",
            "REVIEW PROMPT/RUBRIC BEFORE ROLLOUT",
        })
        # Reference pilots must stay green
        for drill in report.drills:
            if drill.drillId in ("E1_D1", "B2_D5"):
                self.assertEqual(drill.verdictHint, "looks_good", drill.drillId)

    def test_reference_regression_untouched(self):
        report = run_calibration(mode="mock", drill_ids=["E1_D1", "B2_D5"])
        self.assertEqual(report.globalVerdict, "PILOT CALIBRATION LOOKS GOOD")

    def test_readiness_and_source_strategy_documented(self):
        expected = {
            "A1_D2": ("NOT_SUITABLE_FOR_AI_EVIDENCE", "structured_only"),
            "A3_D2": ("NEEDS_SMALL_INPUT_CHANGE", "structured_plus_ai_review"),
            "B1_D1": ("NEEDS_SMALL_INPUT_CHANGE", "structured_plus_ai_review"),
            "C1_D5": ("READY", "structured_plus_ai_review"),
            "D3_D5": ("READY", "structured_plus_ai_review"),
            "E3_D5": ("READY", "ai_review"),
        }
        for drill_id, (ready, source) in expected.items():
            spec = load_drill_assessment_spec(drill_id)
            self.assertEqual(spec.free_text_readiness, ready, drill_id)
            self.assertEqual(spec.evidence_source_recommendation, source, drill_id)


if __name__ == "__main__":
    unittest.main()

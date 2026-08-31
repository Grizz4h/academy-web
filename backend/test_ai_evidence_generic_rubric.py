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
        self.assertEqual(
            MVP_AI_DRILL_IDS,
            frozenset(
                {
                    "A3_D2",
                    "B1_D1",
                    "B1_D2",
                    "B1_D3",
                    "B1_D4",
                    "B1_D5",
                    "B2_D5",
                    "E1_D1",
                    "E1_D5",
                    "C1_D5",
                    "C2_D5",
                    "C3_D5",
                    "D1_D5",
                    "D2_D5",
                    "D3_D5",
                    "E2_D1",
                    "E2_D2",
                    "E2_D3",
                    "E2_D4",
                    "E2_D5",
                    "E3_D1",
                    "E3_D2",
                    "E3_D3",
                    "E3_D4",
                    "E3_D5",
                }
            ),
        )

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
            # Pure validation drills stay validationOnly; production allowlist must not.
            if drill_id in VALIDATION_DRILL_IDS - MVP_AI_DRILL_IDS:
                self.assertTrue(spec.validation_only, drill_id)
            if drill_id in MVP_AI_DRILL_IDS:
                self.assertFalse(spec.validation_only, drill_id)

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

    def test_production_dispatch_includes_ready_rollout(self):
        for drill_id in ("C1_D5", "C2_D5", "C3_D5", "D1_D5", "D2_D5"):
            evaluation = build_ai_evaluation_input(
                drill_id,
                {"profileSummary": "x" * 50},
                {},
                allowed_competency_ids={"systems_patterns"},
                rubric_version="x",
                allow_validation_drills=False,
            )
            self.assertIsNotNone(evaluation, drill_id)
            self.assertEqual(evaluation.drill_id, drill_id)

        e1 = build_ai_evaluation_input(
            "E1_D5",
            {
                "segment_summary": "x" * 50,
                "tendency_entries": [],
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e1)
        self.assertIn("segment_summary", e1.primary_text)

        e2 = build_ai_evaluation_input(
            "E2_D5",
            {
                "segmentSummary": "x" * 50,
                "__adjustment_profile_stage": "complete",
                "noClearAdjustment": True,
                "noAdjustmentReason": "too_few_comparable",
                "adjustment_entries": [],
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e2)
        self.assertIn("segmentSummary", e2.primary_text)

        e2d1 = build_ai_evaluation_input(
            "E2_D1",
            {
                "__before_after_compare_stage": "complete",
                "before": {
                    "spacePriority": "middle",
                    "pressureBehavior": "early_aggressive",
                    "positioning": "compact",
                    "decisionBehavior": "direct",
                    "description": "Vorher früher aggressiver Zugriff an der Blue Line.",
                },
                "after": {
                    "spacePriority": "middle",
                    "pressureBehavior": "delayed_pressure",
                    "positioning": "deep",
                    "decisionBehavior": "patient",
                    "description": "Danach verzögerter Druck und tiefere Staffelung.",
                },
                "comparabilityRating": "well_comparable",
                "primaryChange": "pressureBehavior",
                "changeMagnitude": "clear",
                "changeSummary": "x" * 50,
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e2d1)
        self.assertIn("changeSummary", e2d1.primary_text)

        e2d2 = build_ai_evaluation_input(
            "E2_D2",
            {
                "__change_timeline_stage": "complete",
                "observationFocus": "Blue-Line-Zugriff",
                "baselineDescription": "Früher aggressiver Zugriff als Baseline.",
                "change_timeline_observations": [
                    {"id": "1", "order": 1, "relationToBaseline": "matches_baseline", "description": "Baseline Szene A"},
                    {"id": "2", "order": 2, "relationToBaseline": "matches_baseline", "description": "Baseline Szene B"},
                    {
                        "id": "3",
                        "order": 3,
                        "relationToBaseline": "new_behavior",
                        "changedDimension": "pressure_timing",
                        "description": "Abweichung C",
                    },
                    {
                        "id": "4",
                        "order": 4,
                        "relationToBaseline": "new_behavior",
                        "changedDimension": "pressure_timing",
                        "description": "Abweichung D",
                    },
                ],
                "comparability": "mostly",
                "assessment": "likely_change",
                "changeSummary": "x" * 50,
            },
            {"minObservations": 4},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e2d2)
        self.assertIn("changeSummary", e2d2.primary_text)

        e2d3 = build_ai_evaluation_input(
            "E2_D3",
            {
                "__trigger_hypothesis_stage": "complete",
                "observedChange": "F1 startet später tiefer in vergleichbaren Forecheck-Lagen.",
                "priorProblem": "opponent_breaks_pressure",
                "triggerType": "opponent_driven",
                "evidence": ["problem_repeated_before", "same_space"],
                "alternativeExplanation": "different_personnel",
                "problemFit": "direct",
                "linkStrength": "plausible_link",
                "functionalLink": "Der tiefere Start schließt früher den zentralen Raum, den der Gegner zuvor genutzt hat.",
                "hypothesisSummary": "x" * 50,
                "confidence": "medium",
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e2d3)
        self.assertIn("hypothesisSummary", e2d3.primary_text)

        e2d4 = build_ai_evaluation_input(
            "E2_D4",
            {
                "__interaction_chain_stage": "complete",
                "problemDescription": "Gegner kommt wiederholt kontrolliert durch die Mitte.",
                "problemCategory": "entry",
                "problemEvidence": ["same_zone", "repeated_short_span"],
                "adjustmentDescription": "Erste Linie bleibt tiefer und schützt zentral.",
                "adjustmentDimension": "space_priority",
                "changeMagnitude": "clear",
                "responseType": "redirected",
                "responseDescription": "Gegner nutzt später häufiger die Außenbahn.",
                "problemEffect": "shifted_elsewhere",
                "tradeoff": "more_outside_space",
                "comparability": "mostly",
                "interactionAssessment": "likely_effect",
                "chainSummary": "x" * 50,
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e2d4)
        self.assertIn("chainSummary", e2d4.primary_text)

        a3 = build_ai_evaluation_input(
            "A3_D2",
            {
                "note": (
                    "Nach dem Wechsel beschleunigt der Puckführer oft nach vorne, "
                    "während kurz eine Passoption und Absicherung sichtbar bleiben."
                )
            },
            {},
            allowed_competency_ids={"transition_tempo"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(a3)
        self.assertIn("nach vorne", a3.primary_text)

        b1 = build_ai_evaluation_input(
            "B1_D1",
            {
                "support_samples": [
                    {
                        "support_state": "klar spielbar",
                        "main_factor": "Passbahn offen",
                        "note": "x" * 50,
                    },
                    {
                        "support_state": "klar spielbar",
                        "main_factor": "erreichbarer Abstand",
                        "note": "y" * 50,
                    },
                    {
                        "support_state": "eingeschränkt",
                        "main_factor": "Passbahn teilweise geschlossen",
                        "note": "z" * 50,
                    },
                ]
            },
            {"sample_key": "support_samples", "note_key": "note", "note_min_chars": 150},
            allowed_competency_ids={"roles_support"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(b1)
        self.assertIn("sample[2].note", b1.primary_text)

        e3d1 = build_ai_evaluation_input(
            "E3_D1",
            {
                "__opportunity_rate_stage": "complete",
                "opportunity_rate_definition": {"templateId": "entries"},
                "opportunity_rate_observations": [],
                "countOnlyReflection": "missing_relative_frequency",
                "opportunityDefinitionClarity": "mostly",
                "userConclusion": "x" * 50,
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e3d1)
        self.assertIn("userConclusion", e3d1.primary_text)

        e3d2 = build_ai_evaluation_input(
            "E3_D2",
            {
                "__cohort_rate_stage": "complete",
                "cohort_rate_definition": {"templateId": "entries"},
                "cohort_rate_comparison": {"templateId": "side"},
                "cohort_rate_observations": [],
                "comparability": "mostly_comparable",
                "perceivedDifference": "clear",
                "possibleConfounder": "Gegnerdruck war auf einer Seite höher.",
                "userConclusion": "x" * 50,
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e3d2)
        self.assertIn("userConclusion", e3d2.primary_text)
        self.assertIn("possibleConfounder", e3d2.primary_text)

        e3d3 = build_ai_evaluation_input(
            "E3_D3",
            {
                "__conditional_outcome_stage": "complete",
                "conditional_outcome_definition": {"templateId": "weak_side_exit"},
                "conditionalHypothesis": "target_more_with_condition",
                "conditional_outcome_observations": [],
                "comparability": "mostly_comparable",
                "hypothesisAssessment": "partly_confirmed",
                "counterexampleAssessment": "some",
                "alternativeExplanation": "Druckunterschied kann das Muster ebenfalls erklären.",
                "userConclusion": "x" * 50,
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e3d3)
        self.assertIn("userConclusion", e3d3.primary_text)
        self.assertIn("alternativeExplanation", e3d3.primary_text)

        e3d4 = build_ai_evaluation_input(
            "E3_D4",
            {
                "__evidence_assessment_stage": "complete",
                "evidenceMicrofeedback": "sample",
                "evidence_assessments": {
                    "thin_sample": {
                        "overallStrength": "weak",
                        "userStatement": "x" * 80,
                    },
                    "solid_picture": {
                        "overallStrength": "reasonably_supported",
                        "userStatement": "y" * 80,
                    },
                },
            },
            {"user_statement_min_chars": 80},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(e3d4)
        self.assertIn("userStatement", e3d4.primary_text)

    def test_e3_nested_evidence_profile_resolves(self):
        evaluation = build_ai_evaluation_input(
            "E3_D5",
            {
                "evidenceProfile": {
                    "finalClaim": "In dieser Stichprobe trat das Muster in mehreren Fällen häufiger auf — nur als Hinweis.",
                    "falsificationCondition": "Der Unterschied verschwindet bei gleicher Messdefinition und gleichem Druck.",
                    "nextObservationTest": "Weitere vergleichbare Szenen unter gleichem Druck dokumentieren.",
                }
            },
            {},
            allowed_competency_ids={"evidence_analysis"},
            rubric_version="x",
            allow_validation_drills=False,
        )
        self.assertIsNotNone(evaluation)
        self.assertIn("finalClaim", evaluation.primary_text)

    def test_validation_fixtures_cover_bands_and_adversarial(self):
        from competency.ai.calibration.validation_matrix import CLASS_ORDER

        for drill_id in sorted(VALIDATION_DRILL_IDS):
            cases = load_cases([drill_id])
            notes = {c.notes for c in cases}
            self.assertTrue(set(CLASS_ORDER) <= notes, drill_id)
            self.assertGreaterEqual(sum(1 for c in cases if c.case_kind == "adversarial"), 2)

    def test_mock_validation_calibration_runs(self):
        from competency.ai.calibration.fixtures_loader import DRILL_FIXTURE_FILES

        report = run_calibration(mode="mock", include_validation=True)
        drill_ids = {d.drillId for d in report.drills}
        # Production drills without calibration fixtures yet are allowlisted but not in this run.
        wired_with_fixtures = MVP_AI_DRILL_IDS & set(DRILL_FIXTURE_FILES)
        self.assertTrue(wired_with_fixtures <= drill_ids)
        self.assertTrue(VALIDATION_DRILL_IDS <= drill_ids)
        # Mock-differentiating production drills should look good; E3 claim_ladder
        # stays flat under mock (live calibration is the gate for that drill).
        mock_looks_good = frozenset({"B2_D5", "E1_D1", "C1_D5", "D3_D5"})
        for drill in report.drills:
            if drill.drillId in mock_looks_good:
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

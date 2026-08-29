"""Run AI evidence calibration review without persistence."""

from __future__ import annotations

from typing import Dict, List, Optional, Sequence, Set

from competency.ai.evaluator import AiEvidenceEvaluator
from competency.ai.provider import OpenAiEvidenceProvider
from competency.ai.specs import load_drill_assessment_spec

from .bands import flags_for_row
from .fixtures_loader import CalibrationCase, load_cases
from .mock_provider import CalibrationMockProvider
from .report import CalibrationReport, ReviewRow, build_report

# Primary axes for validation-only drills (map weights exist; keep fixtures focused)
VALIDATION_ALLOWED: Dict[str, Set[str]] = {
    "A1_D2": {"scanning_identification", "roles_support", "space_structure"},
    "A3_D2": {"transition_tempo", "scanning_identification", "space_structure"},
    "B1_D1": {"roles_support", "space_structure", "scanning_identification"},
    "C1_D5": {"systems_patterns", "evidence_analysis", "pressure_control", "space_structure"},
    "D3_D5": {"systems_patterns", "evidence_analysis", "options_decisions", "space_structure"},
    "E3_D5": {"evidence_analysis", "systems_patterns"},
}


def _primary_text(case: CalibrationCase) -> str:
    answers = case.answers
    if case.drill_id == "B2_D5":
        text = str(answers.get("pattern_reason") or "").strip()
        if text:
            return text
        evidence = answers.get("pattern_evidence") or []
        return "; ".join(str(v) for v in evidence if str(v).strip())
    if case.drill_id == "E1_D1":
        return str(answers.get("pattern_summary") or "").strip()

    spec = load_drill_assessment_spec(case.drill_id)
    if spec is not None:
        for key in spec.primary_text_keys:
            text = str(answers.get(key) or "").strip()
            if text:
                return text
    for key in ("observation_text", "profileSummary", "finalClaim", "note", "pattern_summary"):
        text = str(answers.get(key) or "").strip()
        if text:
            return text
    return ""


def build_mock_provider(cases: Sequence[CalibrationCase]) -> CalibrationMockProvider:
    band_map = {}
    kind_map = {}
    for case in cases:
        primary = _primary_text(case)
        band_map[primary] = case.expected_band
        kind_map[primary] = case.case_kind
    return CalibrationMockProvider(band_map, kind_map)


def run_case(evaluator: AiEvidenceEvaluator, case: CalibrationCase) -> List[ReviewRow]:
    allowed_override = VALIDATION_ALLOWED.get(case.drill_id)
    detailed = evaluator.evaluate_detailed(
        drill_id=case.drill_id,
        answers=case.evaluator_answers(),
        drill_config=case.drill_config or {},
        drill_title=case.drill_title,
        allow_validation_drills=bool(case.validation_only or allowed_override),
        allowed_override=allowed_override,
    )
    rows: List[ReviewRow] = []
    if detailed is None:
        rows.append(
            ReviewRow(
                drillId=case.drill_id,
                caseId=case.case_id,
                expectedBand=case.expected_band,
                caseKind=case.case_kind,
                competencyId="(none)",
                quality=0.0,
                specificity=0.0,
                evidenceAlignment=0.0,
                unsupportedClaims=0.0,
                reasonCode="no_evaluation",
                flags=(
                    ["TOO_LOW"]
                    if case.case_kind == "band"
                    and case.expected_band in ("strong", "excellent", "very_strong")
                    else ["OK"]
                ),
            )
        )
        return rows

    for item in detailed.competencies:
        quality = float(item.quality)
        unsupported = float(item.unsupportedClaims)
        flags = flags_for_row(
            expected_band=case.expected_band,
            quality=quality,
            unsupported_claims=unsupported,
            case_kind=case.case_kind,
        )
        rows.append(
            ReviewRow(
                drillId=case.drill_id,
                caseId=case.case_id,
                expectedBand=case.expected_band,
                caseKind=case.case_kind,
                competencyId=str(item.competencyId),
                quality=quality,
                specificity=float(item.specificity),
                evidenceAlignment=float(item.evidenceAlignment),
                unsupportedClaims=unsupported,
                reasonCode=str(item.reasonCode),
                flags=flags,
            )
        )
    return rows


def run_calibration(
    *,
    mode: str = "mock",
    drill_ids: Optional[List[str]] = None,
    cases: Optional[List[CalibrationCase]] = None,
    evaluator: Optional[AiEvidenceEvaluator] = None,
    include_validation: bool = False,
) -> CalibrationReport:
    """Evaluate synthetic fixtures. Never persists events/states/sessions."""
    if mode not in ("mock", "live"):
        raise ValueError("mode must be 'mock' or 'live'")

    loaded = (
        cases
        if cases is not None
        else load_cases(drill_ids, include_validation=include_validation)
    )

    if evaluator is None:
        if mode == "mock":
            evaluator = AiEvidenceEvaluator(provider=build_mock_provider(loaded))
        else:
            evaluator = AiEvidenceEvaluator(provider=OpenAiEvidenceProvider())

    rows: List[ReviewRow] = []
    for case in loaded:
        rows.extend(run_case(evaluator, case))

    return build_report(mode=mode, rows=rows)

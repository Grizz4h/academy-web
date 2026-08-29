"""Run AI evidence calibration review without persistence."""

from __future__ import annotations

from typing import List, Optional, Sequence

from competency.ai.evaluator import AiEvidenceEvaluator
from competency.ai.provider import OpenAiEvidenceProvider

from .bands import flags_for_row
from .fixtures_loader import CalibrationCase, load_cases
from .mock_provider import CalibrationMockProvider
from .report import CalibrationReport, ReviewRow, build_report


def _primary_text(case: CalibrationCase) -> str:
    answers = case.answers
    if case.drill_id == "B2_D5":
        text = str(answers.get("pattern_reason") or "").strip()
        if text:
            return text
        evidence = answers.get("pattern_evidence") or []
        return "; ".join(str(v) for v in evidence if str(v).strip())
    return str(answers.get("pattern_summary") or "").strip()


def build_mock_provider(cases: Sequence[CalibrationCase]) -> CalibrationMockProvider:
    band_map = {}
    kind_map = {}
    for case in cases:
        primary = _primary_text(case)
        band_map[primary] = case.expected_band
        kind_map[primary] = case.case_kind
    return CalibrationMockProvider(band_map, kind_map)


def run_case(evaluator: AiEvidenceEvaluator, case: CalibrationCase) -> List[ReviewRow]:
    detailed = evaluator.evaluate_detailed(
        drill_id=case.drill_id,
        answers=case.evaluator_answers(),
        drill_config=case.drill_config or {},
        drill_title=case.drill_title,
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
) -> CalibrationReport:
    """Evaluate synthetic fixtures. Never persists events/states/sessions."""
    if mode not in ("mock", "live"):
        raise ValueError("mode must be 'mock' or 'live'")

    loaded = cases if cases is not None else load_cases(drill_ids)

    if evaluator is None:
        if mode == "mock":
            evaluator = AiEvidenceEvaluator(provider=build_mock_provider(loaded))
        else:
            evaluator = AiEvidenceEvaluator(provider=OpenAiEvidenceProvider())

    rows: List[ReviewRow] = []
    for case in loaded:
        rows.extend(run_case(evaluator, case))

    return build_report(mode=mode, rows=rows)

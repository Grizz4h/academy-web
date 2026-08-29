"""Cross-drill validation calibration matrix (synthetic, no persistence).

Answer classes (per validation drill):
  excellent | good | partial | weak | unsupported_confident | empty_offtopic

Quality is aggregated from mock dimensions (Variant B) with drill-spec context.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Sequence, Tuple

from competency.ai.aggregation import (
    AggregationContext,
    aggregate_quality_report,
    relational_scale_for_scope,
)
from competency.ai.calibration.mock_provider import dimensions_for_band
from competency.ai.specs import VALIDATION_AI_DRILLS, load_drill_assessment_spec

# Semantic class → expected band / case kind for mock dimension synthesis
CLASS_TO_BAND: Dict[str, Tuple[str, str]] = {
    "excellent": ("excellent", "band"),
    "good": ("strong", "band"),
    "partial": ("decent", "band"),
    "weak": ("weak", "band"),
    "unsupported_confident": ("weak", "adversarial"),
    "empty_offtopic": ("very_weak", "adversarial"),
}

CLASS_ORDER = (
    "excellent",
    "good",
    "partial",
    "weak",
    "unsupported_confident",
    "empty_offtopic",
)

# Soft expected quality bands for cross-drill fairness (not exact floats)
CLASS_QUALITY_BANDS: Dict[str, Tuple[float, float]] = {
    "excellent": (0.85, 1.00),
    "good": (0.70, 0.85),
    "partial": (0.55, 0.70),
    "weak": (0.25, 0.45),
    "unsupported_confident": (0.00, 0.45),
    "empty_offtopic": (0.00, 0.25),
}


@dataclass
class MatrixCell:
    drillId: str
    answerClass: str
    expectedBand: str
    quality: float
    diagnostics: Dict[str, Any] = field(default_factory=dict)
    flags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class DrillMatrixSummary:
    drillId: str
    scope: str
    freeTextReadiness: str
    evidenceSourceRecommendation: str
    cells: List[MatrixCell]
    monotonicOk: bool
    classMeans: Dict[str, float]


@dataclass
class ValidationMatrixReport:
    cells: List[MatrixCell]
    drills: List[DrillMatrixSummary]
    crossDrillBias: bool
    biasNotes: List[str]
    globalVerdict: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "globalVerdict": self.globalVerdict,
            "crossDrillBias": self.crossDrillBias,
            "biasNotes": self.biasNotes,
            "drills": [
                {
                    "drillId": d.drillId,
                    "scope": d.scope,
                    "freeTextReadiness": d.freeTextReadiness,
                    "evidenceSourceRecommendation": d.evidenceSourceRecommendation,
                    "monotonicOk": d.monotonicOk,
                    "classMeans": d.classMeans,
                    "cells": [c.to_dict() for c in d.cells],
                }
                for d in self.drills
            ],
            "cells": [c.to_dict() for c in self.cells],
        }


def _context_for_drill(drill_id: str) -> AggregationContext:
    spec = load_drill_assessment_spec(drill_id)
    if spec is None:
        return AggregationContext()
    return AggregationContext(
        relational_weight_scale=relational_scale_for_scope(spec.scope),
        dimension_emphasis=dict(spec.dimension_emphasis),
    )


def _primary_competency(drill_id: str) -> str:
    spec = load_drill_assessment_spec(drill_id)
    if spec and spec.primary_competencies:
        return spec.primary_competencies[0]
    return "evidence_analysis"


def evaluate_class_cell(drill_id: str, answer_class: str) -> MatrixCell:
    band, kind = CLASS_TO_BAND[answer_class]
    competency_id = _primary_competency(drill_id)
    dims = dimensions_for_band(competency_id, band, kind=kind)
    ctx = _context_for_drill(drill_id)
    report = aggregate_quality_report(dims, context=ctx)
    lo, hi = CLASS_QUALITY_BANDS[answer_class]
    flags: List[str] = []
    q = report.final_quality
    if q > hi + 0.08:
        flags.append("TOO_HIGH")
    elif q < lo - 0.08:
        flags.append("TOO_LOW")
    if not flags:
        flags.append("OK")
    return MatrixCell(
        drillId=drill_id,
        answerClass=answer_class,
        expectedBand=band,
        quality=q,
        diagnostics=report.to_dict(),
        flags=flags,
    )


def _monotonic(class_means: Dict[str, float]) -> bool:
    ordered = [class_means[c] for c in ("excellent", "good", "partial", "weak") if c in class_means]
    if len(ordered) < 2:
        return True
    # excellent > good > partial > weak (allow tiny noise)
    return all(ordered[i] >= ordered[i + 1] - 0.02 for i in range(len(ordered) - 1))


def run_validation_matrix(
    drill_ids: Optional[Sequence[str]] = None,
) -> ValidationMatrixReport:
    ids = list(drill_ids) if drill_ids is not None else sorted(VALIDATION_AI_DRILLS)
    cells: List[MatrixCell] = []
    drills: List[DrillMatrixSummary] = []

    for drill_id in ids:
        spec = load_drill_assessment_spec(drill_id)
        drill_cells = [evaluate_class_cell(drill_id, cls) for cls in CLASS_ORDER]
        cells.extend(drill_cells)
        means = {c.answerClass: c.quality for c in drill_cells}
        drills.append(
            DrillMatrixSummary(
                drillId=drill_id,
                scope=spec.scope if spec else "",
                freeTextReadiness=spec.free_text_readiness if spec else "",
                evidenceSourceRecommendation=spec.evidence_source_recommendation if spec else "",
                cells=drill_cells,
                monotonicOk=_monotonic(means),
                classMeans=means,
            )
        )

    bias_notes: List[str] = []
    # Cross-drill: excellent/good/partial means should not systematically drift by track letter
    for cls in ("excellent", "good", "partial"):
        values = [d.classMeans[cls] for d in drills if cls in d.classMeans]
        if not values:
            continue
        spread = max(values) - min(values)
        if spread > 0.18:
            bias_notes.append(f"{cls} cross-drill spread {spread:.2f} > 0.18")

    # Specific anti-pattern: A-track excellent always >> E-track excellent by large margin
    by_id = {d.drillId: d for d in drills}
    if "A1_D2" in by_id and "E3_D5" in by_id:
        a_ex = by_id["A1_D2"].classMeans["excellent"]
        e_ex = by_id["E3_D5"].classMeans["excellent"]
        if a_ex - e_ex > 0.15:
            bias_notes.append(
                f"A1 excellent ({a_ex:.2f}) much higher than E3 excellent ({e_ex:.2f}) — unfair quality scale"
            )
        if e_ex - a_ex > 0.15:
            bias_notes.append(
                f"E3 excellent ({e_ex:.2f}) much higher than A1 excellent ({a_ex:.2f}) — complexity rewarded as quality"
            )

    mono_ok = all(d.monotonicOk for d in drills)
    flag_problems = sum(1 for c in cells if "TOO_HIGH" in c.flags or "TOO_LOW" in c.flags)
    cross_bias = bool(bias_notes)

    if mono_ok and flag_problems == 0 and not cross_bias:
        verdict = "VALIDATION RUBRIC CALIBRATED"
    else:
        verdict = "REVIEW GENERIC RUBRIC"

    return ValidationMatrixReport(
        cells=cells,
        drills=drills,
        crossDrillBias=cross_bias,
        biasNotes=bias_notes,
        globalVerdict=verdict,
    )


def format_validation_matrix_markdown(report: ValidationMatrixReport) -> str:
    lines = [
        "# Generic Rubric Validation Matrix",
        "",
        f"Verdict: **{report.globalVerdict}**",
        f"Cross-drill bias: `{report.crossDrillBias}`",
    ]
    if report.biasNotes:
        lines.append("Bias notes:")
        for note in report.biasNotes:
            lines.append(f"- {note}")
    lines.extend(["", "## Per drill", ""])
    for drill in report.drills:
        lines.append(f"### {drill.drillId}")
        lines.append(
            f"- scope=`{drill.scope}` readiness=`{drill.freeTextReadiness}` "
            f"source=`{drill.evidenceSourceRecommendation}` monotonic=`{drill.monotonicOk}`"
        )
        lines.append(
            "| class | band | quality | caps | flags |"
        )
        lines.append("|---|---|---:|---|---|")
        for cell in drill.cells:
            caps = ",".join(cell.diagnostics.get("appliedCaps") or []) or "—"
            lines.append(
                f"| {cell.answerClass} | {cell.expectedBand} | {cell.quality:.3f} | {caps} | "
                f"{','.join(cell.flags)} |"
            )
        lines.append("")
    return "\n".join(lines)

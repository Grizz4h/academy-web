"""Deterministic mock provider for calibration tooling (no OpenAI calls).

Returns dimension scores; evaluator aggregates quality (Variant B).
"""

from __future__ import annotations

from typing import Dict, Optional

from competency.ai.provider import AiEvidenceProvider
from competency.ai.rubrics import AiEvaluationInput
from competency.ai.schema import AiCompetencyDimensions, AiDimensionEvaluation
from competency.models import CompetencyId

from .bands import BAND_RANGES


# Target positive-dimension levels per band (penalties applied separately by kind)
MOCK_POSITIVE_BY_BAND: Dict[str, float] = {
    "very_weak": 0.12,
    "weak": 0.38,
    "neutral": 0.52,
    "decent": 0.66,
    "strong": 0.80,
    "excellent": 0.92,
    "moderate": 0.52,
    "very_strong": 0.92,
}


def dimensions_for_band(
    competency_id: str,
    band: str,
    *,
    kind: str = "band",
) -> AiCompetencyDimensions:
    band = (band or "neutral").strip().lower()
    positive = MOCK_POSITIVE_BY_BAND.get(band, 0.5)
    unsupported = max(0.05, 0.55 - positive)
    outcome_bias = 0.08
    reason = "observation_grounded" if positive >= 0.65 else "partial_observation"

    if kind == "injection":
        positive = 0.15
        unsupported = 0.60
        outcome_bias = 0.10
        reason = "insufficient_basis"
    elif kind == "unsupported_claim":
        positive = min(positive, 0.45)
        unsupported = 0.75
        outcome_bias = 0.15
        reason = "unsupported_inference"
    elif kind == "vague":
        positive = min(positive, 0.22)
        unsupported = 0.40
        outcome_bias = 0.10
        reason = "vague_claims"
    elif kind == "adversarial":
        if band in ("very_weak", "weak"):
            unsupported = 0.68
            outcome_bias = 0.35 if "outcome" in competency_id else 0.20
            reason = "unsupported_inference" if band == "weak" else "insufficient_basis"
        else:
            unsupported = max(0.05, 0.50 - positive)
            outcome_bias = 0.08
            reason = "observation_grounded" if positive >= 0.65 else "partial_observation"

    return AiCompetencyDimensions(
        competencyId=CompetencyId(competency_id),
        observationGrounding=positive,
        specificity=max(0.05, positive - 0.04),
        competencyAlignment=positive,
        relationalReasoning=max(0.05, positive - 0.06),
        evidenceScope=max(0.05, positive - 0.02),
        uncertaintyCalibration=max(0.05, min(1.0, positive - 0.03)),
        unsupportedClaims=unsupported,
        outcomeBias=outcome_bias,
        reasonCode=reason,
        notes=[],
    )


class CalibrationMockProvider(AiEvidenceProvider):
    """Maps expectedBand (via case registry) to deterministic dimension scores."""

    def __init__(
        self,
        band_by_primary_text: Dict[str, str],
        kind_by_primary_text: Optional[Dict[str, str]] = None,
    ):
        self._band_by_text = band_by_primary_text
        self._kind_by_text = kind_by_primary_text or {}
        self.calls = 0

    def evaluate(self, evaluation: AiEvaluationInput) -> Optional[AiDimensionEvaluation]:
        self.calls += 1
        band = self._band_by_text.get(evaluation.primary_text, "neutral")
        kind = self._kind_by_text.get(evaluation.primary_text, "band")

        rows = []
        for competency_id in sorted(evaluation.allowed_competency_ids):
            rows.append(dimensions_for_band(competency_id, band, kind=kind))
        if not rows:
            return None
        return AiDimensionEvaluation(competencies=rows)


def assert_band_in_range(band: str, quality: float) -> bool:
    lo_hi = BAND_RANGES.get(band)
    if lo_hi is None:
        return False
    lo, hi = lo_hi
    return lo - 0.08 <= quality <= hi + 0.08

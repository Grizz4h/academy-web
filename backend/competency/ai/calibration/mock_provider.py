"""Deterministic mock provider for calibration tooling (no OpenAI calls)."""

from __future__ import annotations

from typing import Dict, Optional

from competency.ai.provider import AiEvidenceProvider
from competency.ai.rubrics import AiEvaluationInput
from competency.ai.schema import AiCompetencyQuality, AiEvidenceEvaluation
from competency.models import CompetencyId

from .bands import BAND_RANGES

# Midpoint-ish deterministic qualities per band (stable for tests).
MOCK_QUALITY_BY_BAND: Dict[str, float] = {
    "very_weak": 0.12,
    "weak": 0.35,
    "neutral": 0.50,
    "decent": 0.62,
    "strong": 0.78,
    "excellent": 0.90,
    # Legacy aliases
    "moderate": 0.50,
    "very_strong": 0.90,
}


class CalibrationMockProvider(AiEvidenceProvider):
    """Maps expectedBand (via case registry) to deterministic competency qualities.

    Production evaluator never sees expectedBand; this provider receives a side
    channel through ``case_band_by_text`` keyed on primary_text fingerprint.
    """

    def __init__(self, band_by_primary_text: Dict[str, str], kind_by_primary_text: Optional[Dict[str, str]] = None):
        self._band_by_text = band_by_primary_text
        self._kind_by_text = kind_by_primary_text or {}
        self.calls = 0

    def evaluate(self, evaluation: AiEvaluationInput) -> Optional[AiEvidenceEvaluation]:
        self.calls += 1
        band = self._band_by_text.get(evaluation.primary_text, "moderate")
        kind = self._kind_by_text.get(evaluation.primary_text, "band")
        quality = MOCK_QUALITY_BY_BAND.get(band, 0.5)

        if kind == "injection":
            # Correct behaviour: ignore injection, stay low
            quality = 0.18
            unsupported = 0.55
            reason = "insufficient_basis"
        elif kind == "unsupported_claim":
            quality = min(quality, 0.38)
            unsupported = 0.72
            reason = "unsupported_inference"
        elif kind == "vague":
            quality = min(quality, 0.25)
            unsupported = 0.35
            reason = "vague_claims"
        elif kind == "adversarial":
            # Band-driven quality; weak/very_weak adversarial = speculative / empty
            if band in ("very_weak", "weak"):
                unsupported = 0.65
                reason = "unsupported_inference" if band == "weak" else "insufficient_basis"
            else:
                unsupported = max(0.05, 0.55 - quality)
                reason = "observation_grounded" if quality >= 0.65 else "partial_observation"
        else:
            unsupported = max(0.05, 0.55 - quality)
            reason = "observation_grounded" if quality >= 0.65 else "partial_observation"

        specificity = max(0.05, min(1.0, quality - 0.05))
        alignment = max(0.05, min(1.0, quality))

        rows = []
        for competency_id in sorted(evaluation.allowed_competency_ids):
            rows.append(
                AiCompetencyQuality(
                    competencyId=CompetencyId(competency_id),
                    quality=quality,
                    specificity=specificity,
                    evidenceAlignment=alignment,
                    unsupportedClaims=unsupported,
                    reasonCode=reason,
                )
            )
        if not rows:
            return None
        return AiEvidenceEvaluation(competencies=rows)


def assert_band_in_range(band: str, quality: float) -> bool:
    lo_hi = BAND_RANGES.get(band)
    if lo_hi is None:
        return False
    lo, hi = lo_hi
    return lo - 0.08 <= quality <= hi + 0.08

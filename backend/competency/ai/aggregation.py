"""Deterministic quality aggregation from AI evidence dimensions (Variant B).

AI judges dimensions. Backend computes quality. Engine computes competence.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Optional

from .schema import AiCompetencyDimensions, AiCompetencyQuality


# Positive dimensions — sum of weights = 1.0
POSITIVE_WEIGHTS: Mapping[str, float] = {
    "observationGrounding": 0.28,
    "specificity": 0.14,
    "competencyAlignment": 0.28,
    "relationalReasoning": 0.12,
    "evidenceScope": 0.10,
    "uncertaintyCalibration": 0.08,
}

# Soft multiplicative penalties (keep simple; hard caps do the heavy lifting)
UNSUPPORTED_SOFT = 0.30
OUTCOME_BIAS_SOFT = 0.25

# Hard caps — severe negatives cannot land excellent/strong
SEVERE_PENALTY = 0.70
MODERATE_PENALTY = 0.50
SEVERE_QUALITY_CAP = 0.45  # max weak/upper-weak
MODERATE_QUALITY_CAP = 0.70  # max decent

WEAK_GROUNDING = 0.25
WEAK_GROUNDING_CAP = 0.25
THIN_GROUNDING = 0.40
THIN_GROUNDING_CAP = 0.55
WEAK_ALIGNMENT = 0.30
WEAK_ALIGNMENT_CAP = 0.45
WEAK_SCOPE = 0.30
WEAK_SCOPE_CAP = 0.55


@dataclass(frozen=True)
class AggregationContext:
    """Optional drill-scope tweaks — never invents observations."""

    relational_weight_scale: float = 1.0
    """<1 for single_observation / single_sequence (less weight on multi-link reasoning)."""


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def aggregate_quality(
    dimensions: AiCompetencyDimensions,
    *,
    context: Optional[AggregationContext] = None,
) -> float:
    """Map dimension scores → quality ∈ [0, 1]. Pure function, no randomness."""
    ctx = context or AggregationContext()
    scale = max(0.0, min(1.0, float(ctx.relational_weight_scale)))

    weights = dict(POSITIVE_WEIGHTS)
    if scale != 1.0:
        weights["relationalReasoning"] = POSITIVE_WEIGHTS["relationalReasoning"] * scale
        # Renormalize so weights still sum to 1
        total = sum(weights.values())
        weights = {key: value / total for key, value in weights.items()}

    positive = (
        float(dimensions.observationGrounding) * weights["observationGrounding"]
        + float(dimensions.specificity) * weights["specificity"]
        + float(dimensions.competencyAlignment) * weights["competencyAlignment"]
        + float(dimensions.relationalReasoning) * weights["relationalReasoning"]
        + float(dimensions.evidenceScope) * weights["evidenceScope"]
        + float(dimensions.uncertaintyCalibration) * weights["uncertaintyCalibration"]
    )

    unsupported = float(dimensions.unsupportedClaims)
    outcome_bias = float(dimensions.outcomeBias)

    quality = positive * (1.0 - UNSUPPORTED_SOFT * unsupported) * (1.0 - OUTCOME_BIAS_SOFT * outcome_bias)

    if unsupported >= SEVERE_PENALTY or outcome_bias >= SEVERE_PENALTY:
        quality = min(quality, SEVERE_QUALITY_CAP)
    elif unsupported >= MODERATE_PENALTY or outcome_bias >= MODERATE_PENALTY:
        quality = min(quality, MODERATE_QUALITY_CAP)

    grounding = float(dimensions.observationGrounding)
    if grounding < WEAK_GROUNDING:
        quality = min(quality, WEAK_GROUNDING_CAP)
    elif grounding < THIN_GROUNDING:
        quality = min(quality, THIN_GROUNDING_CAP)

    if float(dimensions.competencyAlignment) < WEAK_ALIGNMENT:
        quality = min(quality, WEAK_ALIGNMENT_CAP)

    if float(dimensions.evidenceScope) < WEAK_SCOPE and grounding >= 0.50:
        quality = min(quality, WEAK_SCOPE_CAP)

    return _clamp01(quality)


def dimensions_to_quality_row(
    dimensions: AiCompetencyDimensions,
    *,
    context: Optional[AggregationContext] = None,
) -> AiCompetencyQuality:
    """Engine-facing row: computed quality + audit mirrors of dimensions."""
    quality = aggregate_quality(dimensions, context=context)
    return AiCompetencyQuality(
        competencyId=dimensions.competencyId,
        quality=quality,
        specificity=float(dimensions.specificity),
        evidenceAlignment=float(dimensions.competencyAlignment),
        unsupportedClaims=float(dimensions.unsupportedClaims),
        reasonCode=dimensions.reasonCode,
        observationGrounding=float(dimensions.observationGrounding),
        competencyAlignment=float(dimensions.competencyAlignment),
        relationalReasoning=float(dimensions.relationalReasoning),
        evidenceScope=float(dimensions.evidenceScope),
        uncertaintyCalibration=float(dimensions.uncertaintyCalibration),
        outcomeBias=float(dimensions.outcomeBias),
    )


def relational_scale_for_scope(scope: str) -> float:
    scope = (scope or "").strip().lower()
    if scope in ("single_observation", "single_sequence"):
        return 0.55
    if scope in ("multi_observation", "comparative_analysis"):
        return 0.85
    if scope == "pattern_synthesis":
        return 1.0
    return 1.0

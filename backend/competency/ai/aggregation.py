"""Deterministic quality aggregation from AI evidence dimensions (Variant B).

AI judges dimensions. Backend computes quality. Engine computes competence.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Mapping, Optional, Tuple

from .schema import AiCompetencyDimensions, AiCompetencyQuality


# Positive dimensions — sum of weights = 1.0 before emphasis / scope scaling
POSITIVE_WEIGHTS: Mapping[str, float] = {
    "observationGrounding": 0.28,
    "specificity": 0.14,
    "competencyAlignment": 0.28,
    "relationalReasoning": 0.12,
    "evidenceScope": 0.10,
    "uncertaintyCalibration": 0.08,
}

EMPHASIS_SCALE: Mapping[str, float] = {
    "high": 1.25,
    "medium": 1.0,
    "low": 0.55,
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

    dimension_emphasis: Mapping[str, str] = field(default_factory=dict)
    """high/medium/low overrides from drill assessment spec (positive dims only)."""


@dataclass(frozen=True)
class AggregationReport:
    """Diagnostics: why quality landed where it did (no LLM black box)."""

    positive_aggregate: float
    soft_penalty_factor: float
    quality_before_caps: float
    applied_caps: Tuple[str, ...]
    final_quality: float
    effective_weights: Mapping[str, float]
    dimensions: Mapping[str, float]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "positiveAggregate": round(self.positive_aggregate, 4),
            "softPenaltyFactor": round(self.soft_penalty_factor, 4),
            "qualityBeforeCaps": round(self.quality_before_caps, 4),
            "appliedCaps": list(self.applied_caps),
            "finalQuality": round(self.final_quality, 4),
            "effectiveWeights": {k: round(v, 4) for k, v in self.effective_weights.items()},
            "dimensions": {k: round(v, 4) for k, v in self.dimensions.items()},
        }


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _effective_weights(context: AggregationContext) -> Dict[str, float]:
    weights = dict(POSITIVE_WEIGHTS)
    scale = max(0.0, min(1.0, float(context.relational_weight_scale)))
    if scale != 1.0:
        weights["relationalReasoning"] = POSITIVE_WEIGHTS["relationalReasoning"] * scale

    for key, level in (context.dimension_emphasis or {}).items():
        if key not in weights:
            continue
        factor = EMPHASIS_SCALE.get(str(level).strip().lower(), 1.0)
        weights[key] = weights[key] * factor

    total = sum(weights.values()) or 1.0
    return {key: value / total for key, value in weights.items()}


def aggregate_quality_report(
    dimensions: AiCompetencyDimensions,
    *,
    context: Optional[AggregationContext] = None,
) -> AggregationReport:
    """Full diagnostic aggregation — same math as aggregate_quality."""
    ctx = context or AggregationContext()
    weights = _effective_weights(ctx)

    dim_values = {
        "observationGrounding": float(dimensions.observationGrounding),
        "specificity": float(dimensions.specificity),
        "competencyAlignment": float(dimensions.competencyAlignment),
        "relationalReasoning": float(dimensions.relationalReasoning),
        "evidenceScope": float(dimensions.evidenceScope),
        "uncertaintyCalibration": float(dimensions.uncertaintyCalibration),
        "unsupportedClaims": float(dimensions.unsupportedClaims),
        "outcomeBias": float(dimensions.outcomeBias),
    }

    positive = sum(dim_values[key] * weights[key] for key in weights)
    unsupported = dim_values["unsupportedClaims"]
    outcome_bias = dim_values["outcomeBias"]
    soft = (1.0 - UNSUPPORTED_SOFT * unsupported) * (1.0 - OUTCOME_BIAS_SOFT * outcome_bias)
    quality = positive * soft
    before_caps = quality
    caps: list[str] = []

    if unsupported >= SEVERE_PENALTY or outcome_bias >= SEVERE_PENALTY:
        if quality > SEVERE_QUALITY_CAP:
            caps.append("severe_penalty_cap_0.45")
        quality = min(quality, SEVERE_QUALITY_CAP)
    elif unsupported >= MODERATE_PENALTY or outcome_bias >= MODERATE_PENALTY:
        if quality > MODERATE_QUALITY_CAP:
            caps.append("moderate_penalty_cap_0.70")
        quality = min(quality, MODERATE_QUALITY_CAP)

    grounding = dim_values["observationGrounding"]
    if grounding < WEAK_GROUNDING:
        if quality > WEAK_GROUNDING_CAP:
            caps.append("weak_grounding_cap_0.25")
        quality = min(quality, WEAK_GROUNDING_CAP)
    elif grounding < THIN_GROUNDING:
        if quality > THIN_GROUNDING_CAP:
            caps.append("thin_grounding_cap_0.55")
        quality = min(quality, THIN_GROUNDING_CAP)

    if dim_values["competencyAlignment"] < WEAK_ALIGNMENT:
        if quality > WEAK_ALIGNMENT_CAP:
            caps.append("weak_alignment_cap_0.45")
        quality = min(quality, WEAK_ALIGNMENT_CAP)

    if dim_values["evidenceScope"] < WEAK_SCOPE and grounding >= 0.50:
        if quality > WEAK_SCOPE_CAP:
            caps.append("weak_scope_cap_0.55")
        quality = min(quality, WEAK_SCOPE_CAP)

    final = _clamp01(quality)
    return AggregationReport(
        positive_aggregate=_clamp01(positive),
        soft_penalty_factor=_clamp01(soft),
        quality_before_caps=_clamp01(before_caps),
        applied_caps=tuple(caps),
        final_quality=final,
        effective_weights=weights,
        dimensions=dim_values,
    )


def aggregate_quality(
    dimensions: AiCompetencyDimensions,
    *,
    context: Optional[AggregationContext] = None,
) -> float:
    """Map dimension scores → quality ∈ [0, 1]. Pure function, no randomness."""
    return aggregate_quality_report(dimensions, context=context).final_quality


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

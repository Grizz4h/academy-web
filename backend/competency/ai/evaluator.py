"""AiEvidenceEvaluator — dimension scores from AI, quality from backend aggregation."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

from competency.models import AssessmentSource, CompetencyId, DrillCompetencyProfile, EvidenceEventCreate

from .aggregation import AggregationContext, dimensions_to_quality_row, relational_scale_for_scope
from .constants import AI_EVALUATOR_VERSION, MVP_AI_DRILL_IDS, RUBRIC_VERSION_BY_DRILL, SOURCE_TYPE
from .provider import AiEvidenceProvider, OpenAiEvidenceProvider
from .rubrics import build_ai_evaluation_input
from .schema import AiCompetencyQuality, AiDimensionEvaluation, AiEvidenceEvaluation
from .specs import load_drill_assessment_spec


def _profiles_path() -> Path:
    return Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json"


@lru_cache(maxsize=1)
def _profile_by_drill_id() -> Dict[str, DrillCompetencyProfile]:
    from competency.validation import validate_drill_profiles

    document = json.loads(_profiles_path().read_text(encoding="utf-8"))
    profiles = validate_drill_profiles(document)
    return {profile.drillId: profile for profile in profiles}


def clear_ai_profile_cache() -> None:
    _profile_by_drill_id.cache_clear()


def _aggregation_context(drill_id: str) -> AggregationContext:
    spec = load_drill_assessment_spec(drill_id)
    scope = spec.scope if spec else "multi_observation"
    emphasis = dict(spec.dimension_emphasis) if spec else {}
    return AggregationContext(
        relational_weight_scale=relational_scale_for_scope(scope),
        dimension_emphasis=emphasis,
    )


def aggregate_dimension_evaluation(
    dimension_result: AiDimensionEvaluation,
    *,
    drill_id: str,
    allowed: Set[str],
) -> Optional[AiEvidenceEvaluation]:
    ctx = _aggregation_context(drill_id)
    rows: List[AiCompetencyQuality] = []
    for item in dimension_result.competencies:
        competency_id = str(item.competencyId)
        if competency_id not in allowed:
            continue
        rows.append(dimensions_to_quality_row(item, context=ctx))
    if not rows:
        return None
    return AiEvidenceEvaluation(competencies=rows)


class AiEvidenceEvaluator:
    """Derive EvidenceEventCreate payloads via AI review of drill answers."""

    def __init__(self, provider: Optional[AiEvidenceProvider] = None):
        self._provider = provider or OpenAiEvidenceProvider()

    def supports_drill(self, drill_id: str) -> bool:
        drill_id = str(drill_id or "").strip()
        if drill_id not in MVP_AI_DRILL_IDS:
            return False
        profile = _profile_by_drill_id().get(drill_id)
        return bool(profile and profile.evidence.enabled)

    def _allowed_competency_ids(self, profile: DrillCompetencyProfile) -> Set[str]:
        return {
            str(competency_key)
            for competency_key, weight in profile.evidence.weights.items()
            if float(weight) > 0
        }

    def _validate_ai_output(
        self,
        evaluation: AiEvidenceEvaluation,
        allowed: Set[str],
    ) -> Dict[str, float]:
        qualities: Dict[str, float] = {}
        for item in evaluation.competencies:
            competency_id = str(item.competencyId)
            if competency_id not in allowed:
                continue
            qualities[competency_id] = max(0.0, min(1.0, float(item.quality)))
        return qualities

    def _normalize_provider_result(
        self,
        raw: Union[AiDimensionEvaluation, AiEvidenceEvaluation, None],
        *,
        drill_id: str,
        allowed: Set[str],
    ) -> Optional[AiEvidenceEvaluation]:
        if raw is None:
            return None
        if isinstance(raw, AiEvidenceEvaluation):
            # Legacy/test providers that already supply quality — keep for unit tests only
            filtered = [item for item in raw.competencies if str(item.competencyId) in allowed]
            return AiEvidenceEvaluation(competencies=filtered) if filtered else None
        return aggregate_dimension_evaluation(raw, drill_id=drill_id, allowed=allowed)

    def _run_provider(
        self,
        *,
        drill_id: str,
        answers: Dict[str, Any],
        drill_config: Dict[str, Any],
        drill_title: str = "",
        allow_validation_drills: bool = False,
        allowed_override: Optional[Set[str]] = None,
    ) -> tuple[Optional[AiEvidenceEvaluation], Dict[str, Any], Set[str]]:
        """Shared AI call path. Never persists. Returns (result, audit, allowed)."""
        drill_id = str(drill_id or "").strip()
        empty_audit: Dict[str, Any] = {
            "evaluatorVersion": AI_EVALUATOR_VERSION,
        }
        if drill_id not in MVP_AI_DRILL_IDS and not allow_validation_drills:
            return None, empty_audit, set()

        profile = _profile_by_drill_id().get(drill_id)
        if profile is None or not profile.evidence.enabled:
            if not (allow_validation_drills and allowed_override):
                return None, empty_audit, set()

        if allowed_override is not None:
            allowed = set(allowed_override)
        else:
            assert profile is not None
            allowed = self._allowed_competency_ids(profile)

        spec = load_drill_assessment_spec(drill_id)
        rubric_version = (
            (spec.spec_version if spec else None)
            or RUBRIC_VERSION_BY_DRILL.get(drill_id)
            or AI_EVALUATOR_VERSION
        )
        audit_metadata: Dict[str, Any] = {
            "evaluatorVersion": AI_EVALUATOR_VERSION,
            "rubricVersion": rubric_version,
            "qualitySource": "backend_aggregation_v1",
        }

        evaluation_input = build_ai_evaluation_input(
            drill_id,
            answers or {},
            drill_config or {},
            allowed_competency_ids=allowed,
            rubric_version=rubric_version,
            drill_title=drill_title,
            allow_validation_drills=allow_validation_drills,
        )
        if evaluation_input is None:
            return None, audit_metadata, allowed

        provider = self._provider
        if isinstance(provider, OpenAiEvidenceProvider):
            ai_raw, audit = provider.evaluate_with_audit(evaluation_input)
            audit_metadata.update(audit)
        else:
            ai_raw = provider.evaluate(evaluation_input)

        result = self._normalize_provider_result(ai_raw, drill_id=drill_id, allowed=allowed)
        if result is None:
            return None, audit_metadata, allowed
        return result, audit_metadata, allowed

    def evaluate_detailed(
        self,
        *,
        drill_id: str,
        answers: Dict[str, Any],
        drill_config: Dict[str, Any],
        drill_title: str = "",
        allow_validation_drills: bool = False,
        allowed_override: Optional[Set[str]] = None,
    ) -> Optional[AiEvidenceEvaluation]:
        """Full AI quality rows for review/calibration — no EvidenceEvents, no persistence."""
        result, _audit, _allowed = self._run_provider(
            drill_id=drill_id,
            answers=answers,
            drill_config=drill_config,
            drill_title=drill_title,
            allow_validation_drills=allow_validation_drills,
            allowed_override=allowed_override,
        )
        return result

    def evaluate(
        self,
        *,
        drill_id: str,
        answers: Dict[str, Any],
        drill_config: Dict[str, Any],
        source_id: str,
        drill_title: str = "",
    ) -> List[EvidenceEventCreate]:
        ai_result, audit_metadata, _allowed = self._run_provider(
            drill_id=drill_id,
            answers=answers,
            drill_config=drill_config,
            drill_title=drill_title,
            allow_validation_drills=False,
        )
        if ai_result is None:
            return []

        qualities = self._validate_ai_output(ai_result, {str(c.competencyId) for c in ai_result.competencies})
        if not qualities:
            return []

        profile = _profile_by_drill_id().get(str(drill_id or "").strip())
        if profile is None:
            return []

        events: List[EvidenceEventCreate] = []
        for competency_key, weight in profile.evidence.weights.items():
            if float(weight) <= 0:
                continue
            competency_id = str(competency_key)
            quality = qualities.get(competency_id)
            if quality is None:
                continue
            events.append(
                EvidenceEventCreate(
                    drillId=drill_id,
                    competencyId=CompetencyId(competency_id),
                    quality=quality,
                    assessmentSource=AssessmentSource.AI_REVIEW,
                    sourceType=SOURCE_TYPE,
                    sourceId=source_id,
                    metadata=dict(audit_metadata),
                )
            )
        return events

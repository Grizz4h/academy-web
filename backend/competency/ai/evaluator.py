"""AiEvidenceEvaluator — competency-specific quality from free-text submissions."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from competency.models import AssessmentSource, CompetencyId, DrillCompetencyProfile, EvidenceEventCreate

from .constants import AI_EVALUATOR_VERSION, MVP_AI_DRILL_IDS, RUBRIC_VERSION_BY_DRILL, SOURCE_TYPE
from .provider import AiEvidenceProvider, OpenAiEvidenceProvider
from .rubrics import build_ai_evaluation_input
from .schema import AiEvidenceEvaluation


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

    def _run_provider(
        self,
        *,
        drill_id: str,
        answers: Dict[str, Any],
        drill_config: Dict[str, Any],
        drill_title: str = "",
    ) -> tuple[Optional[AiEvidenceEvaluation], Dict[str, Any], Set[str]]:
        """Shared AI call path. Never persists. Returns (result, audit, allowed)."""
        drill_id = str(drill_id or "").strip()
        empty_audit: Dict[str, Any] = {
            "evaluatorVersion": AI_EVALUATOR_VERSION,
        }
        if drill_id not in MVP_AI_DRILL_IDS:
            return None, empty_audit, set()

        profile = _profile_by_drill_id().get(drill_id)
        if profile is None or not profile.evidence.enabled:
            return None, empty_audit, set()

        allowed = self._allowed_competency_ids(profile)
        rubric_version = RUBRIC_VERSION_BY_DRILL.get(drill_id, AI_EVALUATOR_VERSION)
        audit_metadata: Dict[str, Any] = {
            "evaluatorVersion": AI_EVALUATOR_VERSION,
            "rubricVersion": rubric_version,
        }

        evaluation_input = build_ai_evaluation_input(
            drill_id,
            answers or {},
            drill_config or {},
            allowed_competency_ids=allowed,
            rubric_version=rubric_version,
            drill_title=drill_title,
        )
        if evaluation_input is None:
            return None, audit_metadata, allowed

        provider = self._provider
        if isinstance(provider, OpenAiEvidenceProvider):
            ai_result, audit = provider.evaluate_with_audit(evaluation_input)
            audit_metadata.update(audit)
        else:
            ai_result = provider.evaluate(evaluation_input)

        if ai_result is None:
            return None, audit_metadata, allowed

        filtered = [
            item
            for item in ai_result.competencies
            if str(item.competencyId) in allowed
        ]
        if not filtered:
            return None, audit_metadata, allowed
        return AiEvidenceEvaluation(competencies=filtered), audit_metadata, allowed

    def evaluate_detailed(
        self,
        *,
        drill_id: str,
        answers: Dict[str, Any],
        drill_config: Dict[str, Any],
        drill_title: str = "",
    ) -> Optional[AiEvidenceEvaluation]:
        """Full AI quality rows for review/calibration — no EvidenceEvents, no persistence."""
        result, _audit, _allowed = self._run_provider(
            drill_id=drill_id,
            answers=answers,
            drill_config=drill_config,
            drill_title=drill_title,
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

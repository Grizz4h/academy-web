"""StructuredEvidenceEvaluator — server-side quality from drill submissions."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from competency.models import AssessmentSource, CompetencyId, DrillCompetencyProfile, EvidenceEventCreate

from .constants import MVP_STRUCTURED_DRILL_IDS, SOURCE_TYPE, STRUCTURED_EVALUATOR_VERSION
from .rubrics import RUBRIC_BY_DRILL, RUBRIC_VERSION_BY_DRILL


def _profiles_path() -> Path:
    return Path(__file__).resolve().parents[3] / "data/academy/competency/drill_profiles.json"


@lru_cache(maxsize=1)
def _profile_by_drill_id() -> Dict[str, DrillCompetencyProfile]:
    from competency.validation import validate_drill_profiles

    document = json.loads(_profiles_path().read_text(encoding="utf-8"))
    profiles = validate_drill_profiles(document)
    return {profile.drillId: profile for profile in profiles}


def clear_structured_profile_cache() -> None:
    _profile_by_drill_id.cache_clear()


class StructuredEvidenceEvaluator:
    """Derive EvidenceEventCreate payloads from structured drill answers."""

    def supports_drill(self, drill_id: str) -> bool:
        drill_id = str(drill_id or "").strip()
        if drill_id not in MVP_STRUCTURED_DRILL_IDS:
            return False
        profile = _profile_by_drill_id().get(drill_id)
        return bool(profile and profile.evidence.enabled)

    def evaluate(
        self,
        *,
        drill_id: str,
        answers: Dict[str, Any],
        drill_config: Dict[str, Any],
        source_id: str,
    ) -> List[EvidenceEventCreate]:
        drill_id = str(drill_id or "").strip()
        rubric_fn = RUBRIC_BY_DRILL.get(drill_id)
        if rubric_fn is None:
            return []

        profile = _profile_by_drill_id().get(drill_id)
        if profile is None or not profile.evidence.enabled:
            return []

        if profile.evidence.assessmentMode not in (
            AssessmentSource.STRUCTURED,
            AssessmentSource.STRUCTURED.value,
            "structured",
        ):
            return []

        quality = rubric_fn(answers or {}, drill_config or {})
        if quality is None:
            return []

        rubric_version = RUBRIC_VERSION_BY_DRILL.get(drill_id, STRUCTURED_EVALUATOR_VERSION)
        metadata = {
            "evaluatorVersion": STRUCTURED_EVALUATOR_VERSION,
            "rubricVersion": rubric_version,
        }

        events: List[EvidenceEventCreate] = []
        for competency_key, weight in profile.evidence.weights.items():
            if float(weight) <= 0:
                continue
            competency_id = CompetencyId(str(competency_key))
            events.append(
                EvidenceEventCreate(
                    drillId=drill_id,
                    competencyId=competency_id,
                    quality=quality,
                    assessmentSource=AssessmentSource.STRUCTURED,
                    sourceType=SOURCE_TYPE,
                    sourceId=source_id,
                    metadata=metadata,
                )
            )
        return events

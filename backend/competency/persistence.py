"""Row mapping between persistence storage and domain EvidenceEvent / UserCompetencyState."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from .catalog import EvidenceMapCatalog
from .constants import ENGINE_VERSION
from .engine import compute_event_strength
from .models import AssessmentSource, CompetencyId, EvidenceEvent, UserCompetencyState


def _as_uuid(value: Any) -> UUID:
    if isinstance(value, UUID):
        return value
    return UUID(str(value))


def _as_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    text = str(value).replace("Z", "+00:00")
    parsed = datetime.fromisoformat(text)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def hydrate_evidence_event(
    row: Dict[str, Any],
    *,
    catalog: EvidenceMapCatalog,
) -> Optional[EvidenceEvent]:
    """Build domain event; map-derived strength/level are authoritative at read time."""
    drill_id = str(row["drill_id"])
    competency_id = str(row["competency_id"])
    if catalog.is_e4_training_only(drill_id):
        return None

    entry = catalog.get(drill_id, competency_id)
    if entry is None:
        return None

    quality = float(row["quality"])
    strength = compute_event_strength(
        entry.evidence_weight,
        entry.max_strength,
        entry.evidence_level,
        quality,
    )
    return EvidenceEvent(
        eventId=_as_uuid(row["event_id"]),
        userId=_as_uuid(row["rinq_user_id"]),
        drillId=drill_id,
        competencyId=CompetencyId(competency_id),
        quality=quality,
        strength=strength,
        evidenceLevel=entry.evidence_level,
        assessmentSource=AssessmentSource(str(row["assessment_source"])),
        createdAt=_as_datetime(row["created_at"]),
    )


def event_to_storage_row(
    *,
    event_id: UUID,
    rinq_user_id: str,
    create: Any,
    engine_version: str,
    map_hash: Optional[str],
    created_at: datetime,
) -> Dict[str, Any]:
    return {
        "event_id": str(event_id),
        "rinq_user_id": rinq_user_id,
        "drill_id": create.drillId,
        "competency_id": str(create.competencyId),
        "quality": float(create.quality),
        "assessment_source": str(create.assessmentSource),
        "created_at": created_at.isoformat(),
        "engine_version": engine_version,
        "map_hash": map_hash,
        "source_type": create.sourceType,
        "source_id": create.sourceId,
        "metadata": dict(create.metadata or {}),
    }


def state_to_storage_row(
    *,
    rinq_user_id: str,
    state: UserCompetencyState,
    engine_version: str,
    map_hash: Optional[str],
    recomputed_at: datetime,
) -> Dict[str, Any]:
    last_at = state.lastEvidenceAt
    if isinstance(last_at, datetime):
        last_iso = last_at.isoformat()
    elif last_at:
        last_iso = str(last_at)
    else:
        last_iso = None
    return {
        "rinq_user_id": rinq_user_id,
        "competency_id": str(state.competencyId),
        "score": float(state.score),
        "confidence": float(state.confidence),
        "breadth": float(state.breadth),
        "evidence_count": int(state.evidenceCount),
        "highest_evidence_level": int(state.highestEvidenceLevel),
        "last_evidence_at": last_iso,
        "engine_version": engine_version,
        "map_hash": map_hash,
        "recomputed_at": recomputed_at.isoformat(),
    }


def row_to_user_competency_state(row: Dict[str, Any]) -> UserCompetencyState:
    last_raw = row.get("last_evidence_at")
    last_at = _as_datetime(last_raw) if last_raw else None
    return UserCompetencyState(
        competencyId=CompetencyId(str(row["competency_id"])),
        score=float(row["score"]),
        confidence=float(row["confidence"]),
        breadth=float(row["breadth"]),
        evidenceCount=int(row["evidence_count"]),
        highestEvidenceLevel=int(row["highest_evidence_level"]),
        lastEvidenceAt=last_at,
    )


def default_engine_version() -> str:
    return ENGINE_VERSION

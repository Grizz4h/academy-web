"""Shared helpers for simulation scenarios and engine tests."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from ..catalog import EvidenceMapCatalog
from ..engine import compute_event_strength
from ..models import AssessmentSource, EvidenceEvent


def build_evidence_event(
    catalog: EvidenceMapCatalog,
    competency_id: str,
    drill_id: str,
    quality: float,
    when: datetime,
    *,
    user_id=None,
    event_id=None,
) -> EvidenceEvent:
    entry = catalog.get(drill_id, competency_id)
    if entry is None:
        raise KeyError(f"No evidence map entry for {drill_id}:{competency_id}")

    strength = compute_event_strength(
        entry.evidence_weight,
        entry.max_strength,
        entry.evidence_level,
        quality,
    )
    return EvidenceEvent(
        eventId=event_id or uuid4(),
        userId=user_id or uuid4(),
        drillId=drill_id,
        competencyId=competency_id,
        quality=quality,
        strength=strength,
        evidenceLevel=entry.evidence_level,
        assessmentSource=AssessmentSource.STRUCTURED,
        createdAt=when,
    )

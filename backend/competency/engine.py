"""Competency Engine V1 — deterministic recompute from immutable evidence events."""

from __future__ import annotations

import math
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Sequence, Tuple
from uuid import UUID

from .catalog import EvidenceMapCatalog, EvidenceMapEntry
from .constants import (
    BREADTH_W_DRILL,
    BREADTH_W_LETTER,
    BREADTH_W_TRACK,
    CONFIDENCE_BREADTH_BASE,
    CONFIDENCE_BREADTH_SQRT_SCALE,
    CONFIDENCE_K,
    CONFIDENCE_MAX,
    ENGINE_VERSION,
    LEVEL_CAPACITY,
    LEVEL_PROOF_AGGREGATE,
    LEVEL_PROOF_DIVERSITY_FACTOR,
    LEVEL_PROOF_MIN_QUALITY,
    LEVEL_PROOF_MIN_STRENGTH,
    LEVEL_PROOF_SINGLE_QUALITY,
    LEVEL_PROOF_SINGLE_STRENGTH,
    LEVEL_SCORE_CEILING,
    QUALITY_NEUTRAL,
    SCORE_MAX,
    SCORE_MIN,
    SCORE_SOFT_CEILING_BLEED,
)
from .models import CompetencyId, EvidenceEvent, UserCompetencyState


class CompetencyEngineError(ValueError):
    """Invalid evidence event for engine recompute."""


@dataclass(frozen=True)
class ResolvedEvidenceEvent:
    """Event with authoritative map-derived fields used for scoring."""

    event_id: UUID
    user_id: UUID
    drill_id: str
    competency_id: str
    quality: float
    strength: float
    evidence_level: int
    assessment_source: str
    created_at: datetime
    map_entry: EvidenceMapEntry


@dataclass(frozen=True)
class EngineRecomputeResult:
    engine_version: str
    states: Dict[str, UserCompetencyState]
    map_version: Optional[str] = None


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def quality_signal(quality: float) -> float:
    q = clamp(quality, 0.0, 1.0)
    return clamp((q - QUALITY_NEUTRAL) * 2.0, -1.0, 1.0)


def level_capacity(evidence_level: int) -> float:
    return LEVEL_CAPACITY.get(int(evidence_level), 0.0)


def compute_event_strength(
    evidence_weight: float,
    max_strength: float,
    evidence_level: int,
    quality: float,
) -> float:
    relevance = clamp(evidence_weight, 0.0, 100.0) / 100.0
    perf = abs(quality_signal(quality))
    raw = relevance * clamp(max_strength, 0.0, 1.0) * level_capacity(evidence_level) * perf
    cap = relevance * clamp(max_strength, 0.0, 1.0)
    return max(0.0, min(raw, cap))


def compute_event_target(evidence_level: int, quality: float) -> float:
    ceiling = LEVEL_SCORE_CEILING.get(int(evidence_level), SCORE_MIN)
    sig = quality_signal(quality)
    if sig >= 0:
        return 50.0 + (ceiling - 50.0) * sig
    floor = max(0.0, ceiling - 40.0)
    return 50.0 + (floor - 50.0) * (-sig)


def repetition_factor(repetition_index: int) -> float:
    n = int(repetition_index)
    if n <= 0:
        return 0.0
    return n ** (-0.5)


def _parse_created_at(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            raise CompetencyEngineError("createdAt must be timezone-aware")
        return value
    if not isinstance(value, str) or not value.strip():
        raise CompetencyEngineError("createdAt is required for deterministic ordering")
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise CompetencyEngineError(f"invalid createdAt: {value}") from exc
    if parsed.tzinfo is None:
        raise CompetencyEngineError("createdAt must be timezone-aware")
    return parsed


def resolve_evidence_event(
    event: EvidenceEvent,
    catalog: EvidenceMapCatalog,
) -> Optional[ResolvedEvidenceEvent]:
    """Validate and resolve authoritative map fields. Returns None for E4 (training-only)."""
    drill_id = event.drillId
    competency_id = str(event.competencyId)

    if catalog.is_e4_training_only(drill_id):
        return None

    try:
        competency_id = CompetencyId(competency_id).value
    except ValueError as exc:
        raise CompetencyEngineError(f"unknown competencyId: {event.competencyId}") from exc

    entry = catalog.get(drill_id, competency_id)
    if entry is None:
        raise CompetencyEngineError(
            f"no enabled evidence mapping for drill {drill_id} competency {competency_id}"
        )

    quality = clamp(float(event.quality), 0.0, 1.0)
    strength = compute_event_strength(
        entry.evidence_weight,
        entry.max_strength,
        entry.evidence_level,
        quality,
    )

    if int(event.evidenceLevel) != entry.evidence_level:
        raise CompetencyEngineError(
            f"evidenceLevel {event.evidenceLevel} does not match map ({entry.evidence_level}) "
            f"for {drill_id}/{competency_id}"
        )

    return ResolvedEvidenceEvent(
        event_id=event.eventId,
        user_id=event.userId,
        drill_id=drill_id,
        competency_id=competency_id,
        quality=quality,
        strength=strength,
        evidence_level=entry.evidence_level,
        assessment_source=event.assessmentSource,
        created_at=_parse_created_at(event.createdAt),
        map_entry=entry,
    )


def sort_events(events: Sequence[ResolvedEvidenceEvent]) -> List[ResolvedEvidenceEvent]:
    return sorted(events, key=lambda ev: (ev.created_at, str(ev.event_id)))


def _drill_repetition_index(events: Sequence[ResolvedEvidenceEvent]) -> Dict[UUID, int]:
    counts: Dict[str, int] = defaultdict(int)
    indices: Dict[UUID, int] = {}
    for ev in sort_events(events):
        counts[ev.drill_id] += 1
        indices[ev.event_id] = counts[ev.drill_id]
    return indices


def effective_event_weight(
    event: ResolvedEvidenceEvent,
    repetition_index: int,
) -> float:
    return event.strength * repetition_factor(repetition_index)


def proven_level_support(
    events: Sequence[ResolvedEvidenceEvent],
) -> Tuple[Dict[int, float], Dict[int, set]]:
    support: Dict[int, float] = defaultdict(float)
    drills_at: Dict[int, set] = defaultdict(set)
    counts: Dict[str, int] = defaultdict(int)
    for ev in sort_events(events):
        counts[ev.drill_id] += 1
        if ev.quality < LEVEL_PROOF_MIN_QUALITY or ev.strength < LEVEL_PROOF_MIN_STRENGTH:
            continue
        level = ev.evidence_level
        support[level] += effective_event_weight(ev, counts[ev.drill_id])
        drills_at[level].add(ev.drill_id)
    return support, drills_at


def _level_proof_threshold(unique_drills: int) -> float:
    threshold = LEVEL_PROOF_AGGREGATE
    if unique_drills >= 2:
        threshold *= LEVEL_PROOF_DIVERSITY_FACTOR ** (unique_drills - 1)
    return threshold


def determine_proven_levels(events: Sequence[ResolvedEvidenceEvent]) -> List[int]:
    support, drills_at = proven_level_support(events)
    proven = [
        level
        for level, aggregate in support.items()
        if aggregate >= _level_proof_threshold(len(drills_at[level]))
    ]
    for ev in events:
        if ev.quality >= LEVEL_PROOF_SINGLE_QUALITY and ev.strength >= LEVEL_PROOF_SINGLE_STRENGTH:
            proven.append(ev.evidence_level)
    return sorted(set(proven))


def determine_proven_level(events: Sequence[ResolvedEvidenceEvent]) -> int:
    proven = determine_proven_levels(events)
    return max(proven) if proven else 0


def score_ceiling_from_events(events: Sequence[ResolvedEvidenceEvent]) -> float:
    proven = determine_proven_levels(events)
    if not proven:
        return LEVEL_SCORE_CEILING[1]
    return LEVEL_SCORE_CEILING[max(proven)]


def apply_soft_ceiling(raw_score: float, hard_ceiling: float) -> float:
    if raw_score <= hard_ceiling:
        return clamp(raw_score, SCORE_MIN, SCORE_MAX)
    excess = raw_score - hard_ceiling
    return clamp(hard_ceiling + excess * SCORE_SOFT_CEILING_BLEED, SCORE_MIN, SCORE_MAX)


def compute_breadth(
    competency_id: str,
    events: Sequence[ResolvedEvidenceEvent],
    catalog: EvidenceMapCatalog,
) -> float:
    if not events:
        return 0.0

    avail_drills = max(1, len(catalog.drills.get(competency_id, set())))
    avail_tracks = max(1, len(catalog.tracks.get(competency_id, set())))
    avail_letters = max(1, len(catalog.letters.get(competency_id, set())))

    drill_contrib: Dict[str, float] = defaultdict(float)
    tracks_hit: set = set()
    letters_hit: set = set()
    counts: Dict[str, int] = defaultdict(int)

    for ev in sort_events(events):
        counts[ev.drill_id] += 1
        drill_contrib[ev.drill_id] += effective_event_weight(ev, counts[ev.drill_id])
        tracks_hit.add(ev.map_entry.track)
        letters_hit.add(ev.map_entry.letter)

    drill_coverage = sum(min(1.0, value) for value in drill_contrib.values()) / avail_drills
    track_coverage = len(tracks_hit) / avail_tracks
    letter_coverage = len(letters_hit) / avail_letters
    raw = (
        BREADTH_W_DRILL * drill_coverage
        + BREADTH_W_TRACK * track_coverage
        + BREADTH_W_LETTER * letter_coverage
    )
    return clamp(raw, 0.0, 1.0)


def effective_evidence_volume(events: Sequence[ResolvedEvidenceEvent]) -> float:
    counts: Dict[str, int] = defaultdict(int)
    total = 0.0
    for ev in sort_events(events):
        counts[ev.drill_id] += 1
        total += effective_event_weight(ev, counts[ev.drill_id])
    return total


def compute_confidence(
    events: Sequence[ResolvedEvidenceEvent],
    breadth: float,
) -> float:
    if not events:
        return 0.0
    effective = effective_evidence_volume(events)
    evidence_confidence = 1.0 - math.exp(-CONFIDENCE_K * math.sqrt(max(0.0, effective)))
    breadth_modifier = CONFIDENCE_BREADTH_BASE + CONFIDENCE_BREADTH_SQRT_SCALE * math.sqrt(
        clamp(breadth, 0.0, 1.0)
    )
    return clamp(evidence_confidence * breadth_modifier, 0.0, CONFIDENCE_MAX)


def compute_raw_score(events: Sequence[ResolvedEvidenceEvent]) -> float:
    counts: Dict[str, int] = defaultdict(int)
    weighted_sum = 0.0
    weight_total = 0.0
    for ev in sort_events(events):
        counts[ev.drill_id] += 1
        weight = effective_event_weight(ev, counts[ev.drill_id])
        if weight <= 0:
            continue
        weighted_sum += weight * compute_event_target(ev.evidence_level, ev.quality)
        weight_total += weight
    if weight_total <= 0:
        return 0.0
    return weighted_sum / weight_total


def recompute_competency_state(
    competency_id: str,
    events: Sequence[EvidenceEvent],
    catalog: EvidenceMapCatalog,
) -> UserCompetencyState:
    competency_key = str(competency_id)
    resolved: List[ResolvedEvidenceEvent] = []
    for event in events:
        if str(event.competencyId) != competency_key:
            continue
        resolved_ev = resolve_evidence_event(event, catalog)
        if resolved_ev is not None:
            resolved.append(resolved_ev)

    if not resolved:
        return UserCompetencyState(
            competencyId=competency_key,
            score=0.0,
            confidence=0.0,
            evidenceCount=0,
            breadth=0.0,
            highestEvidenceLevel=0,
            lastEvidenceAt=None,
        )

    ordered = sort_events(resolved)
    breadth = compute_breadth(competency_key, ordered, catalog)
    confidence = compute_confidence(ordered, breadth)
    raw_score = compute_raw_score(ordered)
    hard_ceiling = score_ceiling_from_events(ordered)
    score = apply_soft_ceiling(raw_score, hard_ceiling)
    contributing = [ev for ev in ordered if ev.strength > 0]

    return UserCompetencyState(
        competencyId=competency_key,
        score=round(score, 1),
        confidence=round(confidence, 3),
        evidenceCount=len(contributing),
        breadth=round(breadth, 3),
        highestEvidenceLevel=determine_proven_level(ordered),
        lastEvidenceAt=ordered[-1].created_at,
    )


def recompute_user_competencies(
    events: Sequence[EvidenceEvent],
    catalog: EvidenceMapCatalog,
    *,
    map_version: Optional[str] = None,
) -> EngineRecomputeResult:
    states = {
        comp.value: recompute_competency_state(comp.value, events, catalog)
        for comp in CompetencyId
    }
    return EngineRecomputeResult(
        engine_version=ENGINE_VERSION,
        states=states,
        map_version=map_version,
    )


def load_catalog_from_profiles_path(path: str) -> EvidenceMapCatalog:
    import json
    from pathlib import Path

    from .validation import validate_drill_profiles

    document = json.loads(Path(path).read_text(encoding="utf-8"))
    profiles = validate_drill_profiles(document)
    return EvidenceMapCatalog.from_profiles(profiles)

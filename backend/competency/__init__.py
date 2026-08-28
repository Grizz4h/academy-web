"""Competency domain — contracts, validation, Engine V1, and persistence ports."""

from .constants import ENGINE_VERSION
from .engine import (
    EngineRecomputeResult,
    compute_confidence,
    compute_event_strength,
    compute_event_target,
    recompute_competency_state,
    recompute_user_competencies,
)
from .models import DrillCompetencyProfile, EvidenceEvent, EvidenceEventCreate, UserCompetencyState
from .service import CompetencyRecomputeService

__all__ = [
    "ENGINE_VERSION",
    "CompetencyRecomputeService",
    "DrillCompetencyProfile",
    "EngineRecomputeResult",
    "EvidenceEvent",
    "EvidenceEventCreate",
    "UserCompetencyState",
    "compute_confidence",
    "compute_event_strength",
    "compute_event_target",
    "recompute_competency_state",
    "recompute_user_competencies",
]

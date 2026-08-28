"""Competency domain — contracts, validation, and Engine V1 recompute."""

from .constants import ENGINE_VERSION
from .engine import (
    EngineRecomputeResult,
    compute_confidence,
    compute_event_strength,
    compute_event_target,
    recompute_competency_state,
    recompute_user_competencies,
)
from .models import DrillCompetencyProfile, EvidenceEvent, UserCompetencyState

__all__ = [
    "ENGINE_VERSION",
    "DrillCompetencyProfile",
    "EngineRecomputeResult",
    "EvidenceEvent",
    "UserCompetencyState",
    "compute_confidence",
    "compute_event_strength",
    "compute_event_target",
    "recompute_competency_state",
    "recompute_user_competencies",
]

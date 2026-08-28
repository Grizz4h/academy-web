"""Versioned competency contracts; intentionally contains no scoring engine."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


SCHEMA_VERSION = 1


class CompetencyId(str, Enum):
    SCANNING_IDENTIFICATION = "scanning_identification"
    ROLES_SUPPORT = "roles_support"
    SPACE_STRUCTURE = "space_structure"
    OPTIONS_DECISIONS = "options_decisions"
    TRANSITION_TEMPO = "transition_tempo"
    PRESSURE_CONTROL = "pressure_control"
    SYSTEMS_PATTERNS = "systems_patterns"
    EVIDENCE_ANALYSIS = "evidence_analysis"


class AssessmentSource(str, Enum):
    STRUCTURED = "structured"
    DETERMINISTIC = "deterministic"
    AI_REVIEW = "ai_review"


class StrictContract(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)


class DrillEvidenceProfile(StrictContract):
    enabled: bool = False
    weights: Dict[CompetencyId, float] = Field(default_factory=dict)
    level: Optional[int] = Field(default=None, ge=1, le=5)
    # Caps later EvidenceEvent.strength (0–1); not a 0–100 weight.
    maxStrength: Optional[float] = Field(default=None, ge=0, le=1)
    assessmentMode: Optional[AssessmentSource] = None
    requiresQualityEvaluation: bool = False

    @field_validator("weights")
    @classmethod
    def validate_weights(cls, value: Dict[CompetencyId, float]) -> Dict[CompetencyId, float]:
        for weight in value.values():
            if not 0 <= weight <= 100:
                raise ValueError("evidence weights must be between 0 and 100")
        return value

    @model_validator(mode="after")
    def disabled_has_no_active_parameters(self) -> "DrillEvidenceProfile":
        if not self.enabled and (
            self.weights or self.level is not None or self.maxStrength is not None
            or self.assessmentMode is not None or self.requiresQualityEvaluation
        ):
            raise ValueError("disabled evidence cannot contain active evidence parameters")
        return self


class DrillCompetencyProfile(StrictContract):
    drillId: str = Field(min_length=1)
    schemaVersion: int = Field(default=SCHEMA_VERSION, ge=1)
    trainingWeights: Dict[CompetencyId, float]
    evidence: DrillEvidenceProfile = Field(default_factory=DrillEvidenceProfile)

    @field_validator("trainingWeights")
    @classmethod
    def validate_training_weights(cls, value: Dict[CompetencyId, float]) -> Dict[CompetencyId, float]:
        expected = {item.value for item in CompetencyId}
        actual = {str(key) for key in value}
        if actual != expected:
            raise ValueError("trainingWeights must contain exactly the eight V1 competency IDs")
        for weight in value.values():
            if not 0 <= weight <= 100:
                raise ValueError("training weights must be between 0 and 100")
        return value

    @model_validator(mode="after")
    def enforce_e4_training_only(self) -> "DrillCompetencyProfile":
        if self.drillId.upper().startswith("E4_") and self.evidence.enabled:
            raise ValueError("E4 is training-only; evidence must be disabled")
        return self

    @model_validator(mode="after")
    def evidence_requires_training_support(self) -> "DrillCompetencyProfile":
        if not self.evidence.enabled:
            return self
        if not self.evidence.weights:
            raise ValueError("enabled evidence requires at least one weight")
        if self.evidence.level is None or self.evidence.maxStrength is None or self.evidence.assessmentMode is None:
            raise ValueError("enabled evidence requires level, maxStrength and assessmentMode")
        for key, weight in self.evidence.weights.items():
            competency_id = str(key)
            training = float(self.trainingWeights.get(key, self.trainingWeights.get(competency_id, 0)))
            if training <= 0:
                raise ValueError(
                    f"evidence weight for {competency_id} requires trainingWeights > 0"
                )
            if weight > training:
                raise ValueError(
                    f"evidence weight for {competency_id} cannot exceed training weight"
                )
        return self


class UserCompetencyState(StrictContract):
    schemaVersion: int = Field(default=SCHEMA_VERSION, ge=1)
    competencyId: CompetencyId
    score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    evidenceCount: int = Field(ge=0)
    breadth: float = Field(ge=0, le=1)
    highestEvidenceLevel: int = Field(ge=0, le=5)
    lastEvidenceAt: Optional[datetime] = None


class EvidenceEvent(StrictContract):
    schemaVersion: int = Field(default=SCHEMA_VERSION, ge=1)
    eventId: UUID
    userId: UUID
    drillId: str = Field(min_length=1)
    competencyId: CompetencyId
    quality: float = Field(ge=0, le=1)
    strength: float = Field(ge=0, le=1)
    evidenceLevel: int = Field(ge=1, le=5)
    assessmentSource: AssessmentSource
    createdAt: datetime


class EvidenceEventCreate(StrictContract):
    """Server-side append input — no client-authoritative map fields."""

    drillId: str = Field(min_length=1)
    competencyId: CompetencyId
    quality: float = Field(ge=0, le=1)
    assessmentSource: AssessmentSource
    sourceType: str = Field(min_length=1)
    sourceId: str = Field(min_length=1)
    createdAt: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("sourceType", "sourceId")
    @classmethod
    def non_empty_trimmed(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("must not be empty")
        return trimmed

"""Versioned competency contracts; intentionally contains no scoring engine."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Dict, Optional
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
    maxStrength: Optional[float] = Field(default=None, ge=0, le=100)
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


class UserCompetencyState(StrictContract):
    schemaVersion: int = Field(default=SCHEMA_VERSION, ge=1)
    competencyId: CompetencyId
    score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=100)
    evidenceCount: int = Field(ge=0)
    breadth: float = Field(ge=0, le=100)
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

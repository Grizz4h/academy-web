"""Strict AI evidence contracts.

Variant B:
  AI → dimension scores (no authoritative quality)
  Backend → deterministic quality
  Engine → competence from quality
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import Field, field_validator

from competency.models import CompetencyId, StrictContract


class AiCompetencyDimensions(StrictContract):
    """LLM-facing dimension scores — never includes quality/score/confidence/breadth."""

    competencyId: CompetencyId
    observationGrounding: float = Field(ge=0, le=1)
    specificity: float = Field(ge=0, le=1)
    competencyAlignment: float = Field(ge=0, le=1)
    relationalReasoning: float = Field(ge=0, le=1)
    evidenceScope: float = Field(ge=0, le=1)
    uncertaintyCalibration: float = Field(ge=0, le=1)
    unsupportedClaims: float = Field(ge=0, le=1)
    outcomeBias: float = Field(ge=0, le=1)
    reasonCode: str = Field(min_length=1, max_length=64)
    notes: List[str] = Field(default_factory=list)

    @field_validator("reasonCode")
    @classmethod
    def normalize_reason(cls, value: str) -> str:
        return value.strip().lower().replace(" ", "_")

    @field_validator("notes")
    @classmethod
    def trim_notes(cls, value: List[str]) -> List[str]:
        cleaned: List[str] = []
        for item in value or []:
            text = str(item or "").strip()
            if text:
                cleaned.append(text[:240])
            if len(cleaned) >= 6:
                break
        return cleaned


class AiDimensionEvaluation(StrictContract):
    competencies: List[AiCompetencyDimensions] = Field(min_length=1)


class AiCompetencyQuality(StrictContract):
    """Engine + calibration facing row after backend aggregation."""

    competencyId: CompetencyId
    quality: float = Field(ge=0, le=1)
    specificity: float = Field(ge=0, le=1)
    evidenceAlignment: float = Field(ge=0, le=1)
    unsupportedClaims: float = Field(ge=0, le=1)
    reasonCode: str = Field(min_length=1, max_length=64)
    # Optional dimension audit (filled by aggregator; not required from legacy mocks)
    observationGrounding: Optional[float] = Field(default=None, ge=0, le=1)
    competencyAlignment: Optional[float] = Field(default=None, ge=0, le=1)
    relationalReasoning: Optional[float] = Field(default=None, ge=0, le=1)
    evidenceScope: Optional[float] = Field(default=None, ge=0, le=1)
    uncertaintyCalibration: Optional[float] = Field(default=None, ge=0, le=1)
    outcomeBias: Optional[float] = Field(default=None, ge=0, le=1)

    @field_validator("reasonCode")
    @classmethod
    def normalize_reason(cls, value: str) -> str:
        return value.strip().lower().replace(" ", "_")


class AiEvidenceEvaluation(StrictContract):
    competencies: List[AiCompetencyQuality] = Field(min_length=1)


# Provider / OpenAI strict schema — dimensions only, no quality
AI_DIMENSION_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "competencies": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "properties": {
                    "competencyId": {"type": "string"},
                    "observationGrounding": {"type": "number", "minimum": 0, "maximum": 1},
                    "specificity": {"type": "number", "minimum": 0, "maximum": 1},
                    "competencyAlignment": {"type": "number", "minimum": 0, "maximum": 1},
                    "relationalReasoning": {"type": "number", "minimum": 0, "maximum": 1},
                    "evidenceScope": {"type": "number", "minimum": 0, "maximum": 1},
                    "uncertaintyCalibration": {"type": "number", "minimum": 0, "maximum": 1},
                    "unsupportedClaims": {"type": "number", "minimum": 0, "maximum": 1},
                    "outcomeBias": {"type": "number", "minimum": 0, "maximum": 1},
                    "reasonCode": {"type": "string"},
                    "notes": {"type": "array", "items": {"type": "string"}},
                },
                "required": [
                    "competencyId",
                    "observationGrounding",
                    "specificity",
                    "competencyAlignment",
                    "relationalReasoning",
                    "evidenceScope",
                    "uncertaintyCalibration",
                    "unsupportedClaims",
                    "outcomeBias",
                    "reasonCode",
                    "notes",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["competencies"],
    "additionalProperties": False,
}

# Back-compat alias used by older imports
AI_EVIDENCE_JSON_SCHEMA = AI_DIMENSION_JSON_SCHEMA

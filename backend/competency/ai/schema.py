"""Strict AI evidence evaluation contract — quality only, no competence scores."""

from __future__ import annotations

from typing import List, Optional

from pydantic import Field, field_validator

from competency.models import CompetencyId, StrictContract


class AiCompetencyQuality(StrictContract):
    competencyId: CompetencyId
    quality: float = Field(ge=0, le=1)
    specificity: float = Field(ge=0, le=1)
    evidenceAlignment: float = Field(ge=0, le=1)
    unsupportedClaims: float = Field(ge=0, le=1)
    reasonCode: str = Field(min_length=1, max_length=64)

    @field_validator("reasonCode")
    @classmethod
    def normalize_reason(cls, value: str) -> str:
        return value.strip().lower().replace(" ", "_")


class AiEvidenceEvaluation(StrictContract):
    competencies: List[AiCompetencyQuality] = Field(min_length=1)


AI_EVIDENCE_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "competencies": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "properties": {
                    "competencyId": {"type": "string"},
                    "quality": {"type": "number", "minimum": 0, "maximum": 1},
                    "specificity": {"type": "number", "minimum": 0, "maximum": 1},
                    "evidenceAlignment": {"type": "number", "minimum": 0, "maximum": 1},
                    "unsupportedClaims": {"type": "number", "minimum": 0, "maximum": 1},
                    "reasonCode": {"type": "string"},
                },
                "required": [
                    "competencyId",
                    "quality",
                    "specificity",
                    "evidenceAlignment",
                    "unsupportedClaims",
                    "reasonCode",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["competencies"],
    "additionalProperties": False,
}

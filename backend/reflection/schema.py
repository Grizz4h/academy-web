from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class AiSessionReflection(BaseModel):
    strengths: List[str] = Field(default_factory=list, max_length=3)
    cautions: List[str] = Field(default_factory=list, max_length=3)
    alternativeInterpretation: Optional[str] = None
    nextObservationFocus: str
    reflectionQuestion: Optional[str] = None
    summary: str

    @field_validator("strengths", "cautions")
    @classmethod
    def trim_list_items(cls, value: List[str]) -> List[str]:
        cleaned = [item.strip() for item in value if isinstance(item, str) and item.strip()]
        return cleaned[:3]

    @field_validator("summary", "nextObservationFocus")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        text = (value or "").strip()
        if not text:
            raise ValueError("required text field is empty")
        return text

    @field_validator("alternativeInterpretation", "reflectionQuestion")
    @classmethod
    def trim_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        text = value.strip()
        return text or None


class ReflectionUsage(BaseModel):
    inputTokens: Optional[int] = None
    outputTokens: Optional[int] = None
    totalTokens: Optional[int] = None


class StoredAiReflection(BaseModel):
    id: str
    sessionId: str
    createdAt: str
    provider: str = "openai"
    model: str
    promptVersion: str
    content: AiSessionReflection
    usage: Optional[ReflectionUsage] = None


REFLECTION_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "strengths": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 3,
        },
        "cautions": {
            "type": "array",
            "items": {"type": "string"},
            "maxItems": 3,
        },
        "alternativeInterpretation": {"type": "string"},
        "nextObservationFocus": {"type": "string"},
        "reflectionQuestion": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": [
        "strengths",
        "cautions",
        "alternativeInterpretation",
        "nextObservationFocus",
        "reflectionQuestion",
        "summary",
    ],
    "additionalProperties": False,
}

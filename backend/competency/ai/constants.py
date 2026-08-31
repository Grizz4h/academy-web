"""Versioning and pilot drill IDs for AI competency evidence."""

from competency.ai.specs import PRODUCTION_AI_DRILLS, VALIDATION_AI_DRILLS

AI_EVALUATOR_VERSION = "ai-evidence-v2"
AI_PROMPT_VERSION = "v3"
AI_RUBRIC_VERSION = "generic-rubric-v1"
SOURCE_TYPE = "drill_submission"

# Production pilots only — validation specs exist but are not wired into checkin dispatch
MVP_AI_DRILL_IDS = frozenset(PRODUCTION_AI_DRILLS)
VALIDATION_DRILL_IDS = frozenset(VALIDATION_AI_DRILLS)

RUBRIC_B2_D5 = "B2_D5-spec-v1"
RUBRIC_A3_D2 = "A3_D2-spec-v3"
RUBRIC_B1_D1 = "B1_D1-spec-v3"
RUBRIC_B1_D2 = "B1_D2-spec-v1"
RUBRIC_B1_D3 = "B1_D3-spec-v1"
RUBRIC_B1_D4 = "B1_D4-spec-v1"
RUBRIC_B1_D5 = "B1_D5-spec-v1"
RUBRIC_E1_D1 = "E1_D1-spec-v1"
RUBRIC_E1_D5 = "E1_D5-spec-v1"
RUBRIC_C1_D5 = "C1_D5-spec-v2"
RUBRIC_C2_D5 = "C2_D5-spec-v1"
RUBRIC_C3_D5 = "C3_D5-spec-v1"
RUBRIC_D1_D5 = "D1_D5-spec-v1"
RUBRIC_D2_D5 = "D2_D5-spec-v1"
RUBRIC_D3_D5 = "D3_D5-spec-v2"
RUBRIC_E2_D1 = "E2_D1-spec-v1"
RUBRIC_E2_D2 = "E2_D2-spec-v1"
RUBRIC_E2_D3 = "E2_D3-spec-v1"
RUBRIC_E2_D4 = "E2_D4-spec-v1"
RUBRIC_E2_D5 = "E2_D5-spec-v1"
RUBRIC_E3_D1 = "E3_D1-spec-v1"
RUBRIC_E3_D2 = "E3_D2-spec-v1"
RUBRIC_E3_D3 = "E3_D3-spec-v1"
RUBRIC_E3_D4 = "E3_D4-spec-v1"
RUBRIC_E3_D5 = "E3_D5-spec-v2"

RUBRIC_VERSION_BY_DRILL = {
    "A3_D2": RUBRIC_A3_D2,
    "B1_D1": RUBRIC_B1_D1,
    "B1_D2": RUBRIC_B1_D2,
    "B1_D3": RUBRIC_B1_D3,
    "B1_D4": RUBRIC_B1_D4,
    "B1_D5": RUBRIC_B1_D5,
    "B2_D5": RUBRIC_B2_D5,
    "E1_D1": RUBRIC_E1_D1,
    "E1_D5": RUBRIC_E1_D5,
    "C1_D5": RUBRIC_C1_D5,
    "C2_D5": RUBRIC_C2_D5,
    "C3_D5": RUBRIC_C3_D5,
    "D1_D5": RUBRIC_D1_D5,
    "D2_D5": RUBRIC_D2_D5,
    "D3_D5": RUBRIC_D3_D5,
    "E2_D1": RUBRIC_E2_D1,
    "E2_D2": RUBRIC_E2_D2,
    "E2_D3": RUBRIC_E2_D3,
    "E2_D4": RUBRIC_E2_D4,
    "E2_D5": RUBRIC_E2_D5,
    "E3_D1": RUBRIC_E3_D1,
    "E3_D2": RUBRIC_E3_D2,
    "E3_D3": RUBRIC_E3_D3,
    "E3_D4": RUBRIC_E3_D4,
    "E3_D5": RUBRIC_E3_D5,
}

MIN_FREE_TEXT_CHARS = 40

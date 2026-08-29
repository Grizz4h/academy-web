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
RUBRIC_E1_D1 = "E1_D1-spec-v1"

RUBRIC_VERSION_BY_DRILL = {
    "B2_D5": RUBRIC_B2_D5,
    "E1_D1": RUBRIC_E1_D1,
}

MIN_FREE_TEXT_CHARS = 40

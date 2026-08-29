"""Versioning and pilot drill IDs for AI competency evidence (Phase 5B)."""

AI_EVALUATOR_VERSION = "ai-evidence-v1"
AI_PROMPT_VERSION = "v2"
SOURCE_TYPE = "drill_submission"

RUBRIC_B2_D5 = "B2_D5-rubric-v2"
RUBRIC_E1_D1 = "E1_D1-rubric-v2"

MVP_AI_DRILL_IDS = frozenset({"B2_D5", "E1_D1"})

RUBRIC_VERSION_BY_DRILL = {
    "B2_D5": RUBRIC_B2_D5,
    "E1_D1": RUBRIC_E1_D1,
}

MIN_FREE_TEXT_CHARS = 40

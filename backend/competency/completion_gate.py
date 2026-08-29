"""Server-side completion gate for evidence generation (curriculum-authoritative)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from competency.ai.constants import MIN_FREE_TEXT_CHARS
from competency.structured.rubrics import evaluate_a1_d2_quality, evaluate_a3_d1_quality


def _as_str(value: Any) -> str:
    return str(value or "").strip()


def _positive_int(value: Any, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return parsed if parsed > 0 else fallback


def is_submission_complete_for_evidence(
    drill_id: str,
    answers: Dict[str, Any],
    config: Dict[str, Any],
) -> bool:
    """Return True only when answers meet curriculum thresholds for evidence.

    Uses curriculum config exclusively (caller must pass curriculum-only config).
    Incomplete / manipulated submissions must not start AI or structured scoring.
    """
    drill_id = _as_str(drill_id)
    answers = answers or {}
    config = config or {}

    if drill_id == "A1_D2":
        return evaluate_a1_d2_quality(answers, config) is not None

    if drill_id == "A3_D1":
        return evaluate_a3_d1_quality(answers, config) is not None

    if drill_id == "B2_D5":
        if not _as_str(answers.get("decision_pattern")):
            return False
        reason = _as_str(answers.get("pattern_reason"))
        evidence = answers.get("pattern_evidence")
        evidence_values = (
            [_as_str(v) for v in evidence if _as_str(v)] if isinstance(evidence, list) else []
        )
        # Free text must be substantive; multi-select alone is not enough for AI pilot.
        return len(reason) >= MIN_FREE_TEXT_CHARS

    if drill_id == "E1_D1":
        logs_key = _as_str(config.get("logs_key")) or "pattern_observations"
        summary_key = _as_str(config.get("summary_key")) or "pattern_summary"
        assessment_key = _as_str(config.get("assessment_key")) or "pattern_assessment"
        min_observations = _positive_int(config.get("minObservations"), 3)
        observations = answers.get(logs_key)
        if not isinstance(observations, list) or len(observations) < min_observations:
            return False
        if not _as_str(answers.get(assessment_key)):
            return False
        return len(_as_str(answers.get(summary_key))) >= MIN_FREE_TEXT_CHARS

    return False

"""Pilot drill input extraction for AI evidence evaluation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from .constants import MIN_FREE_TEXT_CHARS, MVP_AI_DRILL_IDS


def _as_str(value: Any) -> str:
    return str(value or "").strip()


def _positive_int(value: Any, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return parsed if parsed > 0 else fallback


@dataclass(frozen=True)
class AiEvaluationInput:
    drill_id: str
    drill_title: str
    primary_text: str
    structured_context: Dict[str, Any]
    allowed_competency_ids: Set[str]
    rubric_version: str


def _label_for_option(questions: List[Dict[str, Any]], key: str, value: str) -> str:
    for question in questions:
        if question.get("key") != key:
            continue
        for option in question.get("options") or []:
            if _as_str(option.get("value")) == value:
                return _as_str(option.get("label")) or value
    return value


def _summarize_observations(observations: List[Any], *, max_items: int = 5) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for item in observations[:max_items]:
        if not isinstance(item, dict):
            continue
        rows.append(
            {
                "zone": _as_str(item.get("zone")),
                "trigger": _as_str(item.get("trigger")),
                "reaction": _as_str(item.get("reaction")),
                "sequence": _as_str(item.get("sequence")),
                "note": _as_str(item.get("note") or item.get("midLabel")),
            }
        )
    return rows


def build_b2_d5_input(
    answers: Dict[str, Any],
    drill_config: Dict[str, Any],
    *,
    allowed_competency_ids: Set[str],
    rubric_version: str,
    drill_title: str = "Beobachtungstendenzen unter Druck",
) -> Optional[AiEvaluationInput]:
    decision_pattern = _as_str(answers.get("decision_pattern"))
    if not decision_pattern:
        return None

    pattern_reason = _as_str(answers.get("pattern_reason"))
    pattern_evidence = answers.get("pattern_evidence")
    evidence_values: List[str] = []
    if isinstance(pattern_evidence, list):
        evidence_values = [_as_str(v) for v in pattern_evidence if _as_str(v)]

    if len(pattern_reason) < MIN_FREE_TEXT_CHARS and not evidence_values:
        return None

    questions = drill_config.get("questions") or []
    structured_context = {
        "decision_pattern": decision_pattern,
        "decision_pattern_label": _label_for_option(questions, "decision_pattern", decision_pattern),
        "pattern_evidence": evidence_values,
        "pattern_evidence_labels": [
            _label_for_option(questions, "pattern_evidence", value) for value in evidence_values
        ],
    }

    primary_text = pattern_reason
    if not primary_text and evidence_values:
        primary_text = "; ".join(structured_context["pattern_evidence_labels"])

    return AiEvaluationInput(
        drill_id="B2_D5",
        drill_title=drill_title,
        primary_text=primary_text,
        structured_context=structured_context,
        allowed_competency_ids=allowed_competency_ids,
        rubric_version=rubric_version,
    )


def build_e1_d1_input(
    answers: Dict[str, Any],
    drill_config: Dict[str, Any],
    *,
    allowed_competency_ids: Set[str],
    rubric_version: str,
    drill_title: str = "Wiederholt sich wirklich etwas?",
) -> Optional[AiEvaluationInput]:
    logs_key = _as_str(drill_config.get("logs_key")) or "pattern_observations"
    summary_key = _as_str(drill_config.get("summary_key")) or "pattern_summary"
    assessment_key = _as_str(drill_config.get("assessment_key")) or "pattern_assessment"
    min_observations = _positive_int(drill_config.get("minObservations"), 3)

    observations = answers.get(logs_key)
    if not isinstance(observations, list) or len(observations) < min_observations:
        return None

    pattern_summary = _as_str(answers.get(summary_key))
    if len(pattern_summary) < MIN_FREE_TEXT_CHARS:
        return None

    pattern_assessment = _as_str(answers.get(assessment_key))
    if not pattern_assessment:
        return None

    structured_context = {
        "pattern_assessment": pattern_assessment,
        "observation_count": len(observations),
        "observations": _summarize_observations(observations),
    }

    return AiEvaluationInput(
        drill_id="E1_D1",
        drill_title=drill_title,
        primary_text=pattern_summary,
        structured_context=structured_context,
        allowed_competency_ids=allowed_competency_ids,
        rubric_version=rubric_version,
    )


INPUT_BUILDER_BY_DRILL = {
    "B2_D5": build_b2_d5_input,
    "E1_D1": build_e1_d1_input,
}


def build_ai_evaluation_input(
    drill_id: str,
    answers: Dict[str, Any],
    drill_config: Dict[str, Any],
    *,
    allowed_competency_ids: Set[str],
    rubric_version: str,
    drill_title: str = "",
) -> Optional[AiEvaluationInput]:
    drill_id = _as_str(drill_id)
    if drill_id not in MVP_AI_DRILL_IDS:
        return None
    builder = INPUT_BUILDER_BY_DRILL.get(drill_id)
    if builder is None:
        return None
    return builder(
        answers or {},
        drill_config or {},
        allowed_competency_ids=allowed_competency_ids,
        rubric_version=rubric_version,
        drill_title=drill_title or drill_id,
    )

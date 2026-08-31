"""Pilot drill input extraction for AI evidence evaluation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from .constants import MIN_FREE_TEXT_CHARS, MVP_AI_DRILL_IDS
from .specs import load_drill_assessment_spec


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
    drill_assessment_spec: Dict[str, Any] = field(default_factory=dict)
    scope: str = "multi_observation"


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
                "reaction": _as_str(item.get("reaction") or item.get("teamReaction")),
                "sequence": _as_str(
                    item.get("sequence")
                    or (
                        ", ".join(
                            _as_str(v)
                            for v in (item.get("similarities") or [])
                            if _as_str(v)
                        )
                        if isinstance(item.get("similarities"), list)
                        else ""
                    )
                ),
                "note": _as_str(item.get("note") or item.get("midLabel")),
            }
        )
    return rows


def _attach_spec(evaluation: AiEvaluationInput) -> AiEvaluationInput:
    spec = load_drill_assessment_spec(evaluation.drill_id)
    if spec is None:
        return evaluation
    return AiEvaluationInput(
        drill_id=evaluation.drill_id,
        drill_title=evaluation.drill_title or spec.title,
        primary_text=evaluation.primary_text,
        structured_context=evaluation.structured_context,
        allowed_competency_ids=evaluation.allowed_competency_ids,
        rubric_version=spec.spec_version,
        drill_assessment_spec=spec.to_prompt_dict(),
        scope=spec.scope,
    )


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

    return _attach_spec(
        AiEvaluationInput(
            drill_id="B2_D5",
            drill_title=drill_title,
            primary_text=primary_text,
            structured_context=structured_context,
            allowed_competency_ids=allowed_competency_ids,
            rubric_version=rubric_version,
        )
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

    return _attach_spec(
        AiEvaluationInput(
            drill_id="E1_D1",
            drill_title=drill_title,
            primary_text=pattern_summary,
            structured_context=structured_context,
            allowed_competency_ids=allowed_competency_ids,
            rubric_version=rubric_version,
        )
    )


def build_generic_spec_input(
    drill_id: str,
    answers: Dict[str, Any],
    drill_config: Dict[str, Any],
    *,
    allowed_competency_ids: Set[str],
    rubric_version: str = "",
    drill_title: str = "",
) -> Optional[AiEvaluationInput]:
    """Production / validation drills: primary text from assessment spec keys."""
    spec = load_drill_assessment_spec(drill_id)
    if spec is None:
        return None

    # Flatten nested claim-ladder / profile bags so primaryTextKeys resolve.
    bags: List[Dict[str, Any]] = [answers or {}]
    for nest_key in ("evidenceProfile", "evidence_profile"):
        nested = (answers or {}).get(nest_key)
        if isinstance(nested, dict):
            bags.append(nested)

    b1_joined = ""
    # B1 sample_log: last sample note is the AI primary text (also join earlier notes).
    if drill_id in ("B1_D1", "B1_D2", "B1_D3", "B1_D4", "B1_D5"):
        sample_key = _as_str((drill_config or {}).get("sample_key"))
        candidate_keys = [sample_key] if sample_key else []
        candidate_keys.extend(
            (
                "support_samples",
                "triangle_samples",
                "read_samples",
                "outlet_samples",
                "timing_samples",
                "samples",
            )
        )
        samples = None
        for key in candidate_keys:
            if not key:
                continue
            value = (answers or {}).get(key)
            if isinstance(value, list) and value:
                samples = value
                break
        if isinstance(samples, list) and samples:
            last = samples[-1]
            if isinstance(last, dict):
                bags.append(last)
            parts = []
            for idx, row in enumerate(samples[:5]):
                if not isinstance(row, dict):
                    continue
                note = _as_str(row.get("note"))
                if note:
                    parts.append(f"sample[{idx}].note: {note}")
            joined = "\n".join(parts)
            if len(joined) >= MIN_FREE_TEXT_CHARS:
                b1_joined = joined

    primary_text = ""
    for key in spec.primary_text_keys:
        for bag in bags:
            candidate = _as_str(bag.get(key))
            if len(candidate) >= MIN_FREE_TEXT_CHARS:
                primary_text = candidate
                break
            if candidate and not primary_text:
                primary_text = candidate
        if len(primary_text) >= MIN_FREE_TEXT_CHARS:
            break

    if b1_joined:
        primary_text = b1_joined

    # Prefer joining claim + falsification when both present (E3)
    if drill_id == "E3_D5":
        parts: List[str] = []
        for key in ("finalClaim", "falsificationCondition", "nextObservationTest"):
            for bag in bags:
                text = _as_str(bag.get(key))
                if text:
                    parts.append(f"{key}: {text}")
                    break
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E1_D5: segment summary + tendency free-text cores
    if drill_id == "E1_D5":
        parts = []
        summary = _as_str((answers or {}).get("segment_summary"))
        if summary:
            parts.append(f"segment_summary: {summary}")
        note = _as_str((answers or {}).get("falsification_note"))
        if note:
            parts.append(f"falsification_note: {note}")
        entries = (answers or {}).get("tendency_entries")
        if isinstance(entries, list):
            for idx, entry in enumerate(entries[:3]):
                if not isinstance(entry, dict):
                    continue
                tend = _as_str(entry.get("summary"))
                evidence = _as_str(entry.get("strongestEvidence"))
                if tend or evidence:
                    parts.append(f"tendency[{idx}]: {tend} | evidence: {evidence}")
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E2_D5: segment summary + before/after change cores
    if drill_id == "E2_D5":
        parts = []
        summary = _as_str((answers or {}).get("segmentSummary"))
        if summary:
            parts.append(f"segmentSummary: {summary}")
        if (answers or {}).get("noClearAdjustment") is True:
            reason = _as_str((answers or {}).get("noAdjustmentReason"))
            if reason:
                parts.append(f"noClearAdjustment: {reason}")
        entries = (answers or {}).get("adjustment_entries")
        if isinstance(entries, list):
            for idx, entry in enumerate(entries[:2]):
                if not isinstance(entry, dict):
                    continue
                before = _as_str(entry.get("beforeBehavior"))
                after = _as_str(entry.get("changedBehavior"))
                trigger = _as_str(entry.get("triggerEvidence"))
                if before or after or trigger:
                    parts.append(
                        f"adjustment[{idx}]: before={before} | after={after} | trigger={trigger}"
                    )
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E2_D1: change summary + before/after descriptions
    if drill_id == "E2_D1":
        parts = []
        summary = _as_str((answers or {}).get("changeSummary"))
        if summary:
            parts.append(f"changeSummary: {summary}")
        for label in ("before", "after"):
            bag = (answers or {}).get(label)
            if isinstance(bag, dict):
                desc = _as_str(bag.get("description"))
                if desc:
                    parts.append(f"{label}: {desc}")
        limit = _as_str((answers or {}).get("comparabilityLimit"))
        if limit:
            parts.append(f"comparabilityLimit: {limit}")
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E2_D2: change summary + baseline + observation snippets
    if drill_id == "E2_D2":
        parts = []
        for key in ("observationFocus", "baselineDescription", "changeSummary"):
            text = _as_str((answers or {}).get(key))
            if text:
                parts.append(f"{key}: {text}")
        logs = (answers or {}).get("change_timeline_observations")
        if isinstance(logs, list):
            for idx, obs in enumerate(logs[:6]):
                if not isinstance(obs, dict):
                    continue
                desc = _as_str(obs.get("description"))
                if desc:
                    parts.append(f"obs[{idx}]: {desc}")
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E2_D3: hypothesis summary + functional link + observed change
    if drill_id == "E2_D3":
        parts = []
        for key in ("observedChange", "functionalLink", "hypothesisSummary", "alternativeDetail"):
            text = _as_str((answers or {}).get(key))
            if text:
                parts.append(f"{key}: {text}")
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E2_D4: chain summary + problem/adjustment/response descriptions
    if drill_id == "E2_D4":
        parts = []
        for key in (
            "problemDescription",
            "adjustmentDescription",
            "responseDescription",
            "chainSummary",
            "tradeoffDetail",
        ):
            text = _as_str((answers or {}).get(key))
            if text:
                parts.append(f"{key}: {text}")
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E3_D1–D3: userConclusion (+ optional alternative / confounder)
    if drill_id in ("E3_D1", "E3_D2", "E3_D3"):
        parts = []
        conclusion = _as_str((answers or {}).get("userConclusion"))
        if conclusion:
            parts.append(f"userConclusion: {conclusion}")
        if drill_id == "E3_D2":
            confounder = _as_str((answers or {}).get("possibleConfounder"))
            if confounder:
                parts.append(f"possibleConfounder: {confounder}")
        if drill_id == "E3_D3":
            alt = _as_str((answers or {}).get("alternativeExplanation"))
            if alt:
                parts.append(f"alternativeExplanation: {alt}")
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    # E3_D4: join required userStatements across evidence cases
    if drill_id == "E3_D4":
        assessments_key = _as_str((drill_config or {}).get("assessments_key") or (drill_config or {}).get("assessmentsKey")) or "evidence_assessments"
        bag = (answers or {}).get(assessments_key)
        parts = []
        if isinstance(bag, dict):
            for case_id, assessment in list(bag.items())[:6]:
                if not isinstance(assessment, dict):
                    continue
                statement = _as_str(assessment.get("userStatement"))
                if statement:
                    parts.append(f"{case_id}.userStatement: {statement}")
                strength = _as_str(assessment.get("overallStrength"))
                if strength:
                    parts.append(f"{case_id}.overallStrength: {strength}")
        joined = "\n".join(parts)
        if len(joined) >= MIN_FREE_TEXT_CHARS:
            primary_text = joined

    if len(primary_text) < MIN_FREE_TEXT_CHARS:
        return None

    # Keep a small trusted context: non-primary answer keys (truncated)
    context: Dict[str, Any] = {"drill_config_keys": sorted(str(k) for k in (drill_config or {}).keys())[:12]}
    for bag in bags:
        for key, value in bag.items():
            if key in spec.primary_text_keys:
                continue
            if isinstance(value, (str, int, float, bool)):
                context[str(key)] = value if not isinstance(value, str) else value[:200]
            elif isinstance(value, list) and len(value) <= 8:
                context[str(key)] = value

    return AiEvaluationInput(
        drill_id=spec.drill_id,
        drill_title=drill_title or spec.title,
        primary_text=primary_text,
        structured_context=context,
        allowed_competency_ids=allowed_competency_ids,
        rubric_version=rubric_version or spec.spec_version,
        drill_assessment_spec=spec.to_prompt_dict(),
        scope=spec.scope,
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
    allow_validation_drills: bool = False,
) -> Optional[AiEvaluationInput]:
    drill_id = _as_str(drill_id)
    builder = INPUT_BUILDER_BY_DRILL.get(drill_id)
    if builder is not None:
        if drill_id not in MVP_AI_DRILL_IDS and not allow_validation_drills:
            return None
        return builder(
            answers or {},
            drill_config or {},
            allowed_competency_ids=allowed_competency_ids,
            rubric_version=rubric_version,
            drill_title=drill_title or drill_id,
        )

    if drill_id in MVP_AI_DRILL_IDS or allow_validation_drills:
        return build_generic_spec_input(
            drill_id,
            answers or {},
            drill_config or {},
            allowed_competency_ids=allowed_competency_ids,
            rubric_version=rubric_version,
            drill_title=drill_title,
        )
    return None

"""Deterministic quality rubrics for MVP structured drills."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from competency.constants import QUALITY_NEUTRAL


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _as_str(value: Any) -> str:
    return str(value or "").strip()


def _positive_int(value: Any, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return parsed if parsed > 0 else fallback


def evaluate_a1_d2_quality(answers: Dict[str, Any], config: Dict[str, Any]) -> Optional[float]:
    """A1_D2 shift_tracker — completeness + spatial specificity (no correct/wrong).

    Rubric (A1_D2-rubric-v1):
    - Requires stage complete and minObservations met
    - specificity = 1 - (unsure / observationCount)
    - volume = min(1, observationCount / recommendedObservations)
    - quality = 0.5 + 0.5 * (0.6 * specificity + 0.4 * volume)
    """
    logs_key = _as_str(config.get("observations_key") or config.get("observationsKey")) or "shift_tracker_observations"
    stage_key = _as_str(config.get("stage_key") or config.get("stageKey")) or "__shift_tracker_stage"
    min_observations = _positive_int(config.get("minObservations") or config.get("min_observations"), 4)
    recommended = _positive_int(
        config.get("recommendedObservations") or config.get("recommended_observations"),
        max(min_observations, 5),
    )

    if _as_str(answers.get(stage_key)) != "complete":
        return None

    observations = answers.get(logs_key)
    if not isinstance(observations, list) or len(observations) < min_observations:
        return None

    positions: List[str] = []
    for item in observations:
        if not isinstance(item, dict):
            continue
        positions.append(_as_str(item.get("position")))

    if len(positions) < min_observations:
        return None

    if config.get("showFunctionField") or config.get("show_function_field"):
        if any(not _as_str(item.get("roleFunction")) for item in observations if isinstance(item, dict)):
            return None

    pattern_options = config.get("patternOptions") or config.get("pattern_options") or []
    pattern_key = _as_str(config.get("patternKey") or config.get("pattern_key")) or "patternNoticed"
    if pattern_options and not _as_str(answers.get(pattern_key)):
        return None

    unsure = sum(1 for position in positions if position == "unsure")
    specificity = 1.0 - (unsure / len(positions))
    volume = min(1.0, len(positions) / recommended)
    quality = QUALITY_NEUTRAL + 0.5 * ((0.6 * specificity) + (0.4 * volume))
    return _clamp01(quality)


def evaluate_a3_d1_quality(answers: Dict[str, Any], config: Dict[str, Any]) -> Optional[float]:
    """A3_D1 event_log — event volume + outcome specificity (no transition quality judgment).

    Rubric (A3_D1-rubric-v1):
    - Requires at least 3 complete events (all required select fields filled)
    - specificity = share(events where outcome != "unklar")
    - volume = min(1, completeEvents / 3)
    - quality = 0.5 + 0.5 * (0.5 * specificity + 0.5 * volume)
    """
    event_key = _as_str(config.get("event_key") or config.get("eventKey")) or "puck_win_events"
    fields = config.get("fields") if isinstance(config.get("fields"), list) else []
    required_select_keys = [
        _as_str(field.get("key"))
        for field in fields
        if isinstance(field, dict)
        and field.get("type") == "select"
        and field.get("optional") is not True
        and _as_str(field.get("key"))
    ]
    min_events = 3

    events = answers.get(event_key)
    if not isinstance(events, list):
        return None

    complete_events: List[Dict[str, Any]] = []
    for event in events:
        if not isinstance(event, dict):
            continue
        if all(_as_str(event.get(key)) for key in required_select_keys):
            complete_events.append(event)

    if len(complete_events) < min_events:
        return None

    specific = sum(
        1
        for event in complete_events
        if _as_str(event.get("outcome")).lower() != "unklar"
    )
    specificity = specific / len(complete_events)
    volume = min(1.0, len(complete_events) / min_events)
    quality = QUALITY_NEUTRAL + 0.5 * ((0.5 * specificity) + (0.5 * volume))
    return _clamp01(quality)


RUBRIC_BY_DRILL = {
    "A1_D2": evaluate_a1_d2_quality,
    "A3_D1": evaluate_a3_d1_quality,
}

RUBRIC_VERSION_BY_DRILL = {
    "A1_D2": "A1_D2-rubric-v1",
    "A3_D1": "A3_D1-rubric-v1",
}

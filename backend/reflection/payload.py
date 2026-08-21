import copy
from typing import Any, Dict, List, Optional


INTERNAL_ANSWER_PREFIX = "__"
OBSERVATION_PHASES = {"P1", "P2", "P3", "LESSON"}


def _zone_label(zone: Optional[str], config: Dict[str, Any]) -> Optional[str]:
    if not zone:
        return None
    labels = config.get("zone_labels") or {}
    return labels.get(zone) or zone


def _sanitize_coordinate(value: Any) -> Any:
    if not isinstance(value, dict):
        return value
    if "x" in value and "y" in value and len(value) <= 3:
        return None
    return value


def _sanitize_observation_item(item: Any, config: Dict[str, Any]) -> Any:
    if not isinstance(item, dict):
        return item

    cleaned = {}
    for key, value in item.items():
        if key in {"accessLocation", "location", "position"}:
            if isinstance(value, dict) and "zone" in item:
                continue
            sanitized = _sanitize_coordinate(value)
            if sanitized is not None:
                cleaned[key] = sanitized
            continue
        cleaned[key] = value

    zone = item.get("zone")
    zone_label = _zone_label(zone, config)
    if zone_label:
        cleaned["zoneLabel"] = zone_label

    return cleaned


def _sanitize_sidequest(entry: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "type": entry.get("type"),
        "category": entry.get("category"),
        "gameState": entry.get("gameState"),
        "miniDrillId": entry.get("miniDrillId"),
        "phase": entry.get("phase"),
        "answers": entry.get("answers") or {},
    }


def _sanitize_answers(answers: Dict[str, Any], drill: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(answers, dict):
        return {}

    config = drill.get("config") or {}
    cleaned: Dict[str, Any] = {}

    for key, value in answers.items():
        if key.startswith(INTERNAL_ANSWER_PREFIX):
            if key == "__session_sidequests" and isinstance(value, list):
                cleaned["sidequests"] = [_sanitize_sidequest(item) for item in value if isinstance(item, dict)]
            continue

        if isinstance(value, list):
            cleaned[key] = [_sanitize_observation_item(item, config) for item in value]
            continue

        if isinstance(value, dict):
            if "x" in value and "y" in value:
                continue
            cleaned[key] = value
            continue

        cleaned[key] = value

    return cleaned


ACCOUNT_PII_KEYS = {"user", "userId", "userid", "username", "email", "name", "account"}


def _is_anticipation_profile_drill(drill: Dict[str, Any]) -> bool:
    drill_type = str(drill.get("drill_type") or "").strip()
    mechanic = str((drill.get("config") or {}).get("mechanic") or "").strip()
    return drill_type == "anticipation_profile" or mechanic == "anticipation_profile"


def _strip_account_keys(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: _strip_account_keys(child)
            for key, child in value.items()
            if key not in ACCOUNT_PII_KEYS
        }
    if isinstance(value, list):
        return [_strip_account_keys(item) for item in value]
    return value


def _compact_anticipation_profile_answers(answers: Dict[str, Any]) -> Dict[str, Any]:
    payload = answers.get("anticipation_profile_payload")
    if isinstance(payload, dict):
        return {"anticipation_profile_payload": _strip_account_keys(payload)}
    return {}


def _extract_reflection_guidance(drill: Dict[str, Any]) -> List[str]:
    config = drill.get("config") or {}
    didactics = drill.get("didactics") or {}

    explicit = (
        config.get("reflectionGuidance")
        or didactics.get("reflectionGuidance")
        or didactics.get("reflection_guidance")
    )
    if isinstance(explicit, list) and explicit:
        return [str(item).strip() for item in explicit if str(item).strip()]

    guidance: List[str] = []
    observation_guide = didactics.get("observation_guide") or {}
    for bucket in ("what_to_watch", "how_to_decide", "ignore"):
        items = observation_guide.get(bucket) or []
        for item in items:
            text = str(item).strip()
            if text:
                guidance.append(text)

    reflection_cfg = config.get("reflection") or config.get("completion_reflection")
    if isinstance(reflection_cfg, dict):
        label = reflection_cfg.get("label")
        if label:
            guidance.append(f"Reflexionsfrage im Drill: {label}")

    decision_help = didactics.get("decision_help") or []
    for item in decision_help:
        text = str(item).strip()
        if text:
            guidance.append(text)

    ignore_list = didactics.get("ignore_list") or observation_guide.get("ignore") or []
    for item in ignore_list:
        text = str(item).strip()
        if text:
            guidance.append(f"Vorsicht vor: {text}")

    deduped: List[str] = []
    seen = set()
    for item in guidance:
        if item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped[:12]


def _learning_goal(drill: Dict[str, Any], module_learning_goals: Optional[List[str]]) -> Optional[str]:
    didactics = drill.get("didactics") or {}
    if didactics.get("goal"):
        return str(didactics["goal"])
    if module_learning_goals:
        return "; ".join(module_learning_goals[:3])
    return None


def _decision_rule(drill: Dict[str, Any]) -> Optional[str]:
    didactics = drill.get("didactics") or {}
    guide = didactics.get("observation_guide") or {}
    how_to = guide.get("how_to_decide") or didactics.get("how_to") or []
    if how_to:
        return "; ".join(str(item) for item in how_to[:4])
    return didactics.get("learning_hint")


def _mission_text(drill: Dict[str, Any]) -> Optional[str]:
    config = drill.get("config") or {}
    missions = config.get("missions") or []
    if not missions:
        return None
    first = missions[0] if isinstance(missions[0], dict) else None
    if not first:
        return None
    title = first.get("title")
    prompt = first.get("prompt")
    if title and prompt:
        return f"{title}: {prompt}"
    return prompt or title


def _opponent_name(session: Dict[str, Any]) -> Optional[str]:
    game_info = session.get("game_info") or {}
    observed = (
        session.get("observed_team_name")
        or session.get("observed_team")
        or game_info.get("observed_team")
    )
    home = game_info.get("team_home")
    away = game_info.get("team_away")
    if observed and home and away:
        if observed == home:
            return away
        if observed == away:
            return home
    if home and away:
        return f"{home} vs {away}"
    return None


def _collect_observations(session: Dict[str, Any], drill: Dict[str, Any]) -> List[Dict[str, Any]]:
    observations: List[Dict[str, Any]] = []
    for checkin in session.get("checkins") or []:
        phase = (checkin.get("phase") or "").strip().upper()
        if phase not in OBSERVATION_PHASES:
            continue
        answers = _sanitize_answers(checkin.get("answers") or {}, drill)
        if not answers:
            continue
        observations.append(
            {
                "phase": phase,
                "answers": answers,
                "timestamp": checkin.get("timestamp"),
            }
        )
    return observations


def _compact_microfeedback(session: Dict[str, Any]) -> Dict[str, Any]:
    micro = session.get("microfeedback") or {}
    compact = {}
    for phase, entry in micro.items():
        if not isinstance(entry, dict):
            continue
        text = (entry.get("text") or "").strip()
        if text:
            compact[phase] = text
    return compact


def _lab_prediction_template(
    session: Dict[str, Any],
    lab_content: Optional[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    if not lab_content:
        return None
    template_id = session.get("lab_template_id")
    if not template_id:
        return None
    for template in lab_content.get("prediction_templates") or []:
        if isinstance(template, dict) and template.get("id") == template_id:
            return template
    return None


def _drill_from_prediction_template(template: Dict[str, Any]) -> Dict[str, Any]:
    observation_guide = template.get("observationGuide") or {}
    return {
        "id": template.get("id"),
        "title": template.get("title"),
        "description": template.get("description"),
        "config": {
            "reflectionGuidance": template.get("reflectionGuidance") or [],
        },
        "didactics": {
            "goal": template.get("learningGoal"),
            "observation_guide": {
                "what_to_watch": observation_guide.get("suitableSituations") or template.get("situationGuide") or [],
                "how_to_decide": observation_guide.get("howToDecide") or template.get("coreHints") or [],
                "ignore": observation_guide.get("ignore") or [],
            },
        },
    }


def _prediction_observations(session: Dict[str, Any]) -> List[Dict[str, Any]]:
    entries = session.get("prediction_entries") or []
    if not isinstance(entries, list) or not entries:
        return []
    return [
        {
            "phase": "PREDICT",
            "answers": {
                "predictionEntries": entries,
                "predictionSummary": session.get("prediction_summary"),
                "openPredictionId": session.get("open_prediction_id"),
            },
        }
    ]


def build_reflection_payload(
    session: Dict[str, Any],
    module_learning_goals: Optional[List[str]] = None,
    lab_content: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    drills = session.get("drills") or []
    drill = copy.deepcopy(drills[0]) if drills else {}
    template = _lab_prediction_template(session, lab_content)
    if template:
        drill = _drill_from_prediction_template(template)

    observations = _collect_observations(session, drill)
    observations.extend(_prediction_observations(session))

    payload = {
        "drill": {
            "id": drill.get("id"),
            "title": drill.get("title"),
            "description": drill.get("description"),
            "learningGoal": _learning_goal(drill, module_learning_goals),
            "mission": _mission_text(drill),
            "decisionRule": _decision_rule(drill),
            "reflectionGuidance": _extract_reflection_guidance(drill),
        },
        "session": {
            "observedTeamName": session.get("observed_team_name") or session.get("observed_team"),
            "opponentName": _opponent_name(session),
            "observationScope": session.get("observation_scope"),
            "goal": session.get("goal"),
            "focus": session.get("focus"),
            "observations": observations,
            "result": session.get("post") or session.get("prediction_summary"),
            "microfeedback": _compact_microfeedback(session),
        },
    }

    if _is_anticipation_profile_drill(drill):
        compact_observations = []
        for item in observations:
            compact_observations.append(
                {
                    "phase": item.get("phase"),
                    "answers": _compact_anticipation_profile_answers(item.get("answers") or {}),
                }
            )
        payload["session"] = {"observations": compact_observations}

    return payload

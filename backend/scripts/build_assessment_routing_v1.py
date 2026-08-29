#!/usr/bin/env python3
"""Build data/academy/competency/assessment_routing.json (V1).

Re-runnable. Does not change curriculum, training map, or evidence map.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[2]
PROFILES_PATH = ROOT / "data/academy/competency/drill_profiles.json"
CURRICULUM_PATH = ROOT / "data/academy/curriculum.json"
OUT_PATH = ROOT / "data/academy/competency/assessment_routing.json"

ASSESSMENT_SOURCES = (
    "deterministic",
    "structured_only",
    "structured_plus_ai_review",
    "ai_review",
)
READINESS = (
    "READY",
    "NEEDS_SMALL_INPUT_CHANGE",
    "NEEDS_MECHANIC_CHANGE",
    "NOT_SUITABLE_FOR_AI_EVIDENCE",
)
SCOPES = (
    "single_observation",
    "single_sequence",
    "multi_observation",
    "pattern_synthesis",
    "comparative_analysis",
)
COST = ("low", "medium", "high")

# Calibrated pilot decisions — must not drift without explicit review
PILOT_OVERRIDES: Dict[str, Dict[str, Any]] = {
    "A1_D2": {
        "assessmentSource": "structured_only",
        "readiness": "NOT_SUITABLE_FOR_AI_EVIDENCE",
        "scope": "single_observation",
        "aiNeededFor": [],
        "costLatencyClass": None,
        "notes": "Shift-tracker completeness/specificity is structured-evaluable; AI not needed.",
    },
    "A3_D2": {
        "assessmentSource": "structured_plus_ai_review",
        "readiness": "NEEDS_SMALL_INPUT_CHANGE",
        "scope": "single_sequence",
        "aiNeededFor": ["specificity", "evidence_alignment", "reasoning"],
        "costLatencyClass": "low",
        "notes": "Selects carry structure; optional note ≤150 is thin — require short reaction text for AI path.",
    },
    "B1_D1": {
        "assessmentSource": "structured_plus_ai_review",
        "readiness": "NEEDS_SMALL_INPUT_CHANGE",
        "scope": "single_observation",
        "aiNeededFor": ["relational_reasoning", "specificity", "unsupported_claims"],
        "costLatencyClass": "low",
        "notes": "States/factors structured; optional note ≤120 weak for AI — raise/require note or stay structured-only later.",
    },
    "C1_D5": {
        "assessmentSource": "structured_plus_ai_review",
        "readiness": "READY",
        "scope": "pattern_synthesis",
        "aiNeededFor": ["evidence_alignment", "specificity", "unsupported_claims", "scope_calibration"],
        "costLatencyClass": "medium",
        "notes": "Required profileSummary + structured layers.",
    },
    "D3_D5": {
        "assessmentSource": "structured_plus_ai_review",
        "readiness": "READY",
        "scope": "pattern_synthesis",
        "aiNeededFor": ["evidence_alignment", "specificity", "unsupported_claims", "outcome_bias"],
        "costLatencyClass": "medium",
        "notes": "Required profileSummary + structured blue-line radios.",
    },
    "E3_D5": {
        "assessmentSource": "ai_review",
        "readiness": "READY",
        "scope": "comparative_analysis",
        "aiNeededFor": [
            "evidence_alignment",
            "specificity",
            "unsupported_claims",
            "scope_calibration",
            "outcome_bias",
            "uncertainty_calibration",
        ],
        "costLatencyClass": "high",
        "notes": "Claim ladder is primarily open analytical language.",
    },
    # Production AI pilots (not in the six, but already wired)
    "E1_D1": {
        "assessmentSource": "ai_review",
        "readiness": "READY",
        "scope": "pattern_synthesis",
        "aiNeededFor": [
            "evidence_alignment",
            "specificity",
            "unsupported_claims",
            "scope_calibration",
            "uncertainty_calibration",
        ],
        "costLatencyClass": "high",
        "notes": "Pattern summary over logs is the evidence core; production AI pilot.",
    },
    "B2_D5": {
        "assessmentSource": "structured_plus_ai_review",
        "readiness": "READY",
        "scope": "multi_observation",
        "aiNeededFor": [
            "evidence_alignment",
            "specificity",
            "reasoning",
            "unsupported_claims",
            "outcome_bias",
        ],
        "costLatencyClass": "medium",
        "notes": "Radios + pattern_reason free text; production AI pilot.",
    },
}


def _walk_curriculum(node: Any, out: Dict[str, dict]) -> None:
    if isinstance(node, dict):
        did = node.get("id")
        if isinstance(did, str) and node.get("config") is not None:
            out[did] = node
        for value in node.values():
            _walk_curriculum(value, out)
    elif isinstance(node, list):
        for item in node:
            _walk_curriculum(item, out)


def _collect_text_fields(cfg: dict) -> Tuple[List[str], List[str], Optional[int], Optional[int]]:
    """Return (required_keys, optional_keys, min_chars, max_chars)."""
    required: List[str] = []
    optional: List[str] = []
    min_chars: Optional[int] = None
    max_chars: Optional[int] = None

    def add_text(key: Optional[str], *, is_required: bool, mn: Any = None, mx: Any = None) -> None:
        nonlocal min_chars, max_chars
        if not key:
            return
        if is_required:
            required.append(str(key))
        else:
            optional.append(str(key))
        try:
            if mn is not None:
                min_chars = int(mn)
        except (TypeError, ValueError):
            pass
        try:
            if mx is not None:
                max_chars = int(mx)
        except (TypeError, ValueError):
            pass

    def walk(obj: Any) -> None:
        if isinstance(obj, dict):
            t = str(obj.get("type") or "").lower()
            key = obj.get("key")
            if t in ("text", "textarea", "longtext"):
                add_text(
                    key,
                    is_required=obj.get("required") is True,
                    mn=obj.get("min_chars") or obj.get("minLength"),
                    mx=obj.get("max_chars") or obj.get("maxLength"),
                )
            # note object shapes
            if "note" in obj and isinstance(obj["note"], dict):
                n = obj["note"]
                add_text(
                    n.get("key") or "note",
                    is_required=n.get("required") is True,
                    mn=n.get("min_chars"),
                    mx=n.get("max_chars") or n.get("maxLength"),
                )
            for value in obj.values():
                walk(value)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)

    walk(cfg)

    # Known key conventions outside typed questions
    if cfg.get("note_key") or cfg.get("noteKey"):
        add_text(
            cfg.get("note_key") or cfg.get("noteKey"),
            is_required=False,
            mx=cfg.get("note_max_chars") or cfg.get("noteMaxChars"),
        )
    if cfg.get("sample_note_key"):
        add_text(
            cfg.get("sample_note_key"),
            is_required=False,
            mx=cfg.get("sample_note_max_chars"),
        )
    if cfg.get("observation_note") and isinstance(cfg["observation_note"], dict):
        n = cfg["observation_note"]
        add_text(n.get("key") or "observationNote", is_required=False, mx=n.get("max_chars"))
    if cfg.get("closingNoteKey"):
        add_text(cfg.get("closingNoteKey"), is_required=False)

    # Synthesis keys implied by require_* flags
    if cfg.get("require_segment_summary") or cfg.get("requireSegmentSummary"):
        add_text(cfg.get("segment_summary_key") or "segment_summary", is_required=True, mn=cfg.get("summary_min_chars"))
    if cfg.get("require_summary") or cfg.get("requireSummary"):
        add_text("summary", is_required=True, mn=cfg.get("summary_min_chars"))
    if cfg.get("requireHypothesisSummary"):
        add_text("hypothesis_summary", is_required=True, mn=cfg.get("summary_min_chars"))
    if cfg.get("requireFunctionalLink"):
        add_text("functional_link", is_required=True, mn=cfg.get("functional_link_min_chars"))
    if cfg.get("summary_key") and (cfg.get("mechanic") == "pattern_log" or cfg.get("drill_type") == "pattern_log"):
        add_text(cfg.get("summary_key"), is_required=True)
    if cfg.get("falsification_note_key"):
        add_text(cfg.get("falsification_note_key"), is_required=False)

    # Deduplicate preserving order
    def uniq(items: List[str]) -> List[str]:
        seen = set()
        out: List[str] = []
        for item in items:
            if item not in seen:
                seen.add(item)
                out.append(item)
        return out

    # If a key appears as required, drop from optional
    req = uniq(required)
    opt = [k for k in uniq(optional) if k not in req]
    return req, opt, min_chars, max_chars


def _has_structured(cfg: dict, drill_type: str) -> bool:
    mech = str(cfg.get("mechanic") or drill_type or "").lower()
    if mech in {
        "shift_tracker",
        "sample_log",
        "event_log",
        "period_checkin",
        "system_observation",
        "clickable_rink_observation",
        "tactical_observation",
        "decision_analysis",
        "defensive_observation",
        "role_identification",
        "player_relation",
        "simple_structure",
        "rink_segmented_zone_observation",
        "rink_corridor_observation",
        "pattern_log",
        "pattern_condition",
        "pattern_invariant",
        "pattern_attribution",
        "tendency_profile",
        "before_after_compare",
        "change_timeline",
        "trigger_hypothesis",
        "interaction_chain",
        "adjustment_profile",
        "opportunity_rate",
        "cohort_rate_compare",
        "conditional_outcome_compare",
        "evidence_assessment",
        "claim_ladder",
    }:
        return True
    blob = json.dumps(cfg)
    return any(
        token in blob
        for token in ('"type": "select"', '"type": "radio"', '"type": "multi_select"', "options")
    )


def _default_scope(drill_id: str, mechanic: str, source: str) -> str:
    letter = drill_id[0]
    mech = mechanic.lower()
    if drill_id.endswith("_D5") and letter in "CD":
        return "pattern_synthesis"
    if mech in {"claim_ladder", "before_after_compare", "change_timeline", "trigger_hypothesis", "interaction_chain", "adjustment_profile", "opportunity_rate", "cohort_rate_compare", "conditional_outcome_compare", "evidence_assessment"}:
        return "comparative_analysis"
    if mech in {"pattern_log", "tendency_profile", "pattern_condition", "pattern_invariant", "pattern_attribution"}:
        return "pattern_synthesis"
    if mech in {"event_log"} or (letter == "A" and drill_id.startswith("A3")):
        return "single_sequence"
    if mech in {"sample_log", "decision_analysis", "period_checkin"} and source != "structured_only":
        return "multi_observation"
    if letter == "A":
        return "single_observation"
    if letter == "B":
        return "single_observation" if mech == "sample_log" else "multi_observation"
    if letter in "CD":
        return "multi_observation"
    return "multi_observation"


def _route(drill_id: str, profile: dict, node: dict) -> dict:
    if drill_id in PILOT_OVERRIDES:
        base = dict(PILOT_OVERRIDES[drill_id])
        cfg = node.get("config") or {}
        req, opt, _mn, _mx = _collect_text_fields(cfg)
        return {
            "drillId": drill_id,
            "assessmentSource": base["assessmentSource"],
            "readiness": base["readiness"],
            "scope": base["scope"],
            "existingInputs": {
                "structured": _has_structured(cfg, node.get("drill_type") or ""),
                "freeText": bool(req or opt),
                "freeTextRequired": bool(req),
                "freeTextOptional": bool(opt) and not bool(req),
            },
            "aiNeededFor": list(base["aiNeededFor"]),
            "costLatencyClass": base.get("costLatencyClass"),
            "evidenceLevel": (profile.get("evidence") or {}).get("level"),
            "maxStrength": (profile.get("evidence") or {}).get("maxStrength"),
            "notes": base["notes"],
        }

    cfg = node.get("config") or {}
    drill_type = node.get("drill_type") or ""
    mechanic = str(cfg.get("mechanic") or drill_type or "")
    req, opt, min_chars, max_chars = _collect_text_fields(cfg)
    structured = _has_structured(cfg, drill_type)
    level = int((profile.get("evidence") or {}).get("level") or 1)

    # Claim ladder / open analytical core
    if mechanic == "claim_ladder" or drill_type == "claim_ladder":
        source, readiness = "ai_review", "READY"
        ai_for = [
            "evidence_alignment",
            "specificity",
            "unsupported_claims",
            "scope_calibration",
            "outcome_bias",
            "uncertainty_calibration",
        ]
        cost = "high"
        notes = "Open claim/falsification language is the primary evidence."
    elif mechanic == "pattern_log" or (req and "pattern_summary" in req):
        source, readiness = "ai_review", "READY"
        ai_for = ["evidence_alignment", "specificity", "unsupported_claims", "scope_calibration"]
        cost = "high"
        notes = "Free-text pattern synthesis is the evidence core."
    elif any(
        k in req
        for k in (
            "profileSummary",
            "segment_summary",
            "summary",
            "hypothesis_summary",
            "functional_link",
            "finalClaim",
        )
    ) or cfg.get("requireHypothesisSummary") or cfg.get("requireFunctionalLink") or cfg.get("requireAlternativeExplanation"):
        # Synthesis / hypothesis text present
        if structured:
            source, readiness = "structured_plus_ai_review", "READY"
            ai_for = ["evidence_alignment", "specificity", "unsupported_claims", "scope_calibration"]
            cost = "medium" if level >= 4 else "low"
            notes = "Structured fields plus required qualitative synthesis."
        else:
            source, readiness = "ai_review", "READY"
            ai_for = ["evidence_alignment", "specificity", "unsupported_claims", "reasoning"]
            cost = "high"
            notes = "Required free-text synthesis without strong structured substitute."
        if cfg.get("summary_min_chars") and int(cfg.get("summary_min_chars") or 0) >= 30:
            cost = "medium" if cost == "low" else cost
        if mechanic in {"trigger_hypothesis", "adjustment_profile", "interaction_chain"}:
            cost = "high"
            ai_for = list(dict.fromkeys(ai_for + ["uncertainty_calibration", "outcome_bias", "reasoning"]))
    elif req:
        source, readiness = "structured_plus_ai_review", "READY"
        ai_for = ["evidence_alignment", "specificity", "unsupported_claims"]
        cost = "medium"
        notes = f"Required free-text keys: {', '.join(req)}."
    elif opt and structured:
        # Optional notes — prefer structured_only unless family was calibrated otherwise
        short = max_chars is not None and int(max_chars) <= 150
        if drill_id.startswith("B1_") or drill_id in {"A3_D2"}:
            # Handled by overrides for pilots; siblings follow B1 family
            source = "structured_plus_ai_review"
            readiness = "NEEDS_SMALL_INPUT_CHANGE"
            ai_for = ["specificity", "evidence_alignment", "unsupported_claims"]
            cost = "low"
            notes = "Optional short note; AI only after small required-text change — or keep structured-only."
        elif drill_id.startswith("B2_") and drill_id != "B2_D5":
            source, readiness = "structured_only", "NOT_SUITABLE_FOR_AI_EVIDENCE"
            ai_for, cost = [], None
            notes = "Decision samples aggregate structurally; optional notes not required for evidence."
        elif short or level <= 2:
            source, readiness = "structured_only", "NOT_SUITABLE_FOR_AI_EVIDENCE"
            ai_for, cost = [], None
            notes = "Structured observation sufficient; optional note is not AI-necessary."
        else:
            source, readiness = "structured_only", "NOT_SUITABLE_FOR_AI_EVIDENCE"
            ai_for, cost = [], None
            notes = "Prefer structured evidence over optional free-text AI."
    else:
        # Pure structured / no free text
        source, readiness = "structured_only", "NOT_SUITABLE_FOR_AI_EVIDENCE"
        ai_for, cost = [], None
        notes = "No qualitative free text required; use structured/deterministic rules when available."
        # E analytical structured assessors still may need semantic reading of statements
        if mechanic == "evidence_assessment":
            source = "structured_plus_ai_review"
            readiness = "NEEDS_MECHANIC_CHANGE"
            ai_for = ["evidence_alignment", "unsupported_claims", "scope_calibration"]
            cost = "medium"
            notes = "Evidence assessment cases are structured; open statement quality may need explicit free-text or stay rule-based — review before AI."
        if mechanic in {
            "before_after_compare",
            "change_timeline",
            "trigger_hypothesis",
            "interaction_chain",
            "adjustment_profile",
            "opportunity_rate",
            "cohort_rate_compare",
            "conditional_outcome_compare",
            "tendency_profile",
        } and not req:
            # These E mechanics usually embed free text via require flags; if analyzer missed, flag review
            if cfg.get("summary_min_chars"):
                source = "structured_plus_ai_review"
                readiness = "READY"
                ai_for = ["evidence_alignment", "specificity", "unsupported_claims", "uncertainty_calibration"]
                cost = "medium"
                notes = "Summary/min-char constraints imply qualitative synthesis alongside structured fields."

    # No deterministic routes in V1 — no objective ground-truth hockey answers in curriculum
    if source == "deterministic":
        source = "structured_only"

    scope = _default_scope(drill_id, mechanic, source)
    if source in ("structured_only", "deterministic"):
        cost = None
        ai_for = []
        if readiness not in READINESS:
            readiness = "NOT_SUITABLE_FOR_AI_EVIDENCE"

    return {
        "drillId": drill_id,
        "assessmentSource": source,
        "readiness": readiness,
        "scope": scope,
        "existingInputs": {
            "structured": structured,
            "freeText": bool(req or opt),
            "freeTextRequired": bool(req),
            "freeTextOptional": bool(opt) and not bool(req),
        },
        "aiNeededFor": ai_for,
        "costLatencyClass": cost,
        "evidenceLevel": (profile.get("evidence") or {}).get("level"),
        "maxStrength": (profile.get("evidence") or {}).get("maxStrength"),
        "notes": notes,
    }


def build() -> dict:
    profiles_doc = json.loads(PROFILES_PATH.read_text(encoding="utf-8"))
    profiles = {
        p["drillId"]: p
        for p in profiles_doc["profiles"]
        if (p.get("evidence") or {}).get("enabled")
    }
    curriculum: Dict[str, dict] = {}
    _walk_curriculum(json.loads(CURRICULUM_PATH.read_text(encoding="utf-8")), curriculum)

    drills: List[dict] = []
    for drill_id in sorted(profiles.keys()):
        node = curriculum.get(drill_id)
        if node is None:
            raise SystemExit(f"missing curriculum node for {drill_id}")
        drills.append(_route(drill_id, profiles[drill_id], node))

    # Post-pass: B1 family consistency with B1_D1
    b1 = next(d for d in drills if d["drillId"] == "B1_D1")
    for row in drills:
        if row["drillId"].startswith("B1_") and row["drillId"] != "B1_D1":
            row["assessmentSource"] = b1["assessmentSource"]
            row["readiness"] = b1["readiness"]
            row["scope"] = b1["scope"]
            row["aiNeededFor"] = list(b1["aiNeededFor"])
            row["costLatencyClass"] = b1["costLatencyClass"]
            row["notes"] = "B1 sample_log family aligned with B1_D1 validation routing."

    # C/D *_D5 family with profileSummary
    for row in drills:
        if row["drillId"] in PILOT_OVERRIDES:
            continue
        if row["drillId"].endswith("_D5") and row["drillId"][0] in "CD":
            row["assessmentSource"] = "structured_plus_ai_review"
            row["readiness"] = "READY"
            row["scope"] = "pattern_synthesis"
            row["aiNeededFor"] = [
                "evidence_alignment",
                "specificity",
                "unsupported_claims",
                "scope_calibration",
            ]
            row["costLatencyClass"] = "medium"
            if not row["notes"]:
                row["notes"] = "Period synthesis with required profileSummary."

    document = {
        "schemaVersion": 1,
        "principle": "Use the least powerful evaluator that can produce valid evidence.",
        "assessmentSources": list(ASSESSMENT_SOURCES),
        "readinessValues": list(READINESS),
        "scopes": list(SCOPES),
        "costLatencyClasses": list(COST),
        "privacyNote": "AI review must receive only drill-necessary inputs — never email, name, full history, or competence profile.",
        "drills": drills,
    }
    return document


def main() -> None:
    document = build()
    OUT_PATH.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts: Dict[str, int] = {}
    ready: Dict[str, int] = {}
    for row in document["drills"]:
        counts[row["assessmentSource"]] = counts.get(row["assessmentSource"], 0) + 1
        ready[row["readiness"]] = ready.get(row["readiness"], 0) + 1
    print(f"wrote {OUT_PATH} drills={len(document['drills'])}")
    print("sources", counts)
    print("readiness", ready)


if __name__ == "__main__":
    main()

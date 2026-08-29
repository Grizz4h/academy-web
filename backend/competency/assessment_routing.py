"""Load and validate assessment routing catalog (V1)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

ASSESSMENT_SOURCES = frozenset(
    {
        "deterministic",
        "structured_only",
        "structured_plus_ai_review",
        "ai_review",
    }
)
READINESS_VALUES = frozenset(
    {
        "READY",
        "NEEDS_SMALL_INPUT_CHANGE",
        "NEEDS_MECHANIC_CHANGE",
        "NOT_SUITABLE_FOR_AI_EVIDENCE",
    }
)
SCOPES = frozenset(
    {
        "single_observation",
        "single_sequence",
        "multi_observation",
        "pattern_synthesis",
        "comparative_analysis",
    }
)
COST_CLASSES = frozenset({"low", "medium", "high"})

PILOT_ROUTING = {
    "A1_D2": ("structured_only", "NOT_SUITABLE_FOR_AI_EVIDENCE"),
    "A3_D2": ("structured_plus_ai_review", "NEEDS_SMALL_INPUT_CHANGE"),
    "B1_D1": ("structured_plus_ai_review", "NEEDS_SMALL_INPUT_CHANGE"),
    "C1_D5": ("structured_plus_ai_review", "READY"),
    "D3_D5": ("structured_plus_ai_review", "READY"),
    "E3_D5": ("ai_review", "READY"),
}


def _routing_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data/academy/competency/assessment_routing.json"


def _profiles_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data/academy/competency/drill_profiles.json"


@lru_cache(maxsize=1)
def load_assessment_routing() -> Dict[str, Any]:
    return json.loads(_routing_path().read_text(encoding="utf-8"))


def clear_assessment_routing_cache() -> None:
    load_assessment_routing.cache_clear()


def routing_rows() -> List[Dict[str, Any]]:
    return list(load_assessment_routing().get("drills") or [])


def routing_by_drill_id() -> Dict[str, Dict[str, Any]]:
    return {str(row["drillId"]): row for row in routing_rows()}


def evidence_enabled_drill_ids() -> List[str]:
    document = json.loads(_profiles_path().read_text(encoding="utf-8"))
    ids = [
        str(profile["drillId"])
        for profile in document.get("profiles") or []
        if (profile.get("evidence") or {}).get("enabled")
    ]
    return sorted(ids)


def validate_assessment_routing(document: Optional[Dict[str, Any]] = None) -> List[str]:
    """Return list of validation errors (empty = ok)."""
    doc = document if document is not None else load_assessment_routing()
    errors: List[str] = []
    drills = doc.get("drills")
    if not isinstance(drills, list):
        return ["drills must be a list"]

    enabled = evidence_enabled_drill_ids()
    if len(drills) != len(enabled):
        errors.append(f"expected {len(enabled)} routing rows, found {len(drills)}")

    seen = set()
    for row in drills:
        if not isinstance(row, dict):
            errors.append("non-object drill row")
            continue
        drill_id = str(row.get("drillId") or "").strip()
        if not drill_id:
            errors.append("missing drillId")
            continue
        if drill_id in seen:
            errors.append(f"duplicate drillId {drill_id}")
        seen.add(drill_id)
        if drill_id.startswith("E4"):
            errors.append(f"E4 must not be routed: {drill_id}")

        source = row.get("assessmentSource")
        readiness = row.get("readiness")
        scope = row.get("scope")
        if source not in ASSESSMENT_SOURCES:
            errors.append(f"{drill_id}: invalid assessmentSource {source!r}")
        if readiness not in READINESS_VALUES:
            errors.append(f"{drill_id}: invalid readiness {readiness!r}")
        if scope not in SCOPES:
            errors.append(f"{drill_id}: invalid scope {scope!r}")

        ai_needed = row.get("aiNeededFor")
        if not isinstance(ai_needed, list):
            errors.append(f"{drill_id}: aiNeededFor must be a list")
            ai_needed = []
        if source in ("structured_only", "deterministic") and ai_needed:
            errors.append(f"{drill_id}: non-AI source must have aiNeededFor=[]")

        cost = row.get("costLatencyClass")
        if source in ("ai_review", "structured_plus_ai_review"):
            if cost not in COST_CLASSES:
                errors.append(f"{drill_id}: AI source needs costLatencyClass low|medium|high")
        elif cost not in (None,):
            errors.append(f"{drill_id}: non-AI source must not set costLatencyClass")

        notes = str(row.get("notes") or "")
        lowered = notes.lower()
        for banned in ("system prompt", "ignore all previous", "you are an ai", "@", "email"):
            if banned in lowered:
                errors.append(f"{drill_id}: suspicious notes content ({banned})")

        # No prompt bodies
        if "```" in notes or len(notes) > 500:
            errors.append(f"{drill_id}: notes too long or contains code fence")

    missing = sorted(set(enabled) - seen)
    extra = sorted(seen - set(enabled))
    for drill_id in missing:
        errors.append(f"missing evidence-enabled drill {drill_id}")
    for drill_id in extra:
        errors.append(f"unexpected non-enabled drill {drill_id}")

    by_id = {str(r.get("drillId")): r for r in drills if isinstance(r, dict)}
    for drill_id, (source, readiness) in PILOT_ROUTING.items():
        row = by_id.get(drill_id)
        if row is None:
            errors.append(f"missing pilot {drill_id}")
            continue
        if row.get("assessmentSource") != source or row.get("readiness") != readiness:
            errors.append(
                f"pilot regression {drill_id}: expected {source}/{readiness}, "
                f"got {row.get('assessmentSource')}/{row.get('readiness')}"
            )

    return errors

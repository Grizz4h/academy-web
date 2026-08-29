"""Load and validate AI assessment specs V1 (specification only — no runtime calls)."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from competency.assessment_routing import (
    ASSESSMENT_SOURCES,
    COST_CLASSES,
    READINESS_VALUES,
    SCOPES,
    load_assessment_routing,
)

ASSESSMENT_SPEC_VERSION = "assessment-spec-v1"

AI_SOURCES = frozenset({"structured_plus_ai_review", "ai_review"})
COMPETENCY_IDS = frozenset(
    {
        "scanning_identification",
        "roles_support",
        "space_structure",
        "options_decisions",
        "transition_tempo",
        "pressure_control",
        "systems_patterns",
        "evidence_analysis",
    }
)


def _specs_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data/academy/competency/assessment_specs.json"


def _profiles_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data/academy/competency/drill_profiles.json"


@lru_cache(maxsize=1)
def load_assessment_specs() -> Dict[str, Any]:
    return json.loads(_specs_path().read_text(encoding="utf-8"))


def clear_assessment_specs_cache() -> None:
    load_assessment_specs.cache_clear()


def assessment_spec_rows() -> List[Dict[str, Any]]:
    return list(load_assessment_specs().get("drills") or [])


def _evidence_weights_by_drill() -> Dict[str, Dict[str, float]]:
    document = json.loads(_profiles_path().read_text(encoding="utf-8"))
    out: Dict[str, Dict[str, float]] = {}
    for profile in document.get("profiles") or []:
        evidence = profile.get("evidence") or {}
        if not evidence.get("enabled"):
            continue
        weights = {
            str(k): float(v)
            for k, v in (evidence.get("weights") or {}).items()
            if float(v) > 0
        }
        out[str(profile["drillId"])] = weights
    return out


def validate_assessment_specs(document: Optional[Dict[str, Any]] = None) -> List[str]:
    doc = document if document is not None else load_assessment_specs()
    errors: List[str] = []

    if doc.get("assessmentSpecVersion") != ASSESSMENT_SPEC_VERSION:
        errors.append(f"expected assessmentSpecVersion={ASSESSMENT_SPEC_VERSION}")

    routing = load_assessment_routing()
    routing_by_id = {str(r["drillId"]): r for r in routing.get("drills") or []}
    ai_routing_ids = {
        drill_id
        for drill_id, row in routing_by_id.items()
        if row.get("assessmentSource") in AI_SOURCES
    }

    drills = doc.get("drills")
    if not isinstance(drills, list):
        return ["drills must be a list"]

    weights_by_drill = _evidence_weights_by_drill()
    seen = set()

    families = doc.get("scopeFamilies") or {}
    if set(families.keys()) != set(SCOPES):
        errors.append("scopeFamilies must cover exactly the five routing scopes")

    for row in drills:
        if not isinstance(row, dict):
            errors.append("non-object drill row")
            continue
        drill_id = str(row.get("drillId") or "").strip()
        if not drill_id:
            errors.append("missing drillId")
            continue
        if drill_id.startswith("E4"):
            errors.append(f"E4 must not appear: {drill_id}")
        if drill_id in seen:
            errors.append(f"duplicate {drill_id}")
        seen.add(drill_id)

        route = routing_by_id.get(drill_id)
        if route is None:
            errors.append(f"{drill_id}: not in assessment_routing.json")
            continue
        if route.get("assessmentSource") not in AI_SOURCES:
            errors.append(f"{drill_id}: specs must not cover structured_only/deterministic")
        if row.get("assessmentSource") != route.get("assessmentSource"):
            errors.append(f"{drill_id}: assessmentSource mismatch vs routing")
        if row.get("scope") != route.get("scope"):
            errors.append(f"{drill_id}: scope mismatch vs routing")
        if row.get("readiness") != route.get("readiness"):
            errors.append(f"{drill_id}: readiness mismatch vs routing")

        comps = row.get("competencies") or []
        if not isinstance(comps, list) or not comps:
            errors.append(f"{drill_id}: competencies required")
        else:
            allowed = set(weights_by_drill.get(drill_id) or {})
            for competency_id in comps:
                if competency_id not in COMPETENCY_IDS:
                    errors.append(f"{drill_id}: unknown competency {competency_id}")
                elif competency_id not in allowed:
                    errors.append(f"{drill_id}: competency {competency_id} not evidence-enabled")
            # Must not invent axes beyond evidence weights
            extra = set(comps) - allowed
            if extra:
                errors.append(f"{drill_id}: competencies not in evidence map: {sorted(extra)}")

        readiness = row.get("readiness")
        prod_ready = bool(row.get("productionReadyForAiEvidence"))
        if readiness == "READY" and not prod_ready:
            errors.append(f"{drill_id}: READY must set productionReadyForAiEvidence true")
        if readiness != "READY" and prod_ready:
            errors.append(f"{drill_id}: non-READY must not be productionReadyForAiEvidence")

        if readiness == "NEEDS_SMALL_INPUT_CHANGE":
            if not row.get("missingInput") or not row.get("minimalRequiredChange"):
                errors.append(f"{drill_id}: missingInput/minimalRequiredChange required")

        if drill_id == "E3_D4":
            if readiness != "NEEDS_MECHANIC_CHANGE":
                errors.append("E3_D4 must remain NEEDS_MECHANIC_CHANGE")
            if not row.get("mechanicBlocker"):
                errors.append("E3_D4 needs mechanicBlocker documentation")
            if prod_ready:
                errors.append("E3_D4 must not be production-ready")

        if drill_id in ("E1_D1", "E3_D5"):
            if row.get("assessmentSource") != "ai_review":
                errors.append(f"{drill_id}: must remain ai_review")
            if not row.get("pureAiReview"):
                errors.append(f"{drill_id}: pureAiReview block required")

        cost = row.get("costLatencyClass")
        if cost not in COST_CLASSES:
            errors.append(f"{drill_id}: invalid costLatencyClass")

        if not row.get("focus") or not row.get("mustNotInfer"):
            errors.append(f"{drill_id}: focus/mustNotInfer required")

    missing = sorted(ai_routing_ids - seen)
    extra = sorted(seen - ai_routing_ids)
    for drill_id in missing:
        errors.append(f"missing AI-routed drill spec: {drill_id}")
    for drill_id in extra:
        errors.append(f"unexpected drill not AI-routed: {drill_id}")

    # Output contract essentials
    contract = doc.get("outputContract") or {}
    llm_emits = contract.get("llmEmits") or {}
    if "insufficientInput" not in llm_emits:
        errors.append("outputContract.llmEmits.insufficientInput required")
    if doc.get("qualityDerivation", {}).get("llmAuthoritativeQuality") is not False:
        errors.append("quality must not be LLM-authoritative")

    return errors

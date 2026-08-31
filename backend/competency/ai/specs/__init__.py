"""Load competency rubrics and drill assessment specs (generic evaluator V1)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

SPECS_DIR = Path(__file__).resolve().parent
DRILLS_DIR = SPECS_DIR / "drills"

SCOPE_TYPES = frozenset(
    {
        "single_observation",
        "single_sequence",
        "multi_observation",
        "pattern_synthesis",
        "comparative_analysis",
    }
)

FREE_TEXT_READINESS = frozenset(
    {
        "READY",
        "NEEDS_SMALL_INPUT_CHANGE",
        "NOT_SUITABLE_FOR_AI_EVIDENCE",
    }
)

EVIDENCE_SOURCE_STRATEGIES = frozenset(
    {
        "deterministic_only",
        "structured_only",
        "ai_review",
        "structured_plus_ai_review",
    }
)

# Production AI checkin dispatch (expand carefully after smoke)
PRODUCTION_AI_DRILLS = frozenset(
    {
        "A3_D2",
        "B1_D1",
        "B1_D2",
        "B1_D3",
        "B1_D4",
        "B1_D5",
        "B2_D5",
        "E1_D1",
        "E1_D5",
        "C1_D5",
        "C2_D5",
        "C3_D5",
        "D1_D5",
        "D2_D5",
        "D3_D5",
        "E2_D1",
        "E2_D2",
        "E2_D3",
        "E2_D4",
        "E2_D5",
        "E3_D1",
        "E3_D2",
        "E3_D3",
        "E3_D4",
        "E3_D5",
    }
)
VALIDATION_AI_DRILLS = frozenset(
    {
        "A1_D2",  # A-recognition
        "A3_D2",  # A/B transition
        "B1_D1",  # roles-support
        "C1_D5",  # also production — kept for calibration matrix
        "D3_D5",
        "E3_D5",
    }
)
GENERIC_EVAL_DRILLS = PRODUCTION_AI_DRILLS | VALIDATION_AI_DRILLS


@dataclass(frozen=True)
class CompetencyRubric:
    competency_id: str
    strong_evidence: Tuple[str, ...]
    weak_evidence: Tuple[str, ...]


@dataclass(frozen=True)
class DrillAssessmentSpec:
    drill_id: str
    spec_version: str
    title: str
    scope: str
    primary_text_keys: Tuple[str, ...]
    evaluation_focus: Tuple[str, ...]
    required_for_strong: Tuple[str, ...]
    common_failure_modes: Tuple[str, ...]
    dimension_emphasis: Dict[str, str] = field(default_factory=dict)
    validation_only: bool = False
    primary_competencies: Tuple[str, ...] = ()
    observable_evidence: Tuple[str, ...] = ()
    fairness_note: str = ""
    free_text_readiness: str = ""
    evidence_source_recommendation: str = ""
    minimal_input_change: str = ""

    def to_prompt_dict(self) -> Dict[str, Any]:
        """Fields injected into the LLM prompt — no solution templates, no wiring metadata."""
        payload: Dict[str, Any] = {
            "drillId": self.drill_id,
            "specVersion": self.spec_version,
            "title": self.title,
            "scope": self.scope,
            "evaluationFocus": list(self.evaluation_focus),
            "requiredForStrong": list(self.required_for_strong),
            "commonFailureModes": list(self.common_failure_modes),
            "dimensionEmphasis": dict(self.dimension_emphasis),
        }
        if self.primary_competencies:
            payload["primaryCompetencies"] = list(self.primary_competencies)
        if self.observable_evidence:
            payload["observableEvidence"] = list(self.observable_evidence)
        if self.fairness_note:
            payload["fairnessNote"] = self.fairness_note
        return payload


def clear_spec_caches() -> None:
    load_competency_rubrics.cache_clear()
    load_drill_assessment_spec.cache_clear()
    list_drill_spec_ids.cache_clear()


@lru_cache(maxsize=1)
def load_competency_rubrics() -> Dict[str, CompetencyRubric]:
    path = SPECS_DIR / "competency_rubrics.json"
    document = json.loads(path.read_text(encoding="utf-8"))
    rows = document.get("competencies") or []
    out: Dict[str, CompetencyRubric] = {}
    for row in rows:
        competency_id = str(row.get("competencyId") or "").strip()
        if not competency_id:
            continue
        out[competency_id] = CompetencyRubric(
            competency_id=competency_id,
            strong_evidence=tuple(str(x) for x in (row.get("strongEvidence") or [])),
            weak_evidence=tuple(str(x) for x in (row.get("weakEvidence") or [])),
        )
    return out


@lru_cache(maxsize=1)
def list_drill_spec_ids() -> Tuple[str, ...]:
    ids = sorted(path.stem for path in DRILLS_DIR.glob("*.json"))
    return tuple(ids)


@lru_cache(maxsize=64)
def load_drill_assessment_spec(drill_id: str) -> Optional[DrillAssessmentSpec]:
    drill_id = str(drill_id or "").strip()
    path = DRILLS_DIR / f"{drill_id}.json"
    if not path.is_file():
        return None
    row = json.loads(path.read_text(encoding="utf-8"))
    scope = str(row.get("scope") or "").strip().lower()
    if scope and scope not in SCOPE_TYPES:
        raise ValueError(f"invalid scope {scope!r} in {path}")

    readiness = str(row.get("freeTextReadiness") or "").strip().upper()
    if readiness and readiness not in FREE_TEXT_READINESS:
        raise ValueError(f"invalid freeTextReadiness {readiness!r} in {path}")

    source = str(row.get("evidenceSourceRecommendation") or "").strip().lower()
    if source and source not in EVIDENCE_SOURCE_STRATEGIES:
        raise ValueError(f"invalid evidenceSourceRecommendation {source!r} in {path}")

    return DrillAssessmentSpec(
        drill_id=str(row.get("drillId") or drill_id).strip(),
        spec_version=str(row.get("specVersion") or f"{drill_id}-spec-v1").strip(),
        title=str(row.get("title") or drill_id).strip(),
        scope=scope or "multi_observation",
        primary_text_keys=tuple(str(k) for k in (row.get("primaryTextKeys") or []) if str(k).strip()),
        evaluation_focus=tuple(str(x) for x in (row.get("evaluationFocus") or [])),
        required_for_strong=tuple(str(x) for x in (row.get("requiredForStrong") or [])),
        common_failure_modes=tuple(str(x) for x in (row.get("commonFailureModes") or [])),
        dimension_emphasis={
            str(k): str(v) for k, v in (row.get("dimensionEmphasis") or {}).items()
        },
        validation_only=bool(row.get("validationOnly")),
        primary_competencies=tuple(str(x) for x in (row.get("primaryCompetencies") or []) if str(x).strip()),
        observable_evidence=tuple(str(x) for x in (row.get("observableEvidence") or []) if str(x).strip()),
        fairness_note=str(row.get("fairnessNote") or "").strip(),
        free_text_readiness=readiness,
        evidence_source_recommendation=source,
        minimal_input_change=str(row.get("minimalInputChange") or "").strip(),
    )


def competency_rubrics_for_ids(competency_ids: List[str]) -> List[Dict[str, Any]]:
    catalog = load_competency_rubrics()
    rows: List[Dict[str, Any]] = []
    for competency_id in sorted(competency_ids):
        rubric = catalog.get(competency_id)
        if rubric is None:
            rows.append(
                {
                    "competencyId": competency_id,
                    "strongEvidence": [],
                    "weakEvidence": [],
                }
            )
            continue
        rows.append(
            {
                "competencyId": rubric.competency_id,
                "strongEvidence": list(rubric.strong_evidence),
                "weakEvidence": list(rubric.weak_evidence),
            }
        )
    return rows

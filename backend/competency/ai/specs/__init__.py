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

# Production AI pilots + cross-drill validation set (not a 78-drill rollout)
PRODUCTION_AI_DRILLS = frozenset({"B2_D5", "E1_D1"})
VALIDATION_AI_DRILLS = frozenset(
    {
        "A1_D2",  # A-recognition
        "A3_D2",  # A/B transition
        "B1_D1",  # roles-support
        "C1_D5",  # C-system
        "D3_D5",  # D-transfer
        "E3_D5",  # E3-analysis
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

    def to_prompt_dict(self) -> Dict[str, Any]:
        return {
            "drillId": self.drill_id,
            "specVersion": self.spec_version,
            "title": self.title,
            "scope": self.scope,
            "evaluationFocus": list(self.evaluation_focus),
            "requiredForStrong": list(self.required_for_strong),
            "commonFailureModes": list(self.common_failure_modes),
            "dimensionEmphasis": dict(self.dimension_emphasis),
        }


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

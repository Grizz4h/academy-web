"""Competency profile read API — mapping and service layer."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from identity.context import AuthContext

from repositories.errors import StorageError

from .constants import ENGINE_VERSION
from .contracts import UserCompetencyStateRepository
from .map_context import get_frozen_evidence_map
from .models import CompetencyId, UserCompetencyState
from .service import CompetencyRecomputeService
from .taxonomy import load_taxonomy_competencies


def _status_for_state(state: UserCompetencyState) -> str:
    return "unrated" if float(state.confidence) == 0.0 else "rated"


def _null_state(competency_id: str, label: str) -> Dict[str, Any]:
    return {
        "competencyId": competency_id,
        "label": label,
        "score": 0.0,
        "confidence": 0.0,
        "breadth": 0.0,
        "evidenceCount": 0,
        "highestEvidenceLevel": 0,
        "lastEvidenceAt": None,
        "status": "unrated",
    }


def _serialize_last_evidence_at(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def map_competency_item(state: UserCompetencyState, *, label: str) -> Dict[str, Any]:
    return {
        "competencyId": str(state.competencyId),
        "label": label,
        "score": float(state.score),
        "confidence": float(state.confidence),
        "breadth": float(state.breadth),
        "evidenceCount": int(state.evidenceCount),
        "highestEvidenceLevel": int(state.highestEvidenceLevel),
        "lastEvidenceAt": _serialize_last_evidence_at(state.lastEvidenceAt),
        "status": _status_for_state(state),
    }


def build_competency_profile_response(
    states_by_id: Dict[str, UserCompetencyState],
    *,
    stale: bool,
    map_hash: str,
) -> Dict[str, Any]:
    competencies: List[Dict[str, Any]] = []
    for axis in load_taxonomy_competencies():
        competency_id = axis["id"]
        label = axis["label"]
        state = states_by_id.get(competency_id)
        if state is None:
            competencies.append(_null_state(competency_id, label))
        else:
            competencies.append(map_competency_item(state, label=label))
    return {
        "engineVersion": ENGINE_VERSION,
        "mapHash": map_hash,
        "stale": stale,
        "competencies": competencies,
    }


def compute_stale(
    projection_meta: Optional[tuple[str, Optional[str]]],
    *,
    current_engine_version: str,
    current_map_hash: str,
) -> bool:
    if projection_meta is None:
        return False
    stored_engine, stored_map = projection_meta
    if stored_engine != current_engine_version:
        return True
    if (stored_map or "") != (current_map_hash or ""):
        return True
    return False


class CompetencyProfileService:
    """Read cached competency projection; recompute on demand."""

    def __init__(
        self,
        states: UserCompetencyStateRepository,
        recompute: CompetencyRecomputeService,
    ):
        self._states = states
        self._recompute = recompute

    def get_profile(self, user: AuthContext) -> Dict[str, Any]:
        _, current_map_hash = get_frozen_evidence_map()
        stored = list(self._states.list_for_user(user))
        states_by_id = {str(state.competencyId): state for state in stored}
        meta = self._states.get_projection_metadata(user)
        stale = compute_stale(
            meta,
            current_engine_version=ENGINE_VERSION,
            current_map_hash=current_map_hash,
        )
        return build_competency_profile_response(
            states_by_id,
            stale=stale,
            map_hash=current_map_hash,
        )

    def recompute_profile(self, user: AuthContext) -> Dict[str, Any]:
        try:
            self._recompute.recompute_user(user)
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return self.get_profile(user)


def competency_profile_service_from_repos(repos) -> CompetencyProfileService:
    recompute = CompetencyRecomputeService(repos.competency_events, repos.competency_states)
    return CompetencyProfileService(repos.competency_states, recompute)

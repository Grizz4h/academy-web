"""Recompute user competency state from persisted evidence events."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Optional, Tuple

from identity.context import AuthContext

from .catalog import EvidenceMapCatalog
from .constants import ENGINE_VERSION
from .contracts import EvidenceEventRepository, UserCompetencyStateRepository
from .engine import EngineRecomputeResult, recompute_user_competencies
from .map_context import get_frozen_evidence_map
from .models import EvidenceEvent, EvidenceEventCreate


class CompetencyRecomputeService:
    """Append evidence (optional) and persist derived states from full event history."""

    def __init__(
        self,
        events: EvidenceEventRepository,
        states: UserCompetencyStateRepository,
        *,
        get_catalog: Callable[[], Tuple[EvidenceMapCatalog, str]] = get_frozen_evidence_map,
    ):
        self._events = events
        self._states = states
        self._get_catalog = get_catalog

    @property
    def events(self) -> EvidenceEventRepository:
        return self._events

    def recompute_user(self, user: AuthContext) -> EngineRecomputeResult:
        catalog, map_hash = self._get_catalog()
        event_list = list(self._events.list_for_user(user))
        result = recompute_user_competencies(event_list, catalog, map_version=map_hash)
        self._states.replace_all_for_user(
            user,
            list(result.states.values()),
            engine_version=result.engine_version,
            map_hash=map_hash,
            recomputed_at=datetime.now(timezone.utc).isoformat(),
        )
        return result

    def append_event_and_recompute(
        self,
        user: AuthContext,
        create: EvidenceEventCreate,
    ) -> Tuple[EvidenceEvent, EngineRecomputeResult]:
        appended = self._events.append(user, create)
        result = self.recompute_user(user)
        return appended, result

    def append_events_and_recompute(
        self,
        user: AuthContext,
        creates: list[EvidenceEventCreate],
    ) -> Tuple[list[EvidenceEvent], EngineRecomputeResult]:
        appended: list[EvidenceEvent] = []
        for create in creates:
            appended.append(self._events.append(user, create))
        result = self.recompute_user(user)
        return appended, result

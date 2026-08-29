"""Future persistence ports for the separate competency domain."""

from __future__ import annotations

from typing import Iterable, Optional, Protocol, Sequence
from uuid import UUID

from identity.context import AuthContext

from .models import CompetencyId, EvidenceEvent, EvidenceEventCreate, UserCompetencyState


class UserCompetencyStateRepository(Protocol):
    def get(self, user: AuthContext, competency_id: CompetencyId) -> Optional[UserCompetencyState]: ...

    def list_for_user(self, user: AuthContext) -> Iterable[UserCompetencyState]: ...

    def replace_all_for_user(
        self,
        user: AuthContext,
        states: Sequence[UserCompetencyState],
        *,
        engine_version: str,
        map_hash: Optional[str],
        recomputed_at: Optional[str] = None,
    ) -> None: ...

    def get_projection_metadata(
        self, user: AuthContext
    ) -> Optional[tuple[str, Optional[str]]]: ...

    def delete_for_user(self, user: AuthContext) -> int: ...


class EvidenceEventRepository(Protocol):
    def append(self, user: AuthContext, event: EvidenceEventCreate) -> EvidenceEvent: ...

    def get(self, user: AuthContext, event_id: UUID) -> Optional[EvidenceEvent]: ...

    def list_for_user(
        self,
        user: AuthContext,
        *,
        competency_id: Optional[CompetencyId] = None,
        drill_id: Optional[str] = None,
    ) -> Iterable[EvidenceEvent]: ...

    def exists_for_source(
        self,
        user: AuthContext,
        *,
        source_type: str,
        source_id: str,
    ) -> bool: ...

    def delete_for_user(self, user: AuthContext) -> int: ...

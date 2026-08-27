"""Future persistence ports for the separate competency domain."""

from __future__ import annotations

from typing import Iterable, Optional, Protocol

from identity.context import AuthContext

from .models import CompetencyId, EvidenceEvent, UserCompetencyState


class UserCompetencyStateRepository(Protocol):
    def get(self, user: AuthContext, competency_id: CompetencyId) -> Optional[UserCompetencyState]: ...

    def list_for_user(self, user: AuthContext) -> Iterable[UserCompetencyState]: ...

    def save(self, user: AuthContext, state: UserCompetencyState) -> UserCompetencyState: ...


class EvidenceEventRepository(Protocol):
    def append(self, user: AuthContext, event: EvidenceEvent) -> EvidenceEvent: ...

    def list_for_user(
        self, user: AuthContext, *, competency_id: Optional[CompetencyId] = None
    ) -> Iterable[EvidenceEvent]: ...

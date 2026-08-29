"""JSON EvidenceEventRepository — dev / STORAGE_BACKEND=json."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Dict, Iterable, List, Optional
from uuid import UUID, uuid4

from identity.context import AuthContext

from competency.catalog import EvidenceMapCatalog
from competency.constants import ENGINE_VERSION
from competency.engine import CompetencyEngineError, resolve_evidence_event
from competency.map_context import get_frozen_evidence_map
from competency.models import CompetencyId, EvidenceEvent, EvidenceEventCreate
from competency.persistence import event_to_storage_row, hydrate_evidence_event
from repositories.errors import RepositoryError, StorageError
from repositories.json_io import FileLock, atomic_write_json, read_json


def _events_path(get_dir: Callable[[], str], rinq_user_id: str) -> str:
    import os

    return os.path.join(get_dir(), f"{rinq_user_id}.json")


class JsonEvidenceEventRepository:
    def __init__(
        self,
        get_events_dir: Callable[[], str],
        *,
        get_catalog: Callable[[], tuple[EvidenceMapCatalog, str]] = get_frozen_evidence_map,
    ):
        self._get_dir = get_events_dir
        self._get_catalog = get_catalog
        self._lock = FileLock(get_events_dir() + ".lock")

    def _empty(self) -> Dict[str, object]:
        return {"version": 1, "events": []}

    def _load_doc(self, rinq_user_id: str) -> Dict[str, object]:
        path = _events_path(self._get_dir, rinq_user_id)
        try:
            data = read_json(path, default=self._empty())
        except FileNotFoundError:
            data = self._empty()
        if not isinstance(data, dict):
            data = self._empty()
        data.setdefault("version", 1)
        data.setdefault("events", [])
        return data

    def _save_doc(self, rinq_user_id: str, data: Dict[str, object]) -> None:
        atomic_write_json(_events_path(self._get_dir, rinq_user_id), data)

    def _catalog(self) -> EvidenceMapCatalog:
        catalog, _ = self._get_catalog()
        return catalog

    def _map_hash(self) -> Optional[str]:
        _, map_hash = self._get_catalog()
        return map_hash

    def append(self, user: AuthContext, event: EvidenceEventCreate) -> EvidenceEvent:
        catalog = self._catalog()
        created_at = event.createdAt or datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        entry = catalog.get(event.drillId, str(event.competencyId))
        if entry is None:
            if catalog.is_e4_training_only(event.drillId):
                raise RepositoryError(f"training-only drill {event.drillId} cannot produce evidence")
            raise RepositoryError(
                f"no enabled evidence mapping for drill {event.drillId} competency {event.competencyId}"
            )

        probe = EvidenceEvent(
            eventId=uuid4(),
            userId=UUID(user.rinq_user_id),
            drillId=event.drillId,
            competencyId=event.competencyId,
            quality=event.quality,
            strength=0.0,
            evidenceLevel=entry.evidence_level,
            assessmentSource=event.assessmentSource,
            createdAt=created_at,
        )
        try:
            resolved = resolve_evidence_event(probe, catalog)
        except CompetencyEngineError as exc:
            raise RepositoryError(str(exc)) from exc
        if resolved is None:
            raise RepositoryError(f"training-only drill {event.drillId} cannot produce evidence")

        with self._lock.exclusive():
            doc = self._load_doc(user.rinq_user_id)
            events: List[Dict[str, object]] = list(doc.get("events") or [])
            for row in events:
                if (
                    row.get("source_type") == event.sourceType
                    and row.get("source_id") == event.sourceId
                    and row.get("competency_id") == str(event.competencyId)
                ):
                    hydrated = hydrate_evidence_event(row, catalog=catalog)
                    if hydrated is not None:
                        return hydrated

            event_id = uuid4()
            row = event_to_storage_row(
                event_id=event_id,
                rinq_user_id=user.rinq_user_id,
                create=event,
                engine_version=ENGINE_VERSION,
                map_hash=self._map_hash(),
                created_at=created_at,
            )
            events.append(row)
            doc["events"] = events
            self._save_doc(user.rinq_user_id, doc)

        hydrated = hydrate_evidence_event(row, catalog=catalog)
        assert hydrated is not None
        return hydrated

    def get(self, user: AuthContext, event_id: UUID) -> Optional[EvidenceEvent]:
        catalog = self._catalog()
        doc = self._load_doc(user.rinq_user_id)
        for row in doc.get("events") or []:
            if str(row.get("event_id")) == str(event_id):
                return hydrate_evidence_event(row, catalog=catalog)
        return None

    def list_for_user(
        self,
        user: AuthContext,
        *,
        competency_id: Optional[CompetencyId] = None,
        drill_id: Optional[str] = None,
    ) -> Iterable[EvidenceEvent]:
        catalog = self._catalog()
        doc = self._load_doc(user.rinq_user_id)
        rows = sorted(
            doc.get("events") or [],
            key=lambda row: (str(row.get("created_at") or ""), str(row.get("event_id") or "")),
        )
        out: List[EvidenceEvent] = []
        for row in rows:
            if competency_id is not None and row.get("competency_id") != str(competency_id):
                continue
            if drill_id is not None and row.get("drill_id") != drill_id:
                continue
            hydrated = hydrate_evidence_event(row, catalog=catalog)
            if hydrated is not None:
                out.append(hydrated)
        return out

    def exists_for_source(
        self,
        user: AuthContext,
        *,
        source_type: str,
        source_id: str,
    ) -> bool:
        doc = self._load_doc(user.rinq_user_id)
        for row in doc.get("events") or []:
            if row.get("source_type") == source_type and row.get("source_id") == source_id:
                return True
        return False

    def delete_for_user(self, user: AuthContext) -> int:
        import os

        path = _events_path(self._get_dir, user.rinq_user_id)
        with self._lock.exclusive():
            if not os.path.exists(path):
                return 0
            doc = self._load_doc(user.rinq_user_id)
            count = len(doc.get("events") or [])
            os.remove(path)
            return count

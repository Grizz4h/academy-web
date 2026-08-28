"""Postgres EvidenceEventRepository."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Iterable, Optional
from uuid import UUID, uuid4

from identity.context import AuthContext
from psycopg.errors import UniqueViolation
from psycopg.types.json import Jsonb

from competency.catalog import EvidenceMapCatalog
from competency.constants import ENGINE_VERSION
from competency.engine import CompetencyEngineError, resolve_evidence_event
from competency.map_context import get_frozen_evidence_map
from competency.models import CompetencyId, EvidenceEvent, EvidenceEventCreate
from competency.persistence import hydrate_evidence_event
from db.pool import connection, transaction
from repositories.errors import RepositoryError, StorageError


class PostgresEvidenceEventRepository:
    def __init__(
        self,
        *,
        get_catalog: Callable[[], tuple[EvidenceMapCatalog, str]] = get_frozen_evidence_map,
    ):
        self._get_catalog = get_catalog

    def _catalog(self) -> EvidenceMapCatalog:
        catalog, _ = self._get_catalog()
        return catalog

    def _map_hash(self) -> Optional[str]:
        _, map_hash = self._get_catalog()
        return map_hash

    def _ensure_app_user(self, conn, user: AuthContext) -> None:
        exists = conn.execute(
            "SELECT 1 FROM app_users WHERE rinq_user_id = %s::uuid",
            (user.rinq_user_id,),
        ).fetchone()
        if exists:
            return
        conn.execute(
            """
            INSERT INTO app_users (rinq_user_id, status, legacy_username)
            VALUES (%s::uuid, 'active', %s)
            ON CONFLICT (rinq_user_id) DO NOTHING
            """,
            (user.rinq_user_id, user.legacy_username),
        )

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

        event_id = uuid4()
        try:
            with transaction() as conn:
                self._ensure_app_user(conn, user)
                conn.execute(
                    """
                    INSERT INTO evidence_events (
                      event_id, rinq_user_id, drill_id, competency_id, quality,
                      assessment_source, created_at, engine_version, map_hash,
                      source_type, source_id, metadata
                    ) VALUES (
                      %s::uuid, %s::uuid, %s, %s, %s,
                      %s, %s, %s, %s,
                      %s, %s, %s
                    )
                    """,
                    (
                        str(event_id),
                        user.rinq_user_id,
                        event.drillId,
                        str(event.competencyId),
                        float(event.quality),
                        str(event.assessmentSource),
                        created_at,
                        ENGINE_VERSION,
                        self._map_hash(),
                        event.sourceType,
                        event.sourceId,
                        Jsonb(dict(event.metadata or {})),
                    ),
                )
        except UniqueViolation:
            existing = self._get_by_source_key(
                user,
                event.sourceType,
                event.sourceId,
                str(event.competencyId),
            )
            if existing is None:
                raise StorageError("idempotency conflict without readable row")
            return existing
        except Exception as exc:
            raise StorageError(str(exc)) from exc

        row = self._fetch_row(user, event_id)
        if row is None:
            raise StorageError("evidence event insert succeeded but row not found")
        hydrated = hydrate_evidence_event(row, catalog=catalog)
        if hydrated is None:
            raise StorageError("evidence event could not be hydrated")
        return hydrated

    def _fetch_row(self, user: AuthContext, event_id: UUID) -> Optional[dict]:
        with connection() as conn:
            row = conn.execute(
                """
                SELECT event_id::text, rinq_user_id::text, drill_id, competency_id,
                       quality, assessment_source, created_at, engine_version, map_hash,
                       source_type, source_id, metadata
                FROM evidence_events
                WHERE rinq_user_id = %s::uuid AND event_id = %s::uuid
                """,
                (user.rinq_user_id, str(event_id)),
            ).fetchone()
        return dict(row) if row else None

    def _get_by_source_key(
        self,
        user: AuthContext,
        source_type: str,
        source_id: str,
        competency_id: str,
    ) -> Optional[EvidenceEvent]:
        catalog = self._catalog()
        with connection() as conn:
            row = conn.execute(
                """
                SELECT event_id::text, rinq_user_id::text, drill_id, competency_id,
                       quality, assessment_source, created_at, engine_version, map_hash,
                       source_type, source_id, metadata
                FROM evidence_events
                WHERE rinq_user_id = %s::uuid
                  AND source_type = %s
                  AND source_id = %s
                  AND competency_id = %s
                """,
                (user.rinq_user_id, source_type, source_id, competency_id),
            ).fetchone()
        if not row:
            return None
        return hydrate_evidence_event(dict(row), catalog=catalog)

    def get(self, user: AuthContext, event_id: UUID) -> Optional[EvidenceEvent]:
        row = self._fetch_row(user, event_id)
        if row is None:
            return None
        return hydrate_evidence_event(row, catalog=self._catalog())

    def list_for_user(
        self,
        user: AuthContext,
        *,
        competency_id: Optional[CompetencyId] = None,
        drill_id: Optional[str] = None,
    ) -> Iterable[EvidenceEvent]:
        catalog = self._catalog()
        clauses = ["rinq_user_id = %s::uuid"]
        params: list = [user.rinq_user_id]
        if competency_id is not None:
            clauses.append("competency_id = %s")
            params.append(str(competency_id))
        if drill_id is not None:
            clauses.append("drill_id = %s")
            params.append(drill_id)
        sql = f"""
            SELECT event_id::text, rinq_user_id::text, drill_id, competency_id,
                   quality, assessment_source, created_at, engine_version, map_hash,
                   source_type, source_id, metadata
            FROM evidence_events
            WHERE {' AND '.join(clauses)}
            ORDER BY created_at ASC, event_id ASC
        """
        try:
            with connection() as conn:
                rows = conn.execute(sql, tuple(params)).fetchall()
        except Exception as exc:
            raise StorageError(str(exc)) from exc

        out: list[EvidenceEvent] = []
        for row in rows:
            hydrated = hydrate_evidence_event(dict(row), catalog=catalog)
            if hydrated is not None:
                out.append(hydrated)
        return out

    def delete_for_user(self, user: AuthContext) -> int:
        try:
            with transaction() as conn:
                cur = conn.execute(
                    "DELETE FROM evidence_events WHERE rinq_user_id = %s::uuid",
                    (user.rinq_user_id,),
                )
                return int(cur.rowcount)
        except Exception as exc:
            raise StorageError(str(exc)) from exc

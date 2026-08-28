"""Postgres UserCompetencyStateRepository — derived cache."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, Optional, Sequence

from identity.context import AuthContext

from competency.models import CompetencyId, UserCompetencyState
from competency.persistence import row_to_user_competency_state
from db.pool import connection, transaction
from repositories.errors import StorageError


class PostgresUserCompetencyStateRepository:
    def get(self, user: AuthContext, competency_id: CompetencyId) -> Optional[UserCompetencyState]:
        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT competency_id, score, confidence, breadth, evidence_count,
                           highest_evidence_level, last_evidence_at
                    FROM user_competency_states
                    WHERE rinq_user_id = %s::uuid AND competency_id = %s
                    """,
                    (user.rinq_user_id, str(competency_id)),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return row_to_user_competency_state(dict(row)) if row else None

    def list_for_user(self, user: AuthContext) -> Iterable[UserCompetencyState]:
        try:
            with connection() as conn:
                rows = conn.execute(
                    """
                    SELECT competency_id, score, confidence, breadth, evidence_count,
                           highest_evidence_level, last_evidence_at
                    FROM user_competency_states
                    WHERE rinq_user_id = %s::uuid
                    ORDER BY competency_id
                    """,
                    (user.rinq_user_id,),
                ).fetchall()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return [row_to_user_competency_state(dict(row)) for row in rows]

    def replace_all_for_user(
        self,
        user: AuthContext,
        states: Sequence[UserCompetencyState],
        *,
        engine_version: str,
        map_hash: Optional[str],
        recomputed_at: Optional[str] = None,
    ) -> None:
        when = (
            datetime.fromisoformat(recomputed_at.replace("Z", "+00:00"))
            if recomputed_at
            else datetime.now(timezone.utc)
        )
        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
        try:
            with transaction() as conn:
                exists = conn.execute(
                    "SELECT 1 FROM app_users WHERE rinq_user_id = %s::uuid",
                    (user.rinq_user_id,),
                ).fetchone()
                if not exists:
                    raise StorageError(f"app_users row missing for {user.rinq_user_id}")
                conn.execute(
                    "DELETE FROM user_competency_states WHERE rinq_user_id = %s::uuid",
                    (user.rinq_user_id,),
                )
                for state in states:
                    last_at = state.lastEvidenceAt
                    conn.execute(
                        """
                        INSERT INTO user_competency_states (
                          rinq_user_id, competency_id, score, confidence, breadth,
                          evidence_count, highest_evidence_level, last_evidence_at,
                          engine_version, map_hash, recomputed_at
                        ) VALUES (
                          %s::uuid, %s, %s, %s, %s,
                          %s, %s, %s,
                          %s, %s, %s
                        )
                        """,
                        (
                            user.rinq_user_id,
                            str(state.competencyId),
                            float(state.score),
                            float(state.confidence),
                            float(state.breadth),
                            int(state.evidenceCount),
                            int(state.highestEvidenceLevel),
                            last_at,
                            engine_version,
                            map_hash,
                            when,
                        ),
                    )
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def delete_for_user(self, user: AuthContext) -> int:
        try:
            with transaction() as conn:
                cur = conn.execute(
                    "DELETE FROM user_competency_states WHERE rinq_user_id = %s::uuid",
                    (user.rinq_user_id,),
                )
                return int(cur.rowcount)
        except Exception as exc:
            raise StorageError(str(exc)) from exc

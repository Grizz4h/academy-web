"""SessionRepository on Postgres."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from identity.context import AuthContext
from identity.migrate import owners_match
from identity.store import normalize_subject
from psycopg.types.json import Jsonb

from db.pool import connection, transaction
from repositories.errors import NotFoundError, StorageError
from repositories.pg_mapping import merge_session_row, parse_timestamptz, split_session


def _resolve_owner_uuid(conn, session: Dict[str, Any]) -> str:
    raw = str(session.get("user") or "").strip()
    if not raw:
        raise ValueError("session.user required")
    try:
        UUID(raw)
        exists = conn.execute(
            "SELECT 1 FROM app_users WHERE rinq_user_id = %s::uuid",
            (raw,),
        ).fetchone()
        if exists:
            return raw
    except ValueError:
        pass
    key = normalize_subject(raw)
    row = conn.execute(
        "SELECT rinq_user_id::text FROM app_users WHERE legacy_username = %s",
        (key,),
    ).fetchone()
    if not row:
        raise ValueError(f"cannot resolve session owner to rinq_user_id: {raw}")
    return row["rinq_user_id"]


class PostgresSessionRepository:
    """Filesystem path helpers return None / empty — callers must use document APIs."""

    def build_storage_path(self, session_id: str, created_at: Optional[str]) -> str:
        return f"postgres:sessions/{session_id}"

    def find_session_path(self, session_id: str) -> Optional[str]:
        if self.find_session_raw(session_id):
            return f"postgres:sessions/{session_id}"
        return None

    def iter_session_paths(self):
        return iter(())

    def create_session(self, session: Dict[str, Any]) -> Dict[str, Any]:
        session_id = str(session.get("id") or "").strip()
        if not session_id:
            raise ValueError("session.id required")
        try:
            with transaction() as conn:
                owner = _resolve_owner_uuid(conn, session)
                doc = {**session, "user": owner}
                cols, _ = split_session(doc)
                if not cols["created_at"]:
                    cols["created_at"] = datetime.now(timezone.utc)
                conn.execute(
                    """
                    INSERT INTO sessions (
                      session_id, rinq_user_id, state, module_id, drill_id,
                      observation_scope, learning_area, lab_mode, session_method,
                      focus, observed_team, is_dummy, current_phase,
                      created_at, updated_at, completed_at, payload
                    ) VALUES (
                      %s, %s::uuid, %s, %s, %s,
                      %s, %s, %s, %s,
                      %s, %s, %s, %s,
                      %s, %s, %s, %s
                    )
                    ON CONFLICT (session_id) DO UPDATE SET
                      rinq_user_id = EXCLUDED.rinq_user_id,
                      state = EXCLUDED.state,
                      module_id = EXCLUDED.module_id,
                      drill_id = EXCLUDED.drill_id,
                      observation_scope = EXCLUDED.observation_scope,
                      learning_area = EXCLUDED.learning_area,
                      lab_mode = EXCLUDED.lab_mode,
                      session_method = EXCLUDED.session_method,
                      focus = EXCLUDED.focus,
                      observed_team = EXCLUDED.observed_team,
                      is_dummy = EXCLUDED.is_dummy,
                      current_phase = EXCLUDED.current_phase,
                      updated_at = EXCLUDED.updated_at,
                      completed_at = EXCLUDED.completed_at,
                      payload = EXCLUDED.payload
                    """,
                    (
                        cols["session_id"],
                        owner,
                        cols["state"],
                        cols["module_id"],
                        cols["drill_id"],
                        cols["observation_scope"],
                        cols["learning_area"],
                        cols["lab_mode"],
                        cols["session_method"],
                        cols["focus"],
                        cols["observed_team"],
                        cols["is_dummy"],
                        cols["current_phase"],
                        cols["created_at"],
                        cols["updated_at"],
                        cols["completed_at"],
                        Jsonb(cols["payload"]),
                    ),
                )
                return doc
        except ValueError:
            raise
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def find_session_raw(self, session_id: str) -> Optional[Dict[str, Any]]:
        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT session_id, rinq_user_id, state, module_id, drill_id,
                           observation_scope, learning_area, lab_mode, session_method,
                           focus, observed_team, is_dummy, current_phase,
                           created_at, updated_at, completed_at, payload
                    FROM sessions WHERE session_id = %s
                    """,
                    (session_id,),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not row:
            return None
        return merge_session_row(row)

    def get_session_for_user(self, session_id: str, owner: AuthContext) -> Dict[str, Any]:
        session = self.find_session_raw(session_id)
        if not session or not self._owned(session, owner):
            raise NotFoundError("Session not found")
        return session

    def list_sessions_for_user(
        self, owner: AuthContext, *, state: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        try:
            with connection() as conn:
                if state:
                    rows = conn.execute(
                        """
                        SELECT session_id, rinq_user_id, state, module_id, drill_id,
                               observation_scope, learning_area, lab_mode, session_method,
                               focus, observed_team, is_dummy, current_phase,
                               created_at, updated_at, completed_at, payload
                        FROM sessions
                        WHERE rinq_user_id = %s::uuid AND state = %s
                        ORDER BY created_at DESC
                        """,
                        (owner.rinq_user_id, state),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """
                        SELECT session_id, rinq_user_id, state, module_id, drill_id,
                               observation_scope, learning_area, lab_mode, session_method,
                               focus, observed_team, is_dummy, current_phase,
                               created_at, updated_at, completed_at, payload
                        FROM sessions
                        WHERE rinq_user_id = %s::uuid
                        ORDER BY created_at DESC
                        """,
                        (owner.rinq_user_id,),
                    ).fetchall()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        # Also include legacy-username-owned rows if any slipped in pre-normalization
        sessions = [merge_session_row(r) for r in rows]
        if owner.legacy_username:
            extra = [
                s
                for s in sessions
                if owners_match(s.get("user") or "", owner.rinq_user_id, owner.legacy_username)
            ]
            return extra if extra else sessions
        return sessions

    def save_session(self, session: Dict[str, Any]) -> Dict[str, Any]:
        return self.create_session(session)

    def delete_session_for_user(self, session_id: str, owner: AuthContext) -> bool:
        self.get_session_for_user(session_id, owner)  # ownership / 404
        try:
            with transaction() as conn:
                cur = conn.execute(
                    "DELETE FROM sessions WHERE session_id = %s AND rinq_user_id = %s::uuid",
                    (session_id, owner.rinq_user_id),
                )
                return cur.rowcount > 0
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def _owned(self, session: Dict[str, Any], owner: AuthContext) -> bool:
        return owners_match(
            session.get("user") or "",
            owner.rinq_user_id,
            owner.legacy_username,
        )

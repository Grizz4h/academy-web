"""RewardRepository on Postgres — apply_reward_delta uses row lock + transaction."""

from __future__ import annotations

from typing import Any, Callable, Dict, Optional, Tuple, TypeVar

from identity.context import AuthContext
from psycopg.types.json import Jsonb

from db.pool import connection, transaction
from repositories.errors import StorageError
from repositories.json_reward import create_default_reward_state, merge_reward_state
from repositories.pg_mapping import merge_reward_row, split_reward

T = TypeVar("T")


class PostgresRewardRepository:
    def get_reward_state(self, user: AuthContext) -> Dict[str, Any]:
        from progression.cosmetic_cleanup import purge_removed_from_reward_state

        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT rinq_user_id::text, xp, pux, progression_pux_granted,
                           payload, bootstrap_completed_at, last_updated_at
                    FROM reward_states WHERE rinq_user_id = %s::uuid
                    """,
                    (user.rinq_user_id,),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not row:
            return create_default_reward_state()
        state = merge_reward_state(merge_reward_row(row))
        if purge_removed_from_reward_state(state):
            self.save_reward_state(user, state)
        return state

    def save_reward_state(self, user: AuthContext, state: Dict[str, Any]) -> None:
        cols = split_reward(merge_reward_state(state))
        try:
            with transaction() as conn:
                self._ensure_user(conn, user)
                self._upsert(conn, user.rinq_user_id, cols)
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def apply_reward_delta(
        self,
        user: AuthContext,
        mutator: Callable[[Dict[str, Any]], Tuple[Optional[Dict[str, Any]], T]],
    ) -> T:
        try:
            with transaction() as conn:
                self._ensure_user(conn, user)
                row = conn.execute(
                    """
                    SELECT rinq_user_id::text, xp, pux, progression_pux_granted,
                           payload, bootstrap_completed_at, last_updated_at
                    FROM reward_states
                    WHERE rinq_user_id = %s::uuid
                    FOR UPDATE
                    """,
                    (user.rinq_user_id,),
                ).fetchone()
                if row:
                    state = merge_reward_state(merge_reward_row(row))
                else:
                    state = create_default_reward_state()
                new_state, result = mutator(state)
                if new_state is not None:
                    cols = split_reward(merge_reward_state(new_state))
                    self._upsert(conn, user.rinq_user_id, cols)
                return result
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def delete_reward_state(self, user: AuthContext) -> bool:
        try:
            with transaction() as conn:
                cur = conn.execute(
                    "DELETE FROM reward_states WHERE rinq_user_id = %s::uuid",
                    (user.rinq_user_id,),
                )
                return cur.rowcount > 0
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def _ensure_user(self, conn, user: AuthContext) -> None:
        exists = conn.execute(
            "SELECT 1 FROM app_users WHERE rinq_user_id = %s::uuid",
            (user.rinq_user_id,),
        ).fetchone()
        if not exists:
            conn.execute(
                """
                INSERT INTO app_users (rinq_user_id, status, legacy_username)
                VALUES (%s::uuid, 'active', %s)
                ON CONFLICT (rinq_user_id) DO NOTHING
                """,
                (user.rinq_user_id, user.legacy_username),
            )

    def _upsert(self, conn, rinq_user_id: str, cols: Dict[str, Any]) -> None:
        conn.execute(
            """
            INSERT INTO reward_states (
              rinq_user_id, xp, pux, progression_pux_granted, payload,
              bootstrap_completed_at, last_updated_at
            ) VALUES (%s::uuid, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (rinq_user_id) DO UPDATE SET
              xp = EXCLUDED.xp,
              pux = EXCLUDED.pux,
              progression_pux_granted = EXCLUDED.progression_pux_granted,
              payload = EXCLUDED.payload,
              bootstrap_completed_at = EXCLUDED.bootstrap_completed_at,
              last_updated_at = EXCLUDED.last_updated_at
            """,
            (
                rinq_user_id,
                cols["xp"],
                cols["pux"],
                cols["progression_pux_granted"],
                Jsonb(cols["payload"]),
                cols["bootstrap_completed_at"],
                cols["last_updated_at"],
            ),
        )

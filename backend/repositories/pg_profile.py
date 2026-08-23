"""ProfileRepository on Postgres."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from identity.context import AuthContext
from psycopg.types.json import Jsonb

from db.pool import connection, transaction
from repositories.errors import StorageError
from repositories.json_profile import default_user_profile
from repositories.pg_mapping import merge_profile_row, split_profile


class PostgresProfileRepository:
    def get_profile(self, user: AuthContext) -> Dict[str, Any]:
        seed = user.display_name or user.legacy_username or user.rinq_user_id
        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT rinq_user_id::text, display_name, display_name_chosen,
                           payload, updated_at
                    FROM profiles WHERE rinq_user_id = %s::uuid
                    """,
                    (user.rinq_user_id,),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not row:
            return default_user_profile(seed)
        return merge_profile_row(row)

    def create_default_profile(self, user: AuthContext, display_seed: str) -> Dict[str, Any]:
        return self.save_profile(user, default_user_profile(display_seed))

    def update_display_name(self, user: AuthContext, display_name: str) -> Dict[str, Any]:
        profile = self.get_profile(user)
        profile["displayName"] = display_name
        profile["displayNameChosen"] = True
        profile["updatedAt"] = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
        return self.save_profile(user, profile)

    def save_profile(self, user: AuthContext, profile: Dict[str, Any]) -> Dict[str, Any]:
        out = dict(profile or {})
        out["updatedAt"] = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
        display, chosen, payload, updated = split_profile(out)
        try:
            with transaction() as conn:
                # Ensure parent identity exists for FK (migration/import should pre-create).
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
                conn.execute(
                    """
                    INSERT INTO profiles (
                      rinq_user_id, display_name, display_name_chosen, payload, updated_at
                    ) VALUES (%s::uuid, %s, %s, %s, %s)
                    ON CONFLICT (rinq_user_id) DO UPDATE SET
                      display_name = EXCLUDED.display_name,
                      display_name_chosen = EXCLUDED.display_name_chosen,
                      payload = EXCLUDED.payload,
                      updated_at = EXCLUDED.updated_at
                    """,
                    (user.rinq_user_id, display, chosen, Jsonb(payload), updated),
                )
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return out

    def delete_profile(self, user: AuthContext) -> bool:
        try:
            with transaction() as conn:
                cur = conn.execute(
                    "DELETE FROM profiles WHERE rinq_user_id = %s::uuid",
                    (user.rinq_user_id,),
                )
                return cur.rowcount > 0
        except Exception as exc:
            raise StorageError(str(exc)) from exc

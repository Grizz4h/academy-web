"""UserCredentialRepository on Postgres (legacy_credentials)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from identity.store import normalize_subject

from db.pool import connection, transaction
from repositories.errors import StorageError
from repositories.pg_mapping import parse_timestamptz


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


class PostgresUserCredentialRepository:
    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        key = normalize_subject(username)
        if not key:
            return None
        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT rinq_user_id::text, username, password_hash, role,
                           created_at, updated_at, password_updated_at
                    FROM legacy_credentials WHERE username = %s
                    """,
                    (key,),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not row:
            return None
        return self._to_record(row)

    def get_password_hash(self, username: str) -> Optional[str]:
        row = self.get_by_username(username)
        if not row:
            return None
        value = row.get("password_hash")
        return str(value) if value is not None else None

    def list_users(self) -> List[Dict[str, Any]]:
        try:
            with connection() as conn:
                rows = conn.execute(
                    """
                    SELECT rinq_user_id::text, username, password_hash, role,
                           created_at, updated_at, password_updated_at
                    FROM legacy_credentials ORDER BY username
                    """
                ).fetchall()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return [self._to_record(r) for r in rows]

    def upsert_user(self, record: Dict[str, Any]) -> Dict[str, Any]:
        try:
            with transaction() as conn:
                return self._upsert_user_on_conn(conn, record)
        except ValueError:
            raise
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def _upsert_user_on_conn(self, conn, record: Dict[str, Any]) -> Dict[str, Any]:
        key = normalize_subject(record.get("username") or "")
        if not key:
            raise ValueError("username required")
        password_hash = record.get("password_hash")
        if not password_hash:
            raise ValueError("password_hash required")
        rinq = (record.get("rinq_user_id") or "").strip()
        if not rinq:
            found = conn.execute(
                "SELECT rinq_user_id::text FROM app_users WHERE legacy_username = %s",
                (key,),
            ).fetchone()
            if not found:
                raise ValueError(
                    f"no app_users row for legacy username={key}; "
                    "ensure identity before credential upsert"
                )
            rinq = found["rinq_user_id"]
        created = parse_timestamptz(record.get("created_at")) or _utc_now()
        updated = parse_timestamptz(record.get("updated_at")) or _utc_now()
        pwd_updated = parse_timestamptz(record.get("password_updated_at"))
        conn.execute(
            """
            INSERT INTO legacy_credentials (
              rinq_user_id, username, password_hash, role,
              created_at, updated_at, password_updated_at
            ) VALUES (%s::uuid, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (username) DO UPDATE SET
              password_hash = EXCLUDED.password_hash,
              role = COALESCE(EXCLUDED.role, legacy_credentials.role),
              updated_at = EXCLUDED.updated_at,
              password_updated_at = COALESCE(
                EXCLUDED.password_updated_at, legacy_credentials.password_updated_at
              ),
              rinq_user_id = EXCLUDED.rinq_user_id
            """,
            (
                rinq,
                key,
                str(password_hash),
                record.get("role"),
                created,
                updated,
                pwd_updated,
            ),
        )
        row = conn.execute(
            """
            SELECT rinq_user_id::text, username, password_hash, role,
                   created_at, updated_at, password_updated_at
            FROM legacy_credentials WHERE username = %s
            """,
            (key,),
        ).fetchone()
        return self._to_record(row)

    def delete_legacy_credential(self, username: str) -> bool:
        key = normalize_subject(username)
        if not key:
            return False
        try:
            with transaction() as conn:
                cur = conn.execute(
                    "DELETE FROM legacy_credentials WHERE username = %s",
                    (key,),
                )
                return cur.rowcount > 0
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def load_bundle(self) -> Dict[str, Any]:
        return {"users": self.list_users()}

    def save_bundle(self, data: Dict[str, Any]) -> None:
        users = (data or {}).get("users") or []
        if not users:
            return
        try:
            with transaction() as conn:
                for record in users:
                    if isinstance(record, dict):
                        self._upsert_user_on_conn(conn, record)
        except ValueError:
            raise
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def _to_record(self, row: Dict[str, Any]) -> Dict[str, Any]:
        out: Dict[str, Any] = {
            "username": row["username"],
            "password_hash": row["password_hash"],
            "created_at": _iso(row.get("created_at")),
            "rinq_user_id": row.get("rinq_user_id"),
        }
        if row.get("role") is not None:
            out["role"] = row["role"]
        if row.get("updated_at") is not None:
            out["updated_at"] = _iso(row["updated_at"])
        if row.get("password_updated_at") is not None:
            out["password_updated_at"] = _iso(row["password_updated_at"])
        return out

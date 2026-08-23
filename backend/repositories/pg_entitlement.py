"""EntitlementRepository on Postgres (entitlement_grants)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from psycopg.types.json import Jsonb

from db.pool import connection, transaction
from entitlements.feature_keys import validate_feature_key, validate_grant_source
from entitlements.models import EntitlementGrant, grant_from_dict, is_grant_active
from repositories.errors import NotFoundError, StorageError
from repositories.pg_mapping import parse_timestamptz


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def _row_to_grant(row: Dict[str, Any]) -> EntitlementGrant:
    return EntitlementGrant(
        id=str(row["id"]),
        rinq_user_id=str(row["rinq_user_id"]),
        feature_key=str(row["feature_key"]),
        status=str(row["status"]),
        source=str(row["source"]),
        created_at=_iso(row.get("created_at")),
        updated_at=_iso(row.get("updated_at")),
        expires_at=_iso(row.get("expires_at")),
        metadata=dict(row.get("metadata") or {}),
    )


class PostgresEntitlementRepository:
    def has_access(self, rinq_user_id: str, feature_key: str) -> bool:
        key = validate_feature_key(feature_key)
        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT id::text, rinq_user_id::text, feature_key, status, source,
                           created_at, updated_at, expires_at, metadata
                    FROM entitlement_grants
                    WHERE rinq_user_id = %s::uuid AND feature_key = %s
                    """,
                    (rinq_user_id, key),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not row:
            return False
        return is_grant_active(_row_to_grant(row))

    def grant_entitlement(
        self,
        rinq_user_id: str,
        feature_key: str,
        *,
        source: str,
        expires_at: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        key = validate_feature_key(feature_key)
        src = validate_grant_source(source)
        expires = parse_timestamptz(expires_at)
        meta = dict(metadata or {})
        now = _utc_now()
        try:
            with transaction() as conn:
                exists = conn.execute(
                    "SELECT 1 FROM app_users WHERE rinq_user_id = %s::uuid",
                    (rinq_user_id,),
                ).fetchone()
                if not exists:
                    raise NotFoundError(f"unknown rinq_user_id={rinq_user_id}")

                row = conn.execute(
                    """
                    INSERT INTO entitlement_grants (
                      id, rinq_user_id, feature_key, status, source,
                      created_at, updated_at, expires_at, metadata
                    ) VALUES (%s::uuid, %s::uuid, %s, 'active', %s, %s, %s, %s, %s)
                    ON CONFLICT (rinq_user_id, feature_key) DO UPDATE SET
                      status = 'active',
                      source = EXCLUDED.source,
                      updated_at = EXCLUDED.updated_at,
                      expires_at = EXCLUDED.expires_at,
                      metadata = EXCLUDED.metadata
                    RETURNING id::text, rinq_user_id::text, feature_key, status, source,
                              created_at, updated_at, expires_at, metadata
                    """,
                    (
                        str(uuid4()),
                        rinq_user_id,
                        key,
                        src,
                        now,
                        now,
                        expires,
                        Jsonb(meta),
                    ),
                ).fetchone()
        except NotFoundError:
            raise
        except ValueError as exc:
            raise StorageError(str(exc)) from exc
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return _row_to_grant(row).to_dict()

    def revoke_entitlement(self, rinq_user_id: str, feature_key: str) -> bool:
        key = validate_feature_key(feature_key)
        try:
            with transaction() as conn:
                cur = conn.execute(
                    """
                    UPDATE entitlement_grants
                    SET status = 'revoked', updated_at = %s
                    WHERE rinq_user_id = %s::uuid AND feature_key = %s AND status = 'active'
                    """,
                    (_utc_now(), rinq_user_id, key),
                )
                return cur.rowcount > 0
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def list_user_entitlements(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        try:
            with connection() as conn:
                rows = conn.execute(
                    """
                    SELECT id::text, rinq_user_id::text, feature_key, status, source,
                           created_at, updated_at, expires_at, metadata
                    FROM entitlement_grants
                    WHERE rinq_user_id = %s::uuid
                    ORDER BY feature_key
                    """,
                    (rinq_user_id,),
                ).fetchall()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return [_row_to_grant(r).to_dict() for r in rows]

    def get_active_entitlements(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        grants = [grant_from_dict(g) for g in self.list_user_entitlements(rinq_user_id)]
        return [g.to_dict() for g in grants if is_grant_active(g)]

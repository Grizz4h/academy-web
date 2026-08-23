"""IdentityRepository on Postgres (app_users + auth_links)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from identity.context import AuthContext, LEGACY_PASSWORD_PROVIDER
from identity.store import normalize_subject
from psycopg.errors import UniqueViolation

from db.pool import connection, transaction
from repositories.errors import ConflictError, DuplicateAuthLinkError, NotFoundError, StorageError
from repositories.pg_mapping import parse_timestamptz


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


class PostgresIdentityRepository:
    def get_identity_by_user_id(self, rinq_user_id: str) -> Optional[Dict[str, Any]]:
        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT rinq_user_id::text, created_at, status, legacy_username
                    FROM app_users WHERE rinq_user_id = %s::uuid
                    """,
                    (rinq_user_id,),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not row:
            return None
        return {
            "rinq_user_id": row["rinq_user_id"],
            "created_at": _iso(row["created_at"]),
            "status": row["status"],
            "legacy_username": row["legacy_username"],
        }

    def find_auth_link(self, provider: str, provider_subject: str) -> Optional[Dict[str, Any]]:
        subject = normalize_subject(provider_subject)
        try:
            with connection() as conn:
                row = conn.execute(
                    """
                    SELECT id::text, rinq_user_id::text, provider, provider_subject, linked_at
                    FROM auth_links
                    WHERE provider = %s AND provider_subject = %s
                    """,
                    (provider, subject),
                ).fetchone()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        if not row:
            return None
        return {
            "rinq_user_id": row["rinq_user_id"],
            "provider": row["provider"],
            "provider_subject": row["provider_subject"],
            "linked_at": _iso(row["linked_at"]),
            "id": row["id"],
        }

    def create_auth_link(
        self,
        rinq_user_id: str,
        provider: str,
        provider_subject: str,
        *,
        allow_reclaim_orphan: bool = False,
    ) -> Dict[str, Any]:
        subject = normalize_subject(provider_subject)
        if not provider or not subject:
            raise ValueError("provider and provider_subject required")
        try:
            with transaction() as conn:
                identity = conn.execute(
                    "SELECT rinq_user_id::text, legacy_username FROM app_users WHERE rinq_user_id = %s::uuid",
                    (rinq_user_id,),
                ).fetchone()
                if not identity:
                    raise NotFoundError(f"unknown rinq_user_id={rinq_user_id}")

                existing = conn.execute(
                    """
                    SELECT id::text, rinq_user_id::text, provider, provider_subject, linked_at
                    FROM auth_links WHERE provider = %s AND provider_subject = %s
                    FOR UPDATE
                    """,
                    (provider, subject),
                ).fetchone()
                if existing:
                    if existing["rinq_user_id"] == rinq_user_id:
                        return {
                            "rinq_user_id": existing["rinq_user_id"],
                            "provider": existing["provider"],
                            "provider_subject": existing["provider_subject"],
                            "linked_at": _iso(existing["linked_at"]),
                        }
                    other = conn.execute(
                        "SELECT legacy_username FROM app_users WHERE rinq_user_id = %s::uuid",
                        (existing["rinq_user_id"],),
                    ).fetchone()
                    can_reclaim = (
                        allow_reclaim_orphan
                        and other is not None
                        and not other.get("legacy_username")
                    )
                    if not can_reclaim:
                        raise DuplicateAuthLinkError(
                            f"provider subject already linked to another user: {provider}:{subject}"
                        )
                    other_id = existing["rinq_user_id"]
                    now = _utc_now()
                    conn.execute(
                        """
                        UPDATE auth_links
                        SET rinq_user_id = %s::uuid, linked_at = %s
                        WHERE provider = %s AND provider_subject = %s
                        """,
                        (rinq_user_id, now, provider, subject),
                    )
                    remaining = conn.execute(
                        "SELECT 1 FROM auth_links WHERE rinq_user_id = %s::uuid LIMIT 1",
                        (other_id,),
                    ).fetchone()
                    if not remaining:
                        conn.execute(
                            "DELETE FROM app_users WHERE rinq_user_id = %s::uuid",
                            (other_id,),
                        )
                    return {
                        "rinq_user_id": rinq_user_id,
                        "provider": provider,
                        "provider_subject": subject,
                        "linked_at": _iso(now),
                    }

                now = _utc_now()
                conn.execute(
                    """
                    INSERT INTO auth_links (rinq_user_id, provider, provider_subject, linked_at)
                    VALUES (%s::uuid, %s, %s, %s)
                    """,
                    (rinq_user_id, provider, subject, now),
                )
                return {
                    "rinq_user_id": rinq_user_id,
                    "provider": provider,
                    "provider_subject": subject,
                    "linked_at": _iso(now),
                }
        except (NotFoundError, DuplicateAuthLinkError, ConflictError):
            raise
        except UniqueViolation as exc:
            raise DuplicateAuthLinkError(str(exc)) from exc
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def remove_auth_link(self, rinq_user_id: str, provider: str) -> Dict[str, Any]:
        if not provider:
            raise ValueError("provider required")
        try:
            with transaction() as conn:
                identity = conn.execute(
                    "SELECT 1 FROM app_users WHERE rinq_user_id = %s::uuid",
                    (rinq_user_id,),
                ).fetchone()
                if not identity:
                    raise NotFoundError(f"unknown rinq_user_id={rinq_user_id}")
                links = conn.execute(
                    """
                    SELECT id::text, rinq_user_id::text, provider, provider_subject, linked_at
                    FROM auth_links WHERE rinq_user_id = %s::uuid FOR UPDATE
                    """,
                    (rinq_user_id,),
                ).fetchall()
                if len(links) <= 1:
                    raise ConflictError("cannot_unlink_last_login_method")
                match = next((l for l in links if l["provider"] == provider), None)
                if not match:
                    raise NotFoundError(f"no link for provider={provider}")
                conn.execute(
                    "DELETE FROM auth_links WHERE rinq_user_id = %s::uuid AND provider = %s",
                    (rinq_user_id, provider),
                )
                return {
                    "rinq_user_id": match["rinq_user_id"],
                    "provider": match["provider"],
                    "provider_subject": match["provider_subject"],
                    "linked_at": _iso(match["linked_at"]),
                }
        except (NotFoundError, ConflictError):
            raise
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def list_auth_links_for_user(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        try:
            with connection() as conn:
                rows = conn.execute(
                    """
                    SELECT rinq_user_id::text, provider, provider_subject, linked_at
                    FROM auth_links WHERE rinq_user_id = %s::uuid
                    ORDER BY linked_at
                    """,
                    (rinq_user_id,),
                ).fetchall()
        except Exception as exc:
            raise StorageError(str(exc)) from exc
        return [
            {
                "rinq_user_id": r["rinq_user_id"],
                "provider": r["provider"],
                "provider_subject": r["provider_subject"],
                "linked_at": _iso(r["linked_at"]),
            }
            for r in rows
        ]

    def list_links_for_user(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        """Alias for account_lifecycle (IdentityStore method name)."""
        return self.list_auth_links_for_user(rinq_user_id)

    def list_providers_for_user(self, rinq_user_id: str) -> List[str]:
        return sorted({l["provider"] for l in self.list_auth_links_for_user(rinq_user_id) if l.get("provider")})

    def ensure_legacy_identity(
        self,
        username: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        subject = normalize_subject(username)
        if not subject:
            raise ValueError("username required")
        try:
            with transaction() as conn:
                existing = conn.execute(
                    """
                    SELECT l.rinq_user_id::text, l.provider, l.provider_subject, l.linked_at,
                           u.legacy_username, u.created_at, u.status
                    FROM auth_links l
                    JOIN app_users u ON u.rinq_user_id = l.rinq_user_id
                    WHERE l.provider = %s AND l.provider_subject = %s
                    """,
                    (LEGACY_PASSWORD_PROVIDER, subject),
                ).fetchone()
                if existing:
                    return self._ctx_from_row(existing, display_name)

                by_user = conn.execute(
                    """
                    SELECT rinq_user_id::text, legacy_username, created_at, status
                    FROM app_users WHERE legacy_username = %s
                    """,
                    (subject,),
                ).fetchone()
                if by_user:
                    rinq = by_user["rinq_user_id"]
                else:
                    rinq = str(uuid4())
                    created = parse_timestamptz(created_at) or _utc_now()
                    conn.execute(
                        """
                        INSERT INTO app_users (rinq_user_id, created_at, status, legacy_username)
                        VALUES (%s::uuid, %s, 'active', %s)
                        """,
                        (rinq, created, subject),
                    )
                now = _utc_now()
                conn.execute(
                    """
                    INSERT INTO auth_links (rinq_user_id, provider, provider_subject, linked_at)
                    VALUES (%s::uuid, %s, %s, %s)
                    ON CONFLICT (provider, provider_subject) DO NOTHING
                    """,
                    (rinq, LEGACY_PASSWORD_PROVIDER, subject, now),
                )
                row = conn.execute(
                    """
                    SELECT l.rinq_user_id::text, l.provider, l.provider_subject, l.linked_at,
                           u.legacy_username, u.created_at, u.status
                    FROM auth_links l
                    JOIN app_users u ON u.rinq_user_id = l.rinq_user_id
                    WHERE l.provider = %s AND l.provider_subject = %s
                    """,
                    (LEGACY_PASSWORD_PROVIDER, subject),
                ).fetchone()
                if not row:
                    raise StorageError("failed to ensure legacy identity")
                return self._ctx_from_row(row, display_name)
        except Exception as exc:
            if isinstance(exc, (ValueError, StorageError)):
                raise
            raise StorageError(str(exc)) from exc

    def ensure_provider_identity(
        self,
        provider: str,
        provider_subject: str,
        *,
        display_name: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> AuthContext:
        subject = normalize_subject(provider_subject)
        if not provider or not subject:
            raise ValueError("provider and provider_subject required")
        try:
            with transaction() as conn:
                existing = conn.execute(
                    """
                    SELECT l.rinq_user_id::text, l.provider, l.provider_subject, l.linked_at,
                           u.legacy_username, u.created_at, u.status
                    FROM auth_links l
                    JOIN app_users u ON u.rinq_user_id = l.rinq_user_id
                    WHERE l.provider = %s AND l.provider_subject = %s
                    """,
                    (provider, subject),
                ).fetchone()
                if existing:
                    return self._ctx_from_row(existing, display_name)

                rinq = str(uuid4())
                created = parse_timestamptz(created_at) or _utc_now()
                now = _utc_now()
                conn.execute(
                    """
                    INSERT INTO app_users (rinq_user_id, created_at, status, legacy_username)
                    VALUES (%s::uuid, %s, 'active', NULL)
                    """,
                    (rinq, created),
                )
                conn.execute(
                    """
                    INSERT INTO auth_links (rinq_user_id, provider, provider_subject, linked_at)
                    VALUES (%s::uuid, %s, %s, %s)
                    """,
                    (rinq, provider, subject, now),
                )
                row = {
                    "rinq_user_id": rinq,
                    "provider": provider,
                    "provider_subject": subject,
                    "linked_at": now,
                    "legacy_username": None,
                    "created_at": created,
                    "status": "active",
                }
                return self._ctx_from_row(row, display_name)
        except UniqueViolation as exc:
            # Race: another writer created the link — re-read
            found = self.find_auth_link(provider, subject)
            if found:
                ident = self.get_identity_by_user_id(found["rinq_user_id"])
                if ident:
                    return AuthContext(
                        rinq_user_id=ident["rinq_user_id"],
                        auth_provider=provider,
                        auth_subject=subject,
                        display_name=(display_name or "Spieler").strip() or "Spieler",
                        legacy_username=ident.get("legacy_username"),
                    )
            raise StorageError(str(exc)) from exc
        except Exception as exc:
            if isinstance(exc, (ValueError, StorageError)):
                raise
            raise StorageError(str(exc)) from exc

    def delete_identity_cascade(self, rinq_user_id: str) -> Dict[str, Any]:
        try:
            with transaction() as conn:
                identity = conn.execute(
                    """
                    SELECT rinq_user_id::text, created_at, status, legacy_username
                    FROM app_users WHERE rinq_user_id = %s::uuid
                    """,
                    (rinq_user_id,),
                ).fetchone()
                if not identity:
                    raise NotFoundError(f"unknown rinq_user_id={rinq_user_id}")
                links = conn.execute(
                    """
                    SELECT rinq_user_id::text, provider, provider_subject, linked_at
                    FROM auth_links WHERE rinq_user_id = %s::uuid
                    """,
                    (rinq_user_id,),
                ).fetchall()
                # CASCADE removes auth_links and related user tables
                conn.execute(
                    "DELETE FROM app_users WHERE rinq_user_id = %s::uuid",
                    (rinq_user_id,),
                )
                return {
                    "identity": {
                        "rinq_user_id": identity["rinq_user_id"],
                        "created_at": _iso(identity["created_at"]),
                        "status": identity["status"],
                        "legacy_username": identity["legacy_username"],
                    },
                    "auth_links": [
                        {
                            "rinq_user_id": l["rinq_user_id"],
                            "provider": l["provider"],
                            "provider_subject": l["provider_subject"],
                            "linked_at": _iso(l["linked_at"]),
                        }
                        for l in links
                    ],
                }
        except NotFoundError:
            raise
        except Exception as exc:
            raise StorageError(str(exc)) from exc

    def _ctx_from_row(self, row: Dict[str, Any], display_name: Optional[str]) -> AuthContext:
        legacy = row.get("legacy_username")
        name = (display_name or legacy or "Spieler").strip() or "Spieler"
        return AuthContext(
            rinq_user_id=str(row["rinq_user_id"]),
            auth_provider=row.get("provider") or LEGACY_PASSWORD_PROVIDER,
            auth_subject=normalize_subject(row.get("provider_subject") or ""),
            display_name=name,
            legacy_username=legacy,
        )

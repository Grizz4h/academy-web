"""Entitlement grant records (domain layer)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class EntitlementGrant:
    id: str
    rinq_user_id: str
    feature_key: str
    status: str
    source: str
    created_at: Optional[str]
    updated_at: Optional[str]
    expires_at: Optional[str]
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "rinq_user_id": self.rinq_user_id,
            "feature_key": self.feature_key,
            "status": self.status,
            "source": self.source,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "expires_at": self.expires_at,
            "metadata": dict(self.metadata or {}),
        }


def grant_from_dict(data: Dict[str, Any]) -> EntitlementGrant:
    return EntitlementGrant(
        id=str(data["id"]),
        rinq_user_id=str(data["rinq_user_id"]),
        feature_key=str(data["feature_key"]),
        status=str(data["status"]),
        source=str(data["source"]),
        created_at=data.get("created_at"),
        updated_at=data.get("updated_at"),
        expires_at=data.get("expires_at"),
        metadata=dict(data.get("metadata") or {}),
    )


def is_grant_active(
    grant: EntitlementGrant,
    *,
    now: Optional[datetime] = None,
) -> bool:
    if grant.status != "active":
        return False
    if not grant.expires_at:
        return True
    from repositories.pg_mapping import parse_timestamptz

    expires = parse_timestamptz(grant.expires_at)
    if expires is None:
        return True
    current = now or datetime.now(timezone.utc)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires > current

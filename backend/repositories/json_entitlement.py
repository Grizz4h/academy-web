"""EntitlementRepository — single JSON file (dev / JSON backend)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from uuid import uuid4

from identity.store import IdentityStore

from entitlements.feature_keys import validate_feature_key, validate_grant_source
from entitlements.models import EntitlementGrant, grant_from_dict, is_grant_active
from repositories.errors import NotFoundError, StorageError
from repositories.json_io import FileLock, atomic_write_json, read_json


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class JsonEntitlementRepository:
    def __init__(
        self,
        get_entitlements_file: Callable[[], str],
        get_identity_store: Callable[[], IdentityStore],
    ):
        self._get_file = get_entitlements_file
        self._get_identity_store = get_identity_store
        self._lock = FileLock(get_entitlements_file() + ".lock")

    def _empty(self) -> Dict[str, Any]:
        return {"grants": [], "version": 1}

    def _load(self) -> Dict[str, Any]:
        path = self._get_file()
        try:
            data = read_json(path, default=self._empty())
        except FileNotFoundError:
            data = self._empty()
        if not isinstance(data, dict):
            data = self._empty()
        data.setdefault("grants", [])
        data.setdefault("version", 1)
        return data

    def _save(self, data: Dict[str, Any]) -> None:
        atomic_write_json(self._get_file(), data)

    def _user_exists(self, rinq_user_id: str) -> bool:
        return self._get_identity_store().get_identity(rinq_user_id) is not None

    def has_access(self, rinq_user_id: str, feature_key: str) -> bool:
        key = validate_feature_key(feature_key)
        with self._lock.exclusive():
            data = self._load()
            for raw in data.get("grants") or []:
                grant = grant_from_dict(raw)
                if grant.rinq_user_id == rinq_user_id and grant.feature_key == key:
                    return is_grant_active(grant)
        return False

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
        if not self._user_exists(rinq_user_id):
            raise NotFoundError(f"unknown rinq_user_id={rinq_user_id}")
        meta = dict(metadata or {})
        now = _utc_now_iso()
        with self._lock.exclusive():
            data = self._load()
            grants: List[Dict[str, Any]] = list(data.get("grants") or [])
            existing_idx = next(
                (
                    i
                    for i, g in enumerate(grants)
                    if g.get("rinq_user_id") == rinq_user_id and g.get("feature_key") == key
                ),
                None,
            )
            record = {
                "id": grants[existing_idx]["id"] if existing_idx is not None else str(uuid4()),
                "rinq_user_id": rinq_user_id,
                "feature_key": key,
                "status": "active",
                "source": src,
                "created_at": grants[existing_idx].get("created_at", now)
                if existing_idx is not None
                else now,
                "updated_at": now,
                "expires_at": expires_at,
                "metadata": meta,
            }
            if existing_idx is not None:
                grants[existing_idx] = record
            else:
                grants.append(record)
            data["grants"] = grants
            try:
                self._save(data)
            except OSError as exc:
                raise StorageError(str(exc)) from exc
        return grant_from_dict(record).to_dict()

    def revoke_entitlement(self, rinq_user_id: str, feature_key: str) -> bool:
        key = validate_feature_key(feature_key)
        now = _utc_now_iso()
        with self._lock.exclusive():
            data = self._load()
            grants: List[Dict[str, Any]] = list(data.get("grants") or [])
            changed = False
            for i, raw in enumerate(grants):
                if (
                    raw.get("rinq_user_id") == rinq_user_id
                    and raw.get("feature_key") == key
                    and raw.get("status") == "active"
                ):
                    grants[i] = {**raw, "status": "revoked", "updated_at": now}
                    changed = True
                    break
            if changed:
                data["grants"] = grants
                try:
                    self._save(data)
                except OSError as exc:
                    raise StorageError(str(exc)) from exc
        return changed

    def list_user_entitlements(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        with self._lock.exclusive():
            data = self._load()
            rows = [
                g
                for g in data.get("grants") or []
                if g.get("rinq_user_id") == rinq_user_id
            ]
        rows.sort(key=lambda g: str(g.get("feature_key") or ""))
        return [grant_from_dict(r).to_dict() for r in rows]

    def get_active_entitlements(self, rinq_user_id: str) -> List[Dict[str, Any]]:
        grants = [grant_from_dict(g) for g in self.list_user_entitlements(rinq_user_id)]
        return [g.to_dict() for g in grants if is_grant_active(g)]

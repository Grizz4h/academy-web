"""Health payload helpers — no secrets in responses."""

from __future__ import annotations

from typing import Any, Dict, Tuple

from .settings import storage_backend


def build_health_payload() -> Tuple[Dict[str, Any], int]:
    """Return (json_body, http_status). Never includes DATABASE_URL or credentials."""
    backend = storage_backend()
    payload: Dict[str, Any] = {"status": "ok", "storage": backend}

    if backend == "json":
        return payload, 200

    try:
        from .pool import ping_database

        ping_database()
    except Exception:
        payload["status"] = "degraded"
        payload["database"] = "error"
        return payload, 503

    payload["database"] = "ok"
    return payload, 200

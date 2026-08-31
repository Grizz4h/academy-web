"""Short-lived, privacy-preserving support codes. No persistent storage."""
from __future__ import annotations
import secrets
import threading
import time
from datetime import datetime, timezone
from typing import Dict, Optional

_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
_TTL_SECONDS = 30 * 60
_lock = threading.Lock()
_codes: Dict[str, tuple[str, float]] = {}


def _cleanup(now: float) -> None:
    expired = [code for code, (_, expires) in _codes.items() if expires <= now]
    for code in expired:
        _codes.pop(code, None)


def issue_support_code(rinq_user_id: str) -> dict:
    now = time.time()
    with _lock:
        _cleanup(now)
        for old_code, (old_user, _) in list(_codes.items()):
            if old_user == rinq_user_id:
                _codes.pop(old_code, None)
        while True:
            raw = "".join(secrets.choice(_ALPHABET) for _ in range(8))
            code = f"RINQ-{raw[:4]}-{raw[4:]}"
            if code not in _codes:
                break
        expires = now + _TTL_SECONDS
        _codes[code] = (rinq_user_id, expires)
    return {"code": code, "expires_at": datetime.fromtimestamp(expires, timezone.utc).isoformat(), "valid_for_minutes": 30}


def resolve_support_code(code: str) -> Optional[str]:
    normalized = (code or "").strip().upper()
    now = time.time()
    with _lock:
        _cleanup(now)
        entry = _codes.get(normalized)
        return entry[0] if entry else None


def reset_for_tests() -> None:
    with _lock:
        _codes.clear()

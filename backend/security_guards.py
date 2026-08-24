"""Minimal admin auth + in-memory rate limiting for Phase 3B."""

from __future__ import annotations

import os
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Iterable, Optional, Set

from fastapi import HTTPException, Request

from identity.context import AuthContext
from identity.store import normalize_subject


def _env_flag(name: str, default: str = "0") -> bool:
    raw = (os.environ.get(name) or default).strip().lower()
    return raw in ("1", "true", "yes", "on")


def legacy_signup_allowed() -> bool:
    """Public legacy signup. Production should set ACADEMY_ALLOW_LEGACY_SIGNUP=0."""
    return _env_flag("ACADEMY_ALLOW_LEGACY_SIGNUP", default="1")


def admin_username_allowlist() -> Set[str]:
    raw = (os.environ.get("ACADEMY_ADMIN_USERNAMES") or "").strip()
    if not raw:
        return set()
    return {normalize_subject(part) for part in raw.split(",") if part.strip()}


def is_admin_auth(
    auth: AuthContext,
    *,
    role_from_record: Optional[str] = None,
) -> bool:
    """Server-side admin check: env allowlist and/or users.json role=admin."""
    allow = admin_username_allowlist()
    subject = normalize_subject(auth.legacy_username or auth.auth_subject)
    if subject and subject in allow:
        return True
    if (role_from_record or "").strip().lower() == "admin":
        return True
    return False


# Code-controlled creator allowlist (TikTok / Szenenpool). Extend here or via env override.
_CREATOR_MODE_USERNAMES: frozenset[str] = frozenset({"christoph"})
_CREATOR_MODE_RINQ_USER_IDS: frozenset[str] = frozenset({
    "30de6c03-3f4d-4617-8a2c-bb5786b688c0",  # Christoph (legacy + linked auth)
})


def creator_mode_user_allowlist() -> Set[str]:
    """Usernames/subjects with creator tools (Szenenpool, Szene erfassen). Not self-service."""
    extra_raw = (os.environ.get("ACADEMY_CREATOR_USERNAMES") or "").strip()
    extra = {normalize_subject(part) for part in extra_raw.split(",") if part.strip()} if extra_raw else set()
    return set(_CREATOR_MODE_USERNAMES) | extra


def creator_mode_rinq_user_allowlist() -> Set[str]:
    raw = (os.environ.get("ACADEMY_CREATOR_RINQ_USER_IDS") or "").strip()
    extra = {part.strip().lower() for part in raw.split(",") if part.strip()} if raw else set()
    return set(_CREATOR_MODE_RINQ_USER_IDS) | extra


def is_creator_mode_auth(
    auth: AuthContext,
    *,
    role_from_record: Optional[str] = None,
) -> bool:
    """Server-side creator check — env/code allowlist only, never client profile fields."""
    if is_admin_auth(auth, role_from_record=role_from_record):
        return True
    subject = normalize_subject(auth.legacy_username or auth.auth_subject)
    if subject and subject in creator_mode_user_allowlist():
        return True
    rid = (auth.rinq_user_id or "").strip().lower()
    if rid and rid in creator_mode_rinq_user_allowlist():
        return True
    return False


class SlidingWindowRateLimiter:
    """Process-local sliding window. Good enough for single-process FastAPI MVP."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def check(self, key: str, *, limit: int, window_sec: float) -> None:
        now = time.monotonic()
        with self._lock:
            bucket = self._hits[key]
            cutoff = now - window_sec
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                raise HTTPException(status_code=429, detail="Too many requests. Try again later.")
            bucket.append(now)


_rate_limiter = SlidingWindowRateLimiter()


def reset_rate_limiter_for_tests() -> None:
    """Clear in-memory buckets (unit tests only)."""
    with _rate_limiter._lock:
        _rate_limiter._hits.clear()


def client_ip(request: Request) -> str:
    forwarded = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    if forwarded:
        return forwarded
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def rate_limit(request: Request, scope: str, *, limit: int, window_sec: float) -> None:
    ip = client_ip(request)
    _rate_limiter.check(f"{scope}:{ip}", limit=limit, window_sec=window_sec)

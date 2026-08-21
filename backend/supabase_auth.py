"""Supabase Auth access-token verification (JWKS + optional legacy HS256 secret)."""

from __future__ import annotations

import logging
import os
import threading
from typing import Any, Dict, Optional

import jwt
from jwt import PyJWKClient

logger = logging.getLogger(__name__)

_jwks_client: Optional[PyJWKClient] = None
_jwks_lock = threading.Lock()
_jwks_url_cached: Optional[str] = None


def supabase_configured() -> bool:
    return bool((os.environ.get("SUPABASE_URL") or "").strip())


def _supabase_url() -> str:
    return (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")


def _issuer() -> str:
    explicit = (os.environ.get("SUPABASE_JWT_ISSUER") or "").strip()
    if explicit:
        return explicit.rstrip("/")
    base = _supabase_url()
    if not base:
        return ""
    # Supabase access tokens commonly use https://<ref>.supabase.co/auth/v1
    return f"{base}/auth/v1"


def _audience() -> str:
    return (os.environ.get("SUPABASE_JWT_AUDIENCE") or "authenticated").strip() or "authenticated"


def _jwks_url() -> str:
    explicit = (os.environ.get("SUPABASE_JWKS_URL") or "").strip()
    if explicit:
        return explicit
    base = _supabase_url()
    if not base:
        return ""
    return f"{base}/auth/v1/.well-known/jwks.json"


def _get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client, _jwks_url_cached
    url = _jwks_url()
    if not url:
        return None
    with _jwks_lock:
        if _jwks_client is None or _jwks_url_cached != url:
            _jwks_client = PyJWKClient(url, cache_keys=True, lifespan=600)
            _jwks_url_cached = url
        return _jwks_client


def verify_supabase_access_token(token: str) -> Dict[str, Any]:
    """Verify a Supabase access token and return claims.

    Prefer asymmetric JWKS verification. Optionally fall back to
    SUPABASE_JWT_SECRET (legacy HS256) when set.
    Never logs the token.
    """
    if not token or not token.strip():
        raise jwt.InvalidTokenError("empty token")

    issuer = _issuer()
    audience = _audience()
    algorithms_asym = ["ES256", "RS256"]
    options = {"require": ["exp", "sub"]}

    # 1) JWKS (asymmetric / new signing keys)
    client = _get_jwks_client()
    if client is not None:
        try:
            signing_key = client.get_signing_key_from_jwt(token)
            decode_kwargs: Dict[str, Any] = {
                "algorithms": algorithms_asym,
                "options": options,
            }
            if audience:
                decode_kwargs["audience"] = audience
            if issuer:
                decode_kwargs["issuer"] = issuer
            return jwt.decode(token, signing_key.key, **decode_kwargs)
        except Exception as exc:
            logger.debug("[SEC] supabase JWKS verify failed: %s", type(exc).__name__)

    # 2) Optional legacy shared secret (HS256) — server-only env
    secret = (os.environ.get("SUPABASE_JWT_SECRET") or "").strip()
    if secret:
        decode_kwargs = {
            "algorithms": ["HS256"],
            "options": options,
        }
        if audience:
            decode_kwargs["audience"] = audience
        if issuer:
            # Some projects use project URL without /auth/v1 — try both via verify_iss custom
            try:
                return jwt.decode(token, secret, **decode_kwargs, issuer=issuer)
            except jwt.InvalidIssuerError:
                alt = _supabase_url()
                if alt and alt != issuer:
                    return jwt.decode(token, secret, **decode_kwargs, issuer=alt)
                raise

    raise jwt.InvalidTokenError("supabase token verification failed")

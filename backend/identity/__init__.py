"""RinQ identity layer: AuthContext, identity store, legacy→UUID resolution.

Auth token subject ≠ app identity:
  legacy JWT sub / future provider sub → auth_links → rinq_user_id
"""

from __future__ import annotations

from .context import (
    AuthContext,
    LEGACY_PASSWORD_PROVIDER,
    MANAGED_AUTH_PROVIDERS,
    SUPABASE_EMAIL_PROVIDER,
    SUPABASE_GOOGLE_PROVIDER,
)
from .store import IdentityStore, get_identity_store

__all__ = [
    "AuthContext",
    "LEGACY_PASSWORD_PROVIDER",
    "MANAGED_AUTH_PROVIDERS",
    "SUPABASE_EMAIL_PROVIDER",
    "SUPABASE_GOOGLE_PROVIDER",
    "IdentityStore",
    "get_identity_store",
]

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

LEGACY_PASSWORD_PROVIDER = "legacy_password"
SUPABASE_GOOGLE_PROVIDER = "supabase_google"


@dataclass(frozen=True)
class AuthContext:
    """Resolved app auth. rinq_user_id is the only ownership key."""

    rinq_user_id: str
    auth_provider: str
    auth_subject: str
    display_name: str
    legacy_username: Optional[str] = None

    @property
    def owner_id(self) -> str:
        return self.rinq_user_id

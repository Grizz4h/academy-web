"""Dev access allowlist (DevLab without admin)."""

from __future__ import annotations

import os
import sys
import unittest

os.environ.setdefault("ACADEMY_JWT_SECRET", "test-jwt-secret-phase1-hardening-32chars-min")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from identity.context import AuthContext
from security_guards import is_dev_access_auth


def _auth(username: str, rinq_suffix: str) -> AuthContext:
    return AuthContext(
        auth_subject=username,
        legacy_username=username,
        display_name=username,
        rinq_user_id=f"00000000-0000-4000-8000-0000000000{rinq_suffix}",
        auth_provider="legacy_password",
    )


class DevAccessTests(unittest.TestCase):
    def test_paywall_accounts_default(self):
        env = os.environ.pop("ACADEMY_DEV_USERNAMES", None)
        try:
            self.assertTrue(is_dev_access_auth(_auth("paywall-test", "99")))
            self.assertTrue(is_dev_access_auth(_auth("paywall-widerruf", "97")))
            self.assertFalse(is_dev_access_auth(_auth("random-user", "98")))
        finally:
            if env is not None:
                os.environ["ACADEMY_DEV_USERNAMES"] = env


if __name__ == "__main__":
    unittest.main()

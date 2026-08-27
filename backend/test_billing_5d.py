"""Phase 5D — Stripe billing + entitlement grant sync tests."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"
os.environ.pop("STORAGE_BACKEND", None)
os.environ.pop("DATABASE_URL", None)

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from billing.subscription_sync import resolve_rinq_user_id, sync_subscription_object
from billing.webhook import handle_stripe_event
from entitlements.feature_keys import ACADEMY_PREMIUM
from identity.store import IdentityStore
from repositories.json_entitlement import JsonEntitlementRepository
from repositories.wiring import configure_repositories, get_repos


class ResolveUserTests(unittest.TestCase):
    def test_metadata_wins(self):
        uid = resolve_rinq_user_id(
            metadata={"rinq_user_id": "11111111-1111-1111-1111-111111111111"},
            client_reference_id="22222222-2222-2222-2222-222222222222",
        )
        self.assertEqual(uid, "11111111-1111-1111-1111-111111111111")


class SubscriptionSyncTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        store = IdentityStore(str(root / "identity_store.json"))
        alice = store.ensure_legacy_identity("alice")
        self.alice_id = alice.rinq_user_id
        self.ent_repo = JsonEntitlementRepository(
            lambda: str(root / "entitlement_grants.json"),
            lambda: store,
        )
        configure_repositories(
            get_identity_store=lambda: store,
            get_users_file=lambda: str(root / "users.json"),
            get_profiles_dir=lambda: str(root / "profiles"),
            get_rewards_dir=lambda: str(root / "rewards"),
            get_sessions_dir=lambda: str(root / "sessions"),
            get_entitlements_file=lambda: str(root / "entitlement_grants.json"),
            storage_backend="json",
        )
        # Patch get_repos entitlements to our json repo while mocking PG persistence
        self._repos = get_repos()
        self._repos.entitlements = self.ent_repo

    def tearDown(self):
        self._tmp.cleanup()

    @mock.patch("billing.subscription_sync.upsert_plan_entitlement")
    @mock.patch("billing.subscription_sync.upsert_subscription_row")
    def test_active_subscription_grants_premium(self, _sub_row, _plan_row):
        with mock.patch("billing.subscription_sync.get_repos", return_value=self._repos):
            uid = sync_subscription_object(
                {
                    "id": "sub_123",
                    "customer": "cus_123",
                    "status": "active",
                    "metadata": {"rinq_user_id": self.alice_id},
                    "current_period_start": int(datetime.now(timezone.utc).timestamp()),
                    "current_period_end": int(datetime.now(timezone.utc).timestamp()) + 3600,
                    "cancel_at_period_end": False,
                    "items": {"data": [{"price": {"id": "price_test"}}]},
                }
            )
        self.assertEqual(uid, self.alice_id)
        self.assertTrue(self.ent_repo.has_access(self.alice_id, ACADEMY_PREMIUM))

    @mock.patch("billing.subscription_sync.upsert_plan_entitlement")
    @mock.patch("billing.subscription_sync.upsert_subscription_row")
    def test_canceled_subscription_revokes_premium(self, _sub_row, _plan_row):
        self.ent_repo.grant_entitlement(self.alice_id, ACADEMY_PREMIUM, source="manual")
        with mock.patch("billing.subscription_sync.get_repos", return_value=self._repos):
            sync_subscription_object(
                {
                    "id": "sub_123",
                    "customer": "cus_123",
                    "status": "canceled",
                    "metadata": {"rinq_user_id": self.alice_id},
                    "items": {"data": [{"price": {"id": "price_test"}}]},
                }
            )
        self.assertFalse(self.ent_repo.has_access(self.alice_id, ACADEMY_PREMIUM))


class PortalSessionTests(unittest.TestCase):
    @mock.patch("stripe.billing_portal.Session.create")
    @mock.patch("billing.portal.get_billing_status")
    @mock.patch("billing.portal.settings.stripe_configured", return_value=True)
    @mock.patch("billing.portal.settings.stripe_secret_key", return_value="sk_test")
    @mock.patch("billing.portal.settings.stripe_portal_return_url", return_value="https://example.test/account")
    def test_create_portal_session(
        self,
        _return_url,
        _secret,
        _configured,
        get_status,
        portal_create,
    ):
        from billing.portal import create_portal_session
        from identity.context import AuthContext

        get_status.return_value = {"plan": {"external_customer_id": "cus_123"}, "subscriptions": []}
        portal_create.return_value = mock.Mock(url="https://billing.stripe.com/session/test")
        user = AuthContext(
            rinq_user_id="11111111-1111-1111-1111-111111111111",
            auth_provider="legacy_password",
            auth_subject="alice",
            display_name="alice",
        )

        result = create_portal_session(user)

        self.assertEqual(result["portal_url"], "https://billing.stripe.com/session/test")
        portal_create.assert_called_once_with(
            customer="cus_123",
            return_url="https://example.test/account",
        )

    @mock.patch("billing.portal.get_billing_status")
    @mock.patch("billing.portal.settings.stripe_configured", return_value=True)
    def test_create_portal_requires_customer(self, _configured, get_status):
        from billing.portal import create_portal_session
        from identity.context import AuthContext

        get_status.return_value = {"plan": None, "subscriptions": []}
        user = AuthContext(
            rinq_user_id="11111111-1111-1111-1111-111111111111",
            auth_provider="legacy_password",
            auth_subject="alice",
            display_name="alice",
        )

        with self.assertRaises(ValueError):
            create_portal_session(user)


class WebhookIdempotencyTests(unittest.TestCase):
    @mock.patch("billing.webhook.try_record_webhook_event", return_value=True)
    @mock.patch("billing.webhook.sync_subscription_object", return_value="u1")
    @mock.patch("billing.webhook.webhook_event_seen", side_effect=[False, True])
    def test_duplicate_event_skipped(self, _seen, _sync, _record):
        event = {
            "id": "evt_1",
            "type": "customer.subscription.updated",
            "data": {"object": {"metadata": {}}},
        }
        first = handle_stripe_event(event)
        second = handle_stripe_event(event)
        self.assertFalse(first.get("duplicate"))
        self.assertTrue(second.get("duplicate"))
        _sync.assert_called_once()
        _record.assert_called_once()

    @mock.patch("billing.webhook.try_record_webhook_event")
    @mock.patch(
        "billing.webhook.sync_subscription_object",
        side_effect=RuntimeError("boom"),
    )
    @mock.patch("billing.webhook.webhook_event_seen", return_value=False)
    def test_failure_does_not_mark_processed(self, _seen, _sync, record):
        event = {
            "id": "evt_fail",
            "type": "customer.subscription.updated",
            "data": {"object": {"metadata": {}}},
        }
        with self.assertRaises(RuntimeError):
            handle_stripe_event(event)
        record.assert_not_called()


if __name__ == "__main__":
    unittest.main()

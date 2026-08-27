"""Unit tests for Stripe cleanup on account delete."""

from __future__ import annotations

import unittest
from unittest import mock

from billing.account_cleanup import detach_stripe_billing_for_user


class AccountCleanupTests(unittest.TestCase):
    @mock.patch("billing.account_cleanup.settings.stripe_configured", return_value=False)
    def test_skipped_when_stripe_unconfigured(self, _cfg):
        out = detach_stripe_billing_for_user("u1")
        self.assertTrue(out["skipped"])
        self.assertEqual(out["reason"], "stripe_not_configured")

    @mock.patch("billing.account_cleanup.settings.stripe_secret_key", return_value="sk_test_x")
    @mock.patch("billing.account_cleanup.settings.stripe_configured", return_value=True)
    @mock.patch("billing.account_cleanup.get_billing_status")
    def test_cancels_sub_and_deletes_customer(self, billing, _cfg, _key):
        billing.return_value = {
            "plan": {"external_customer_id": "cus_1", "status": "active"},
            "subscriptions": [
                {
                    "external_subscription_id": "sub_1",
                    "external_customer_id": "cus_1",
                    "status": "active",
                }
            ],
        }
        fake_stripe = mock.MagicMock()
        with mock.patch.dict("sys.modules", {"stripe": fake_stripe}):
            out = detach_stripe_billing_for_user("u1")
        fake_stripe.Subscription.delete.assert_called_once_with("sub_1")
        fake_stripe.Customer.delete.assert_called_once_with("cus_1")
        self.assertEqual(out["subscriptions_canceled"], 1)
        self.assertTrue(out["customer_deleted"])
        self.assertEqual(out["errors"], [])

    @mock.patch("billing.account_cleanup.settings.stripe_secret_key", return_value="sk_test_x")
    @mock.patch("billing.account_cleanup.settings.stripe_configured", return_value=True)
    @mock.patch("billing.account_cleanup.get_billing_status")
    def test_raises_when_customer_delete_fails(self, billing, _cfg, _key):
        billing.return_value = {
            "plan": {"external_customer_id": "cus_1"},
            "subscriptions": [],
        }
        fake_stripe = mock.MagicMock()
        fake_stripe.Customer.delete.side_effect = RuntimeError("stripe down")
        with mock.patch.dict("sys.modules", {"stripe": fake_stripe}):
            with self.assertRaises(RuntimeError) as ctx:
                detach_stripe_billing_for_user("u1")
        self.assertEqual(str(ctx.exception), "stripe_cleanup_incomplete")


if __name__ == "__main__":
    unittest.main()

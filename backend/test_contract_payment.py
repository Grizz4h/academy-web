"""Unit tests: exact contract payment selection (no latest-invoice fallback)."""

from __future__ import annotations

import os
import sys
import unittest
from unittest import mock

os.environ["ACADEMY_JWT_SECRET"] = "test-jwt-secret-phase1-hardening-32chars-min"
os.environ["ACADEMY_SKIP_IDENTITY_MIGRATION"] = "1"

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from billing.contract_payment import (
    find_subscription_create_invoice,
    resolve_refund_target,
)


class FindSubscriptionCreateInvoiceTests(unittest.TestCase):
    def test_picks_subscription_create_not_latest_renewal(self):
        invoices = [
            {
                "id": "in_renewal",
                "status": "paid",
                "billing_reason": "subscription_cycle",
                "created": 200,
                "payment_intent": "pi_renewal",
            },
            {
                "id": "in_create",
                "status": "paid",
                "billing_reason": "subscription_create",
                "created": 100,
                "payment_intent": "pi_create",
            },
        ]
        inv, reason = find_subscription_create_invoice(invoices)
        self.assertIsNone(reason)
        self.assertEqual(inv["id"], "in_create")

    def test_no_fallback_when_only_cycle_invoices(self):
        invoices = [
            {
                "id": "in_cycle",
                "status": "paid",
                "billing_reason": "subscription_cycle",
                "created": 300,
                "payment_intent": "pi_cycle",
            },
        ]
        inv, reason = find_subscription_create_invoice(invoices)
        self.assertIsNone(inv)
        self.assertEqual(reason, "no_paid_subscription_create_invoice")


class ResolveRefundTargetTests(unittest.TestCase):
    def test_uses_withdrawal_payment_intent(self):
        pi, charge, err = resolve_refund_target(
            {
                "stripe_payment_intent_id": "pi_abc",
                "stripe_charge_id": None,
                "stripe_subscription_id": "sub_1",
            }
        )
        self.assertEqual(pi, "pi_abc")
        self.assertIsNone(err)

    @mock.patch("billing.contract_payment.get_subscription_by_external_id")
    def test_loads_from_subscription_anchors(self, get_sub):
        get_sub.return_value = {
            "initial_payment_intent_id": "pi_from_sub",
            "initial_charge_id": "ch_from_sub",
            "initial_invoice_id": "in_from_sub",
        }
        pi, charge, err = resolve_refund_target(
            {
                "stripe_subscription_id": "sub_1",
                "stripe_payment_intent_id": None,
                "stripe_charge_id": None,
            }
        )
        self.assertEqual(pi, "pi_from_sub")
        self.assertEqual(charge, "ch_from_sub")
        self.assertIsNone(err)

    @mock.patch("billing.contract_payment.get_subscription_by_external_id")
    def test_manual_review_when_no_anchors(self, get_sub):
        get_sub.return_value = {
            "initial_payment_intent_id": None,
            "initial_charge_id": None,
        }
        pi, charge, err = resolve_refund_target(
            {"stripe_subscription_id": "sub_1"}
        )
        self.assertIsNone(pi)
        self.assertIsNone(charge)
        self.assertEqual(err, "missing_initial_payment_refs")


if __name__ == "__main__":
    unittest.main()

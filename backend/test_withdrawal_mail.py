"""Withdrawal mail template unit tests."""

from __future__ import annotations

import os
import sys
import unittest
from datetime import datetime, timezone

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from mail import (
    SUBJECT_WITHDRAWAL_RECEIPT,
    SUBJECT_WITHDRAWAL_REFUND,
    build_withdrawal_receipt_bodies,
    build_withdrawal_refund_bodies,
    format_berlin_date_time,
    withdrawal_friendly_refs,
)


class WithdrawalMailTemplateTests(unittest.TestCase):
    def test_greeting_without_name(self):
        text, _ = build_withdrawal_receipt_bodies(
            display_name="",
            received_at="2026-08-27T14:30:00+00:00",
            withdrawal_id="abcdef12-3456-7890-abcd-ef1234567890",
        )
        self.assertTrue(text.startswith("Hallo,\n"))
        self.assertNotIn("undefined", text)
        self.assertNotIn("bereits erstattet", text.lower())
        self.assertIn("weitere Rückabwicklung", text)

    def test_refs_have_no_stripe_prefix(self):
        c, w = withdrawal_friendly_refs("abcdef12-3456-7890-abcd-ef1234567890")
        self.assertTrue(c.startswith("VT-"))
        self.assertTrue(w.startswith("WR-"))
        self.assertNotIn("sub_", c + w)
        self.assertNotIn("pi_", c + w)

    def test_berlin_time(self):
        # 14:30 UTC in summer ≈ 16:30 Berlin
        date_s, time_s = format_berlin_date_time(
            datetime(2026, 8, 27, 14, 30, tzinfo=timezone.utc)
        )
        self.assertEqual(date_s, "27.08.2026")
        self.assertIn("16:30", time_s)

    def test_refund_mail_mentions_refund(self):
        text, html = build_withdrawal_refund_bodies(
            display_name="Christoph",
            withdrawal_id="abcdef12-3456-7890-abcd-ef1234567890",
        )
        self.assertIn("Hallo Christoph,", text)
        self.assertIn("Erstattung ausgelöst", text)
        self.assertIn("Erstattung ausgelöst", html)
        self.assertEqual(SUBJECT_WITHDRAWAL_RECEIPT, "Bestätigung deines Widerrufs – rInQ Tank")
        self.assertEqual(SUBJECT_WITHDRAWAL_REFUND, "Erstattung zu deinem Widerruf – rInQ Tank")


if __name__ == "__main__":
    unittest.main()

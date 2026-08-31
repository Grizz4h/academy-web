from __future__ import annotations
import os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from unittest import mock
import support_codes

class SupportCodeTests(unittest.TestCase):
    def setUp(self): support_codes.reset_for_tests()
    def test_code_resolves_without_persistence_or_pii(self):
        uid="00000000-0000-4000-8000-000000000111"
        result=support_codes.issue_support_code(uid)
        self.assertTrue(result["code"].startswith("RINQ-"))
        self.assertNotIn(uid,result["code"])
        self.assertNotIn("@",result["code"])
        self.assertEqual(support_codes.resolve_support_code(result["code"].lower()),uid)
    def test_new_code_invalidates_previous_code_for_same_user(self):
        uid="00000000-0000-4000-8000-000000000111"
        old=support_codes.issue_support_code(uid)["code"]
        new=support_codes.issue_support_code(uid)["code"]
        self.assertIsNone(support_codes.resolve_support_code(old))
        self.assertEqual(support_codes.resolve_support_code(new),uid)
    def test_expired_code_is_removed(self):
        with mock.patch.object(support_codes.time,"time",return_value=1000): code=support_codes.issue_support_code("uid")["code"]
        with mock.patch.object(support_codes.time,"time",return_value=1000+1801): self.assertIsNone(support_codes.resolve_support_code(code))

if __name__=="__main__": unittest.main()

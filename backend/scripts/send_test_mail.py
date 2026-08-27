#!/usr/bin/env python3
"""Send a transactional SMTP test mail (ops / pre-launch).

Usage (from backend/, with .env.local loaded or env exported):

  python scripts/send_test_mail.py --to you@example.com

Requires ACADEMY_SMTP_* env vars. Does not print secrets.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

# Load .env.local if present (no override of existing env)
env_path = BACKEND.parent / ".env.local"
if env_path.is_file():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip("'").strip('"')
        os.environ.setdefault(key, val)


def main() -> int:
    parser = argparse.ArgumentParser(description="Send rInQ SMTP test mail")
    parser.add_argument("--to", required=True, help="Recipient email")
    args = parser.parse_args()

    from mail import MSG_TEST, build_test_mail_bodies, mail_configured, send_transactional_mail

    if not mail_configured():
        print("FAIL: ACADEMY_SMTP_HOST not set", file=sys.stderr)
        return 2

    text, html = build_test_mail_bodies()
    result = send_transactional_mail(
        recipient=args.to.strip(),
        subject="rInQ Tank — SMTP Test",
        text_body=text,
        html_body=html,
        message_type=MSG_TEST,
        reference_id="cli-mail-test",
    )
    if not result.ok:
        print(f"FAIL: {result.error}", file=sys.stderr)
        return 1
    print(f"OK: test mail queued/sent to {args.to.strip()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

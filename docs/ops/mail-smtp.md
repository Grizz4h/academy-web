# Transactional mail (SMTP)

Central service: `backend/mail/` → `send_transactional_mail(...)`.

Used for:

- Widerrufs-**Eingangsbestätigung** (sofort, ohne Refund-Zusage)
- Widerrufs-**Erstattungsbestätigung** (erst nach erfolgreichem Stripe-Refund)
- Confirm-Link (öffentlicher Widerruf)
- Admin-/CLI-Testmail
- Placeholder: `TODO VERTRAGSBESTÄTIGUNG` (not sent yet)

## Environment (Hetzner / `.env.local`)

```bash
ACADEMY_SMTP_HOST=          # from your mailbox provider (e.g. IONOS) — do not invent
ACADEMY_SMTP_PORT=587
ACADEMY_SMTP_USER=kontakt@rinq-tank.de
ACADEMY_SMTP_PASSWORD=      # secret
ACADEMY_SMTP_FROM=kontakt@rinq-tank.de
ACADEMY_SMTP_SECURE=false   # true/starttls for STARTTLS; ssl or port 465 for SMTPS
# Alias still accepted: ACADEMY_SMTP_TLS=1
```

Mailbox assumption: `kontakt@rinq-tank.de`. Obtain real SMTP host/port/TLS from the provider; do not hardcode IONOS hosts without verification.

## Test

```bash
# CLI (from backend/, env loaded)
python scripts/send_test_mail.py --to you@example.com

# Admin API
POST /api/admin/mail/test
Authorization: Bearer <admin>
{ "to": "you@example.com" }
```

## Pre-launch E2E checklist

1. Create/activate mailbox `kontakt@rinq-tank.de`
2. Set SMTP secrets on Hetzner; restart app
3. Send test mail to an external inbox
4. Check inbox + spam; verify From / Reply-To
5. Check Umlaute + HTML + plaintext
6. Wrong password → failed send; withdrawal row must stay; retry-email works
7. Full withdrawal receipt after a test Widerruf

## SPF / DKIM / DMARC (IONOS — verified 2026-08-27)

Mailbox/DNS host: **IONOS** for `rinq-tank.de`. Do **not** invent alternate records.

| Check | Status | Record |
|-------|--------|--------|
| SPF | OK | `v=spf1 include:_spf-eu.ionos.com ~all` |
| DKIM | OK | `s1-ionos._domainkey` → `s1.dkim.ionos.com`; `s2-ionos._domainkey` → `s2.dkim.ionos.com` |
| DMARC | OK (monitor) | `v=DMARC1; p=none;` |

Re-check: `dig +short TXT rinq-tank.de` / CNAMEs above / `TXT _dmarc.rinq-tank.de`.  
Full launch checklist (incl. header pass on a real inbox): [launch-ops.md](launch-ops.md) §3.

## Security

- Password only in env / secrets — never Git, VITE_*, logs, or API responses
- Logs: message type + reference id + recipient domain — not SMTP password

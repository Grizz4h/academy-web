# Launch ops (paid go-live)

One place for the three **ops blockers** before real money: backups, Stripe live, mail DNS.

| Track | Board | Goal |
|-------|-------|------|
| Backup restore practiced once | C5 | Prove we can recover Postgres |
| Stripe live keys + webhook | C1 / A4 | No accidental test mode; live checkout → Premium |
| SPF / DKIM / DMARC | B3 / mail | Transactional mail authenticates |

Do **not** flip Stripe to live until legal drafts are accepted for launch and you are ready for real charges.

---

## 0. Current snapshot (2026-08-27)

Checked on the Hetzner host / public DNS (no secrets printed):

| Check | Result |
|-------|--------|
| `STORAGE_BACKEND` | `postgres` |
| `/api/health` | `ok` + database `ok` |
| Stripe secret prefix | `sk_test_…` → **still TEST** |
| Webhook secret | set |
| Price id | set (`price_…`) |
| `ACADEMY_PUBLIC_URL` | `https://rinq-tank.de` |
| SMTP | configured (IONOS) |
| SPF | `v=spf1 include:_spf-eu.ionos.com ~all` |
| DKIM | `s1-ionos` + `s2-ionos` → `*.dkim.ionos.com` (present) |
| DMARC | `v=DMARC1; p=none;` (+ IONOS CNAME) |
| MX | `mx00` / `mx01.ionos.de` |

**Mail DNS:** ready enough for launch (`p=none` = monitor). Optional later: tighten DMARC after a week of clean reports.

**Stripe live:** still open (manual). Mail DNS + nightly PG dump: ready.

---

## 1. Backup (C5) — nightly dump (no Supabase Pro yet)

**Decision (2026-08-27):** Skip paid Supabase Pro/PITR for now. Use a **nightly `pg_dump`** on Hetzner instead.  
Worst-case data loss ≈ since last successful dump (~1 day). Upgrade to Pro when paying customers matter.

App JSON under `data/backups/` still does **not** replace these dumps for Postgres state.

### 1a. Automated dump (live)

| Item | Detail |
|------|--------|
| Script | `backend/scripts/pg_dump_nightly.sh` |
| Output | `data/backups/pg/academy-<UTC>.dump` (14-day retention) |
| Cron | `15 3 * * *` (Europe/Berlin) → append `cron.log` |
| Docs | [pg-backup.md](pg-backup.md) |

Verify:

```bash
ls -lh /opt/academy-web/data/backups/pg/
crontab -l | grep pg_dump
```

### 1b. Restore practice (optional but good)

Preferred: `pg_restore` into a **temporary** empty DB, not prod cutover. Steps in [pg-backup.md](pg-backup.md).

### 1c. Emergency prod restore

1. Announce downtime; `sudo systemctl stop academy-web`
2. Restore dump into a recovered/new DB; swap `DATABASE_URL` only after verify
3. `sudo systemctl start academy-web` → smoke `/api/health`, login, billing read-only

### Drill log

| Date | Who | Method | Result |
|------|-----|--------|--------|
| 2026-08-27 | Cursor + Christoph | Nightly dump installed; first dump OK (~358KB) | GO for “have a restore point”; full restore drill still optional |

---

## 2. Stripe live go-live (C1 / A4)

Stay on `sk_test_` until this checklist is complete. Live keys charge real cards.

### 2a. Stripe Dashboard (Live mode toggle)

1. Create/confirm **Live** Product + recurring **Price** → copy Live `price_…`.
2. Customer Portal: enable cancel / payment method update.
3. Branding + **Terms of service** + **Privacy policy** URLs (Live **and** Test):
   - `https://rinq-tank.de/agb`
   - `https://rinq-tank.de/datenschutz`
4. Developers → Webhooks → **Add endpoint** (Live):
   - URL: `https://rinq-tank.de/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, **`invoice.paid`** (or `invoice.payment_succeeded`)
5. Copy Live **Signing secret** (`whsec_…`).
6. Copy Live **Secret key** (`sk_live_…`).

### 2b. Hetzner `.env.local` (never commit)

Replace test values together (all three must match Live):

```bash
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…   # from the Live endpoint
STRIPE_PRICE_ID=price_…         # Live price
STRIPE_CHECKOUT_SUCCESS_URL=https://rinq-tank.de/account?checkout=success
STRIPE_CHECKOUT_CANCEL_URL=https://rinq-tank.de/account?checkout=cancel
STRIPE_PORTAL_RETURN_URL=https://rinq-tank.de/account
ACADEMY_PUBLIC_URL=https://rinq-tank.de
```

```bash
sudo systemctl restart academy-web
```

Sanity (prefix only):

```bash
set -a && source /opt/academy-web/.env.local && set +a
python3 -c "import os; k=os.environ.get('STRIPE_SECRET_KEY',''); print('mode', 'LIVE' if k.startswith('sk_live_') else 'TEST/OTHER')"
```

### 2c. Live smoke (small real charge or 100% coupon)

1. Fresh non-premium account (or admin-revoked test).
2. Upgrade → Bestellübersicht → Checkout → pay with a real card (or Live coupon).
3. Expect webhook → Premium within seconds (hard refresh if UI stale).
4. Portal: see subscription; cancel-at-period-end if testing cancel copy.
5. Optional: Widerruf within window on a **deliberate** test purchase (refunds real money).

### 2d. Abort / rollback to test

Put `sk_test_` + test `whsec_` + test `price_` back, restart. Leave the Live webhook endpoint in Dashboard but unused until next attempt.

### Go-live log

| Date | Who | Live price | Webhook events OK | First live grant OK |
|------|-----|------------|-------------------|---------------------|
| _pending_ | | | | |

When filled → flip **C1** and re-verify **A4** on live.

---

## 3. Mail DNS (SPF / DKIM / DMARC)

Provider: **IONOS** mailbox `kontakt@rinq-tank.de` (see [mail-smtp.md](mail-smtp.md)).

### Already published (verified 2026-08-27)

| Record | Value / notes |
|--------|----------------|
| SPF TXT `@` | `v=spf1 include:_spf-eu.ionos.com ~all` |
| DKIM | `s1-ionos._domainkey` → `s1.dkim.ionos.com` |
| DKIM | `s2-ionos._domainkey` → `s2.dkim.ionos.com` |
| DMARC | `_dmarc` → `v=DMARC1; p=none;` (via IONOS) |

### Quick re-check

```bash
dig +short TXT rinq-tank.de
dig +short CNAME s1-ionos._domainkey.rinq-tank.de
dig +short CNAME s2-ionos._domainkey.rinq-tank.de
dig +short TXT _dmarc.rinq-tank.de
```

### Optional hardening (later)

- After monitoring: `p=quarantine` then `p=reject` with `rua=` mailbox for reports.
- Keep Widerruf E2E mail spotcheck after any SMTP host change.

### Delivery spotcheck

```bash
cd /opt/academy-web/backend
set -a && source ../.env.local && set +a
.venv/bin/python scripts/send_test_mail.py --to you@example.com
```

Inspect headers on the received message: `spf=pass`, `dkim=pass`, `dmarc=pass` (or aligned).

---

## Order of operations (recommended)

1. ~~**C5** backup~~ — nightly dump live (Pro deferred).
2. Confirm **mail** headers still pass on a test send (DNS already OK).
3. Legal comfort check → then **Stripe live** checklist (2a–2c).
4. Update [pre-launch-board.md](pre-launch-board.md) verification log.

Related: [stripe-billing.md](stripe-billing.md), [mail-smtp.md](mail-smtp.md), [postgres-migration.md](postgres-migration.md) §7.

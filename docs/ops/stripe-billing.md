# Stripe billing (Phase 5D)

Server-side only. Grants `academy_premium` via verified webhooks — never from frontend.

## Environment (`.env.local`, not committed)

```bash
STRIPE_SECRET_KEY=sk_live_…   # or sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_ID=price_…       # recurring price for academy premium
STRIPE_CHECKOUT_SUCCESS_URL=https://your-domain/account?checkout=success
STRIPE_CHECKOUT_CANCEL_URL=https://your-domain/account?checkout=cancel
STRIPE_PORTAL_RETURN_URL=https://your-domain/account
ACADEMY_PUBLIC_URL=https://your-domain

# Transactional mail — see docs/ops/mail-smtp.md
ACADEMY_SMTP_HOST=
ACADEMY_SMTP_PORT=587
ACADEMY_SMTP_USER=kontakt@rinq-tank.de
ACADEMY_SMTP_PASSWORD=
ACADEMY_SMTP_FROM=kontakt@rinq-tank.de
ACADEMY_SMTP_SECURE=false
```

Requires `STORAGE_BACKEND=postgres` and migrations:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/001_runtime_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/002_entitlement_grants.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/003_withdrawal_requests.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/004_withdrawal_refund_email.sql
```

## Consumer checkout flow

```text
Upgrade UI → PremiumCheckoutSheet („Dein rInQ-Abo“) → Stripe Checkout → webhook → Premium
```

## Contract payment anchors (refund source of truth)

On `checkout.session.completed` and `invoice.paid` / `invoice.payment_succeeded`, the backend stores on `subscriptions`:

| Column | Meaning |
|--------|---------|
| `checkout_session_id` | Checkout Session that created the sub |
| `initial_invoice_id` | Invoice with `billing_reason=subscription_create` |
| `initial_payment_intent_id` | PaymentIntent of that invoice |
| `initial_charge_id` | Charge of that invoice (optional) |
| `contract_started_at` | From initial invoice `created` |

**Refund rule:** Widerruf → stored subscription → `initial_payment_intent_id` (or charge) → Refund.  
**No** `latest paid invoice` fallback. If anchors missing → `manual_review`.

Assumption: at most one active paid subscription per user (checkout rejects duplicates).

## Withdrawals (Postgres)

Table: `withdrawal_requests` (migration 003 + 004).

`data/academy/withdrawal_requests.json` is **not** used. No production JSON data existed at cutover; file path removed from write path.

Mails (nüchtern, HTML+Plaintext, From `rInQ Tank <kontakt@rinq-tank.de>`):

1. **Eingangsbestätigung** sofort nach bestätigtem Widerruf (keine „bereits erstattet“-Aussage)
2. **Erstattungsbestätigung** erst nach erfolgreichem Stripe-Refund

Interne Refs: `VT-…` (Vertrag), `WR-…` (Widerruf) — keine Stripe-IDs.

Status: `received` → `subscription_cancel_pending` → `refund_pending` → `premium_revoke_pending` → `email_pending` → `completed` | `manual_review`  
(+ `awaiting_email_confirm`, `outside_window`)

Idempotency key: `withdrawal-refund-{withdrawal_request_id}`

Webhook idempotency: **process then mark** `processed_webhook_events` (so Stripe retries after a mid-handler failure still re-run sync).

Account delete: cancel open Stripe subscriptions + delete Stripe customer (`billing/account_cleanup.py`) before identity CASCADE.

Admin retry:

- `POST /api/admin/billing/withdrawal/{id}/retry`
- `POST /api/admin/billing/withdrawal/{id}/retry-email`

## API

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/billing/checkout` | user | Checkout (`age_confirmed` required) |
| `GET /api/billing/offer` | user | Price snapshot |
| `POST /api/billing/portal` | user | Customer Portal |
| `GET /api/me/billing` | user | Plan + subs |
| `POST /api/billing/withdrawal-request` | optional | Widerruf |
| `POST /api/billing/withdrawal-confirm` | public | Email token confirm |
| `POST /api/webhooks/stripe` | Stripe | Events |
| `POST /api/admin/mail/test` | admin | SMTP test `{ "to": "…" }` |

## Webhook events

- `checkout.session.completed`
- `invoice.paid` / `invoice.payment_succeeded` (payment anchors)
- `customer.subscription.created|updated|deleted`

## Stripe Dashboard

1. Product + recurring Price → `STRIPE_PRICE_ID`
2. Webhook: also enable **`invoice.paid`** (or `invoice.payment_succeeded`)
3. Customer portal + ToS/Privacy URLs (`/agb`, `/datenschutz`) — **in Test- und Live-Modus jeweils setzen**
4. Checkout Terms of Service required (`consent_collection.terms_of_service=required`); Sessions senden zusätzlich `custom_text` mit direkten Links zu `/agb`, `/datenschutz`, `/widerruf` (falls Dashboard-Hyperlink im Testmodus fehlt)

## Go-live (Live keys)

**As of 2026-08-27 the server still uses `sk_test_`.** Do not mix Live price/webhook with Test secret (or the reverse).

Full checklist + smoke + rollback: **[launch-ops.md](launch-ops.md) §2**.

Minimum:

1. Live Price + Live webhook endpoint (`invoice.paid` included) + Live `whsec_`
2. Swap `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` together → `systemctl restart academy-web`
3. One live checkout → webhook → `academy_premium`

## Legal TODOs (unchanged)

- `TODO LEGAL REVIEW` 18+ / Widerrufsbelehrung
- `TODO VERTRAGSBESTÄTIGUNG` (template stub only — not sent)
- SMTP + SPF/DKIM/DMARC — see [mail-smtp.md](mail-smtp.md) / [launch-ops.md](launch-ops.md)

# Stripe billing (Phase 5D)

Server-side only. Grants `academy_premium` via verified webhooks — never from frontend.

## Environment (`.env.local`, not committed)

```bash
STRIPE_SECRET_KEY=sk_live_…   # or sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_ID=price_…       # recurring price for academy premium
STRIPE_CHECKOUT_SUCCESS_URL=https://your-domain/account?checkout=success
STRIPE_CHECKOUT_CANCEL_URL=https://your-domain/account?checkout=cancel
STRIPE_PORTAL_RETURN_URL=https://your-domain/account   # optional; defaults to ACADEMY_PUBLIC_URL/account
ACADEMY_PUBLIC_URL=https://your-domain   # fallback for success/cancel URLs
```

Requires `STORAGE_BACKEND=postgres` and Wave-1 + `002_entitlement_grants` schema.

## API

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/billing/checkout` | user | Stripe Checkout session → `{ checkout_url }` |
| `POST /api/billing/portal` | user | Stripe Customer Portal → `{ portal_url }` |
| `GET /api/me/billing` | user | Plan snapshot + subscription rows (read-only) |
| `POST /api/webhooks/stripe` | Stripe signature | Idempotent event processing |

## Webhook events (handled)

- `checkout.session.completed`
- `customer.subscription.created|updated|deleted`

Flow: webhook → `subscriptions` + legacy `entitlements` snapshot → `entitlement_grants` grant/revoke (`source=subscription`).

## Stripe Dashboard setup

1. Create Product + recurring Price → copy `price_…` to `STRIPE_PRICE_ID`
2. Webhook endpoint: `https://your-api/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.*`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`
5. **Settings → Billing → Customer portal**: Portal aktivieren (Kündigung, Zahlungsmethode)

Local testing: `stripe listen --forward-to localhost:8000/api/webhooks/stripe`

## Security

- No card data stored; Stripe Checkout only
- Webhook signature required (`STRIPE_WEBHOOK_SECRET`)
- Idempotency: `processed_webhook_events`
- Ownership: `metadata.rinq_user_id` / `client_reference_id` from authenticated checkout only

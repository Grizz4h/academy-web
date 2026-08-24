# Paywall / Stripe test account

Dedicated legacy user for testing premium gates and Stripe Checkout **without** admin bypass.

## Create or refresh

```bash
cd backend
# Optional fixed password (recommended — store in password manager, not git):
export PAYWALL_TEST_PASSWORD='your-secret-here'

.venv/bin/python scripts/paywall_test_user.py create
```

Default username: **`paywall-test`** (override with `PAYWALL_TEST_USERNAME`).

The script:
- creates `app_users` + `auth_links` + `legacy_credentials`
- ensures **no** `academy_premium` grant
- clears `subscriptions` / legacy `entitlements` rows for clean checkout retests

## Reset between Stripe tests

After a test subscription, reset local entitlement state:

```bash
.venv/bin/python scripts/paywall_test_user.py reset
```

Also cancel the test subscription in **Stripe Dashboard (Test mode)** if you want a fully clean checkout.

## Check state

```bash
.venv/bin/python scripts/paywall_test_user.py status
```

## Manual test flow

1. Log in on RinQ Tank as `paywall-test`
2. Lehrplan → A2 → **Premium freischalten** (or `/setup/A2`)
3. Stripe test card `4242 4242 4242 4242`
4. `status` → `academy_premium` active, `source=subscription`
5. A2 session start works

**Do not** add `paywall-test` to `ACADEMY_ADMIN_USERNAMES` — that would bypass the paywall.

-- RinQ Tank — Withdrawal requests + contract payment references (Paid Launch hardening)
-- Apply after 001_runtime_schema.sql + 002_entitlement_grants.sql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/003_withdrawal_requests.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Contract payment anchors on subscriptions (source of truth for refunds)
-- ---------------------------------------------------------------------------
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS checkout_session_id TEXT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS initial_invoice_id TEXT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS initial_payment_intent_id TEXT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS initial_charge_id TEXT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS contract_started_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN subscriptions.checkout_session_id IS
  'Stripe Checkout Session that created this subscription (server webhook only).';
COMMENT ON COLUMN subscriptions.initial_invoice_id IS
  'First contract invoice (billing_reason=subscription_create). Used for withdrawal refunds.';
COMMENT ON COLUMN subscriptions.initial_payment_intent_id IS
  'PaymentIntent of the initial contract invoice — exact refund target.';

-- ---------------------------------------------------------------------------
-- withdrawal_requests — Postgres source of truth (replaces JSON file)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rinq_user_id               UUID NULL
                             REFERENCES app_users (rinq_user_id) ON DELETE SET NULL,
  display_name               TEXT NULL,
  contact_email              TEXT NOT NULL,
  note                       TEXT NULL,
  status                     TEXT NOT NULL DEFAULT 'received'
                             CHECK (status IN (
                               'received',
                               'awaiting_email_confirm',
                               'subscription_cancel_pending',
                               'refund_pending',
                               'premium_revoke_pending',
                               'email_pending',
                               'completed',
                               'manual_review',
                               'outside_window'
                             )),
  email_status               TEXT NOT NULL DEFAULT 'pending'
                             CHECK (email_status IN (
                               'pending', 'confirm_sent', 'confirm_failed',
                               'sent', 'failed', 'skipped'
                             )),
  refund_status              TEXT NOT NULL DEFAULT 'pending'
                             CHECK (refund_status IN (
                               'pending', 'succeeded', 'failed',
                               'not_applicable', 'manual_review'
                             )),
  stripe_customer_id         TEXT NULL,
  stripe_subscription_id     TEXT NULL,
  stripe_checkout_session_id TEXT NULL,
  stripe_invoice_id          TEXT NULL,
  stripe_payment_intent_id   TEXT NULL,
  stripe_charge_id           TEXT NULL,
  stripe_refund_id           TEXT NULL,
  confirm_token              TEXT NULL,
  contract_start_at          TIMESTAMPTZ NULL,
  received_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at               TIMESTAMPTZ NULL,
  refund_requested_at        TIMESTAMPTZ NULL,
  refund_completed_at        TIMESTAMPTZ NULL,
  premium_revoked_at         TIMESTAMPTZ NULL,
  email_sent_at              TIMESTAMPTZ NULL,
  failure_reason             TEXT NULL,
  errors                     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT withdrawal_requests_email_nonempty
    CHECK (length(trim(contact_email)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_rinq_user_id
  ON withdrawal_requests (rinq_user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status
  ON withdrawal_requests (status);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_subscription
  ON withdrawal_requests (stripe_subscription_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_withdrawal_requests_confirm_token
  ON withdrawal_requests (confirm_token)
  WHERE confirm_token IS NOT NULL;

COMMENT ON TABLE withdrawal_requests IS
  'Consumer withdrawal declarations + processing state. Source of truth (not JSON).';

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

COMMIT;

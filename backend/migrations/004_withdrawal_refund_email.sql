-- Refund confirmation mail tracking (second transactional email after Stripe refund)
-- Apply after 003_withdrawal_requests.sql

BEGIN;

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS refund_email_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS refund_email_sent_at TIMESTAMPTZ NULL;

-- Relax/replace check: drop old constraint if present, add broader one
ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_email_status_check;
ALTER TABLE withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_refund_email_status_check;

ALTER TABLE withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_email_status_check
  CHECK (email_status IN (
    'pending', 'confirm_sent', 'confirm_failed',
    'sent', 'failed', 'skipped'
  ));

ALTER TABLE withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_refund_email_status_check
  CHECK (refund_email_status IN (
    'pending', 'sent', 'failed', 'skipped', 'not_applicable'
  ));

COMMENT ON COLUMN withdrawal_requests.email_status IS
  'Eingangsbestätigung (receipt) mail status';
COMMENT ON COLUMN withdrawal_requests.refund_email_status IS
  'Erstattungsbestätigung — only after Stripe refund succeeded';

COMMIT;

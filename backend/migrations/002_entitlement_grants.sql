-- RinQ Tank — Entitlement grants (Phase 5A)
-- Flexible feature permissions per rinq_user_id.
-- The legacy `entitlements` table in 001 remains for future Stripe plan snapshot;
-- product access checks use entitlement_grants + EntitlementRepository.

BEGIN;

CREATE TABLE IF NOT EXISTS entitlement_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rinq_user_id    UUID NOT NULL
                  REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  feature_key     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'revoked')),
  source          TEXT NOT NULL
                  CHECK (source IN ('manual', 'subscription', 'promo', 'system')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT entitlement_grants_user_feature_unique
    UNIQUE (rinq_user_id, feature_key),
  CONSTRAINT entitlement_grants_feature_key_nonempty
    CHECK (length(trim(feature_key)) > 0)
);

COMMENT ON TABLE entitlement_grants IS
  'Per-user feature grants (academy_premium, …). App authorization source of truth — not Stripe.';

CREATE INDEX IF NOT EXISTS idx_entitlement_grants_rinq_user_id
  ON entitlement_grants (rinq_user_id);

CREATE INDEX IF NOT EXISTS idx_entitlement_grants_feature_key
  ON entitlement_grants (feature_key);

CREATE INDEX IF NOT EXISTS idx_entitlement_grants_active_lookup
  ON entitlement_grants (rinq_user_id, feature_key)
  WHERE status = 'active';

ALTER TABLE entitlement_grants ENABLE ROW LEVEL SECURITY;

COMMIT;

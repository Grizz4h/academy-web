-- RinQ Tank — Wave 1 runtime schema (Phase 4C)
-- Target: Supabase Postgres (EU). Do NOT apply to production automatically.
-- Ownership key: rinq_user_id (UUID). Never email / Google subject as PK.
--
-- Access model: Backend (FastAPI) only. Browser must not mutate these tables.
-- See docs/architecture/database-schema.md

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) app_users  (IdentityRepository "identities")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_users (
  rinq_user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'disabled', 'pending_delete')),
  legacy_username  TEXT NULL,
  CONSTRAINT app_users_legacy_username_unique
    UNIQUE (legacy_username)
);

COMMENT ON TABLE app_users IS
  'App identity. rinq_user_id is the sole ownership key (Auth ≠ App identity).';
COMMENT ON COLUMN app_users.legacy_username IS
  'Normalized legacy username when present; NULL for managed-auth-only users.';

-- ---------------------------------------------------------------------------
-- 2) auth_links
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_links (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rinq_user_id       UUID NOT NULL
                     REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  provider           TEXT NOT NULL
                     CHECK (provider IN (
                       'legacy_password',
                       'supabase_google',
                       'supabase_email'
                     )),
  provider_subject   TEXT NOT NULL,
  linked_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT auth_links_provider_subject_unique
    UNIQUE (provider, provider_subject),
  CONSTRAINT auth_links_user_provider_subject_unique
    UNIQUE (rinq_user_id, provider, provider_subject)
);

COMMENT ON TABLE auth_links IS
  'Maps Managed Auth / legacy subjects to rinq_user_id. UNIQUE(provider, provider_subject) is global.';

CREATE INDEX IF NOT EXISTS idx_auth_links_rinq_user_id
  ON auth_links (rinq_user_id);

CREATE INDEX IF NOT EXISTS idx_auth_links_provider_subject
  ON auth_links (provider, provider_subject);

-- ---------------------------------------------------------------------------
-- 3) legacy_credentials  (UserCredentialRepository / users.json)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legacy_credentials (
  rinq_user_id    UUID NOT NULL UNIQUE
                  REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NULL,
  password_updated_at TIMESTAMPTZ NULL,
  CONSTRAINT legacy_credentials_username_unique UNIQUE (username),
  CONSTRAINT legacy_credentials_username_nonempty
    CHECK (length(trim(username)) > 0),
  CONSTRAINT legacy_credentials_hash_nonempty
    CHECK (length(password_hash) > 0)
);

COMMENT ON TABLE legacy_credentials IS
  'Legacy password hashes only. No new password feature; migrate/link away over time.';

-- ---------------------------------------------------------------------------
-- 4) profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  rinq_user_id          UUID PRIMARY KEY
                        REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL DEFAULT 'Spieler',
  display_name_chosen   BOOLEAN NOT NULL DEFAULT FALSE,
  -- Cosmetics / prefs / hockeyExperience / dashboardPreferences / etc.
  payload               JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at            TIMESTAMPTZ NULL,
  CONSTRAINT profiles_display_name_nonempty
    CHECK (length(trim(display_name)) > 0)
);

COMMENT ON COLUMN profiles.payload IS
  'Non-query profile fields (avatar, banner, stickers, preferences, …) as JSONB.';

-- ---------------------------------------------------------------------------
-- 5) reward_states
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_states (
  rinq_user_id               UUID PRIMARY KEY
                             REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  xp                         INTEGER NOT NULL DEFAULT 0
                             CHECK (xp >= 0),
  pux                        INTEGER NOT NULL DEFAULT 0
                             CHECK (pux >= 0),
  progression_pux_granted    INTEGER NOT NULL DEFAULT 0
                             CHECK (progression_pux_granted >= 0),
  -- unlockedAchievements, processedEvents, cosmetics, challenges, logs, …
  payload                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  bootstrap_completed_at     TIMESTAMPTZ NULL,
  last_updated_at            TIMESTAMPTZ NULL
);

COMMENT ON TABLE reward_states IS
  'Per-user reward snapshot. apply_reward_delta → single-row UPDATE in a transaction.';
COMMENT ON COLUMN reward_states.pux IS
  'Denormalized currency.PUX for fast reads/checks; keep in sync with payload.currency.PUX in app layer.';

-- ---------------------------------------------------------------------------
-- 6) sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  session_id          TEXT PRIMARY KEY,
  rinq_user_id        UUID NOT NULL
                      REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  state               TEXT NOT NULL
                      CHECK (state IN (
                        'PRE', 'P1', 'P2', 'P3', 'POST',
                        'IN_PROGRESS', 'COMPLETED', 'ABORTED'
                      )),
  module_id           TEXT NULL,
  drill_id            TEXT NULL,
  observation_scope   TEXT NULL,
  learning_area       TEXT NULL,
  lab_mode            TEXT NULL,
  session_method      TEXT NULL,
  focus               TEXT NULL,
  observed_team       TEXT NULL,
  is_dummy            BOOLEAN NOT NULL DEFAULT FALSE,
  current_phase       TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NULL,
  completed_at        TIMESTAMPTZ NULL,
  -- checkins, drafts, drills[], game_info, microfeedback, post, reflection, …
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT sessions_session_id_nonempty
    CHECK (length(trim(session_id)) > 0)
);

COMMENT ON TABLE sessions IS
  'Session documents. Relational columns for ownership/list filters; variable drill data in payload.';
COMMENT ON COLUMN sessions.payload IS
  'Complex / evolving session body (checkins, drafts, drills, game_info, microfeedback, post, …).';

CREATE INDEX IF NOT EXISTS idx_sessions_rinq_user_id
  ON sessions (rinq_user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_created
  ON sessions (rinq_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_state
  ON sessions (rinq_user_id, state);

CREATE INDEX IF NOT EXISTS idx_sessions_dummy
  ON sessions (is_dummy)
  WHERE is_dummy = TRUE;

-- ---------------------------------------------------------------------------
-- 7) Entitlement / Payment preparation (unused by product until later phase)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entitlements (
  rinq_user_id            UUID PRIMARY KEY
                          REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  plan_code               TEXT NULL,
  status                  TEXT NOT NULL DEFAULT 'none'
                          CHECK (status IN (
                            'none', 'active', 'past_due', 'canceled', 'trialing', 'incomplete'
                          )),
  external_customer_id    TEXT NULL,
  current_period_end      TIMESTAMPTZ NULL,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entitlements_external_customer_id_unique
    UNIQUE (external_customer_id)
);

COMMENT ON TABLE entitlements IS
  'Prepared for Stripe/etc. Not used by product code in 4C. Central plan view per rinq_user_id.';

CREATE TABLE IF NOT EXISTS subscriptions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rinq_user_id               UUID NOT NULL
                             REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  external_subscription_id   TEXT NOT NULL,
  external_customer_id       TEXT NULL,
  status                     TEXT NOT NULL
                             CHECK (status IN (
                               'active', 'past_due', 'canceled', 'trialing',
                               'incomplete', 'incomplete_expired', 'unpaid', 'paused'
                             )),
  price_id                   TEXT NULL,
  current_period_start       TIMESTAMPTZ NULL,
  current_period_end         TIMESTAMPTZ NULL,
  cancel_at_period_end       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw                        JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT subscriptions_external_subscription_id_unique
    UNIQUE (external_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_rinq_user_id
  ON subscriptions (rinq_user_id);

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  webhook_event_id   TEXT PRIMARY KEY,
  provider           TEXT NOT NULL DEFAULT 'stripe',
  event_type         TEXT NULL,
  processed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  rinq_user_id       UUID NULL
                     REFERENCES app_users (rinq_user_id) ON DELETE SET NULL,
  payload            JSONB NULL,
  CONSTRAINT processed_webhook_events_id_nonempty
    CHECK (length(trim(webhook_event_id)) > 0)
);

COMMENT ON TABLE processed_webhook_events IS
  'Idempotency store for payment webhooks. Survives account delete (user FK SET NULL).';

-- ---------------------------------------------------------------------------
-- 8) RLS — defense in depth (no client policies; backend uses privileged role)
-- ---------------------------------------------------------------------------
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies for anon / authenticated → deny by default for PostgREST JWT roles.
-- Supabase service_role (and table owner) bypasses RLS. FastAPI must use a
-- privileged server-side connection (service role or dedicated role with grants).
-- Intentionally empty policy set.

COMMIT;

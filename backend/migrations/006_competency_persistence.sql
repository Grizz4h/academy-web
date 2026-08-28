-- RinQ Tank — Competency persistence (Phase 4C.1)
-- Evidence events = immutable source of truth; user_competency_states = derived cache.
-- Apply manually after 001_runtime_schema.sql. Do NOT auto-apply to production.

BEGIN;

-- ---------------------------------------------------------------------------
-- evidence_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_events (
  event_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rinq_user_id       UUID NOT NULL
                     REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  drill_id           TEXT NOT NULL,
  competency_id      TEXT NOT NULL
                     CHECK (competency_id IN (
                       'scanning_identification',
                       'roles_support',
                       'space_structure',
                       'options_decisions',
                       'transition_tempo',
                       'pressure_control',
                       'systems_patterns',
                       'evidence_analysis'
                     )),
  quality            DOUBLE PRECISION NOT NULL
                     CHECK (quality >= 0 AND quality <= 1),
  assessment_source  TEXT NOT NULL
                     CHECK (assessment_source IN (
                       'structured',
                       'deterministic',
                       'ai_review'
                     )),
  created_at         TIMESTAMPTZ NOT NULL,
  engine_version     TEXT NOT NULL,
  map_hash           TEXT NULL,
  source_type        TEXT NOT NULL,
  source_id          TEXT NOT NULL,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT evidence_events_drill_id_nonempty
    CHECK (length(trim(drill_id)) > 0),
  CONSTRAINT evidence_events_source_type_nonempty
    CHECK (length(trim(source_type)) > 0),
  CONSTRAINT evidence_events_source_id_nonempty
    CHECK (length(trim(source_id)) > 0),
  CONSTRAINT evidence_events_idempotency_unique
    UNIQUE (rinq_user_id, source_type, source_id, competency_id)
);

COMMENT ON TABLE evidence_events IS
  'Immutable competency evidence. Map-derived fields (level, strength) are NOT stored — recompute from map + engine.';
COMMENT ON COLUMN evidence_events.map_hash IS
  'SHA-256 fingerprint of frozen evidence map at append time (reproducibility audit).';
COMMENT ON COLUMN evidence_events.source_type IS
  'Idempotency domain, e.g. session_submission, structured_assessment, manual_review.';
COMMENT ON COLUMN evidence_events.source_id IS
  'Stable id within source_type (e.g. session_id:drill_id:attempt).';

CREATE INDEX IF NOT EXISTS idx_evidence_events_user_created
  ON evidence_events (rinq_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_evidence_events_user_comp_created
  ON evidence_events (rinq_user_id, competency_id, created_at);

CREATE INDEX IF NOT EXISTS idx_evidence_events_user_drill
  ON evidence_events (rinq_user_id, drill_id);

-- ---------------------------------------------------------------------------
-- user_competency_states  (derived projection — safe to overwrite)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_competency_states (
  rinq_user_id            UUID NOT NULL
                          REFERENCES app_users (rinq_user_id) ON DELETE CASCADE,
  competency_id           TEXT NOT NULL
                          CHECK (competency_id IN (
                            'scanning_identification',
                            'roles_support',
                            'space_structure',
                            'options_decisions',
                            'transition_tempo',
                            'pressure_control',
                            'systems_patterns',
                            'evidence_analysis'
                          )),
  score                   DOUBLE PRECISION NOT NULL
                          CHECK (score >= 0 AND score <= 100),
  confidence              DOUBLE PRECISION NOT NULL
                          CHECK (confidence >= 0 AND confidence <= 1),
  breadth                 DOUBLE PRECISION NOT NULL
                          CHECK (breadth >= 0 AND breadth <= 1),
  evidence_count          INTEGER NOT NULL
                          CHECK (evidence_count >= 0),
  highest_evidence_level  INTEGER NOT NULL
                          CHECK (highest_evidence_level >= 0 AND highest_evidence_level <= 5),
  last_evidence_at        TIMESTAMPTZ NULL,
  engine_version          TEXT NOT NULL,
  map_hash                TEXT NULL,
  recomputed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (rinq_user_id, competency_id)
);

COMMENT ON TABLE user_competency_states IS
  'Derived competency cache. Source of truth remains evidence_events + map + engine recompute.';

CREATE INDEX IF NOT EXISTS idx_user_competency_states_user
  ON user_competency_states (rinq_user_id);

ALTER TABLE evidence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_competency_states ENABLE ROW LEVEL SECURITY;

COMMIT;

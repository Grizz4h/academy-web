BEGIN;
CREATE TABLE IF NOT EXISTS admin_audit_log (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), admin_user_id UUID NOT NULL REFERENCES app_users(rinq_user_id),
 action TEXT NOT NULL, target_reference TEXT NOT NULL, result TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log(created_at DESC);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
COMMIT;

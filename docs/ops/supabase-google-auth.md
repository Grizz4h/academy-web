# Phase 3C — Supabase Auth / Google Login (manual ops)

Production origin: `https://rinq-tank.de`  
Callback path: `https://rinq-tank.de/auth/callback`  
(www may work via the same SPA; configure both if users hit www.)

## Values you must place (do not commit secrets)

### Frontend (build-time `VITE_*`)

Create `/opt/academy-web/frontend/.env.production` (or `.env.local` for Vite):

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…   # or legacy anon key — public only
```

Then rebuild:

```bash
cd /opt/academy-web/frontend && npm run build
```

### Backend (server `.env.local`)

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
# Optional if still on legacy HS256 signing:
# SUPABASE_JWT_SECRET=…   # from Supabase JWT settings — NEVER in frontend
# Optional overrides:
# SUPABASE_JWT_AUDIENCE=authenticated
# SUPABASE_JWT_ISSUER=https://YOUR_PROJECT_REF.supabase.co/auth/v1
# SUPABASE_JWKS_URL=https://YOUR_PROJECT_REF.supabase.co/auth/v1/.well-known/jwks.json
```

Restart API after changing server env:

```bash
sudo systemctl restart academy-web
```

## Google Cloud / Supabase Console (already created — verify)

### Google Cloud OAuth client

Authorized redirect URIs must include Supabase’s callback, typically:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

(Not the RinQ URL — Google redirects to Supabase; Supabase then redirects to RinQ.)

### Supabase Auth → URL configuration

Site URL:

```text
https://rinq-tank.de
```

Redirect URLs allow-list:

```text
https://rinq-tank.de/auth/callback
https://rinq-tank.de/auth/callback?intent=link
https://www.rinq-tank.de/auth/callback
https://www.rinq-tank.de/auth/callback?intent=link
http://localhost:5173/auth/callback
http://localhost:5173/auth/callback?intent=link
```

### Account Linking (Phase 3D)

1. Legacy einloggen (z. B. Christoph).
2. Account → **Google-Konto verbinden**.
3. OAuth → Callback `?intent=link` → Backend `POST /api/me/auth/link/google` mit Legacy-Bearer + Supabase Access Token.
4. Danach Legacy **oder** Google → dieselbe `rinq_user_id`.

## Email OTP / Magic Link (Phase 3F)

In Supabase → Authentication → Providers → **Email**: enabled (OTP and/or Magic Link).

Rate limits: Supabase Auth rate limits apply to OTP send/verify. RinQ does not proxy the OTP mailer (no email stored in RinQ profiles).

Login UI: Dashboard → **Mit E-Mail anmelden** → E-Mail → Code bestätigen. Magic-Link return uses `/auth/callback` like Google.

### Supabase Auth → Providers → Google

Enabled with Google Client ID + Client Secret from Google Cloud.

## Behaviour reminder

- New Google users get a **new** `rinq_user_id` (no email merge with Christoph/Martin/Tobi).
- Legacy password login remains for existing accounts.
- Legacy signup stays closed (`ACADEMY_ALLOW_LEGACY_SIGNUP=0`).
- Google users are **not** auto-admin.

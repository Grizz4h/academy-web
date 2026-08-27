# Privacy inventory (technical, 2026-08-27)

Internal reference for `/datenschutz`. Do not invent beyond this list.

| Dienst | Zweck | Daten (typisch) | Extern |
|--------|--------|-----------------|--------|
| Hetzner (App-Server) | Hosting SPA + API | Sessions, Profile, Uploads, Logs | ja |
| IONOS | DNS Domain | DNS | ja |
| Nginx + Let’s Encrypt | TLS / Reverse Proxy | Access-Logs (Retention TODO) | LE ja |
| Supabase Auth | Google + E-Mail-OTP | E-Mail bei Supabase; bei rInQ nur `provider_subject` | ja |
| Postgres (wenn `STORAGE_BACKEND=postgres`) | Runtime-Persistenz | Profile, Rewards, Sessions, Billing | ja (Supabase/PG) |
| JSON-Dateien (Default/teilweise) | Runtime | Sessions/Rewards/Scenes/Observations | nein (Server) |
| Stripe | Abo / Checkout / Portal | Customer-/Sub-IDs, Status, Perioden; keine Karten-PAN | ja |
| OpenAI | optionale Session-Reflexion | sanitierte Session-/Antwortinhalte inkl. Freitext | ja |
| Google Fonts CDN | Typografie | IP/UA bei Font-Request | ja |
| Product Analytics | — | — | nein |
| PayPal / Apple Login / eigener Mailer / Vercel | — | — | nein (nicht im Code) |

Siehe öffentliche Erklärung: Frontend-Route `/datenschutz`.

# rInQ Pre-Launch Board (Go / No-Go)

Living checklist for the first small public launch.  
**Not** “are all features done?” — **“Can a stranger complete the money loop without us getting sued, locked out, or losing their progress?”**

Launch gate (must work end-to-end):

> Register → A1 free → understands value → A2 locked → pays → immediate access → does A2 → progress persists → cancel / delete → we can debug failures.

Related: [security-and-privacy.md](../ai-rules/security-and-privacy.md) · [stripe-billing.md](stripe-billing.md) · [postgres-migration.md](postgres-migration.md)

**Status legend:** `GO` done · `PARTIAL` exists but not launch-safe · `NO-GO` missing / untested · `LATER` consciously deferred

---

## Priority order (A → C before polish)

Recommended sequence before taking real money from strangers:

1. **B Legal / Trust** — Impressum, Datenschutz, AGB/Widerruf, age decision (blocks monetization legally)
2. **A Launch-Loop** — auth on prod domain, paywall, Stripe → grant, delete path on Postgres
3. **C Ops / Sicherheit** — webhook hardening, checkout double-buy, reflection limits, backup restore drill, minimal admin + report channel
4. **D Produkt-Klarheit** — blind tests, branding/OG/404, logo policy
5. **E Später** — Apple, curriculum versions, multi-tab locks, analytics, shop curation

Defer or date anything in A–C only with an explicit note below.

---

## A. Launch-Loop (Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| A1 | Register Google + E-Mail-OTP on prod domain | PARTIAL | Code: `frontend/src/lib/supabase.ts`, `backend/supabase_auth.py`, Phase 3C/3F. Ops: [supabase-google-auth.md](supabase-google-auth.md), [rinq-domain.md](rinq-domain.md). **Still verify** redirect URLs / mail deliverability on live domain. |
| A2 | A1 free end-to-end | PARTIAL | Free modules `T0`/`A1` in `backend/entitlements/access_config.py`; curriculum filter + session gates. **Still:** prod spotcheck with fresh account. |
| A3 | A2+ server-gated (not UI-only) | GO | `can_access` / `_require_module_access`; FE uses `premium_locked` from API. Tests: `test_entitlements_5a.py`, `5b`. Residual: full premium drill JSON may still ship in FE bundle (harden later). |
| A4 | Stripe Checkout → webhook → immediate `academy_premium` | PARTIAL | Test-mode E2E OK. Still on `sk_test_`. Live go-live: [launch-ops.md](launch-ops.md) §2 + [stripe-billing.md](stripe-billing.md). |
| A5 | Portal cancel; access until period end (copy = server) | PARTIAL | Cancel-at-period-end kept while Stripe `active`. FE `past_due`/`unpaid` copy aligned: premium paused / no false „gilt bis“ when grant revoked. Residual: grace policy still undecided. |
| A6 | Account delete incl. Supabase + grants (Postgres path) | GO | PG CASCADE + spotcheck. Stripe cancel/customer delete on delete (`billing/account_cleanup.py`, fail-closed). Export v2 Postgres-aware. |
| A7 | Session autosave + refresh resume (Mobile Safari spotcheck) | PARTIAL | Debounced drafts + localStorage in `Session.tsx`; resume from Dashboard. **Still:** Safari / lock-screen spotcheck. Multi-tab LWW = LATER. |
| A8 | No double XP on repeat-complete / dummy | GO | `processedEvents` / unit keys / dummy skip (`is_dummy`). |

---

## B. Legal / Trust (Blocker before money)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| B1 | Impressum | PARTIAL | Page + footer link live at `/impressum`. Contact confirmed: `kontakt@rinq-tank.de`. **Open:** § 18 Abs. 2 MStV legal review. |
| B2 | Datenschutz (incl. KI / Stripe / Supabase) | PARTIAL | Page live at `/datenschutz`. Contact: `kontakt@rinq-tank.de`. Still open: AVVs, log retention, KI legal basis, Fonts strategy — see TODOs on page. |
| B3 | AGB + Widerruf digitale Inhalte | PARTIAL | Draft legal pages; Bestellübersicht; Postgres `withdrawal_requests`; exact refund anchors; SMTP OK. SPF/DKIM/DMARC published (IONOS, 2026-08-27). **Open:** lawyer review; Dashboard ToS URLs (Live). |
| B4 | Age policy (18+ gate or written legal decision) | PARTIAL | Signup 18+ + Checkout Bestellübersicht Checkbox (`age_confirmed` → Stripe metadata). Kein Geburtsdatum. **Open:** formal legal sign-off. |
| B5 | No DEB/partnership certification suggestion (copy pass) | PARTIAL | Glossary/QA disclaimers exist; do one global marketing/UI copy pass before launch. |

---

## C. Ops / Sicherheit (Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| C1 | Stripe live/test keys + webhook; no accidental test mode | PARTIAL | Still `sk_test_`. Checklist: [launch-ops.md](launch-ops.md) §2. Do not mix Live/Test secrets. |
| C2 | Webhook: process-then-idempotent / reprocess on fail | GO | `handle_stripe_event` marks `processed_webhook_events` **after** successful sync; failures stay unmarked for Stripe retry. Tests in `test_billing_5d.py`. |
| C3 | Block checkout if already active/trialing | GO | `create_checkout_session` rejects active/trialing plan/sub + existing `academy_premium` grant → HTTP 409. |
| C4 | Reflection rate-limit + cost cap | PARTIAL | 8/h per user + 40/h IP on uncached generate; cached hits free. Hard $ budget still open. |
| C5 | Backup restore practiced once | GO | Nightly `pg_dump` (no Supabase Pro). First dump 2026-08-27; cron `15 3 * * *`. Docs: [pg-backup.md](pg-backup.md), [launch-ops.md](launch-ops.md) §1. Optional later: full `pg_restore` drill / Pro when customers pay. |
| C6 | Admin minimum: find user + grant/revoke | PARTIAL | API grant/revoke + `require_admin`; **no** user-search / subscription ops UI. |
| C7 | In-app “report problem” (drill id, app version) | PARTIAL | Footer + Kontakt mailto with path + app version (`buildProblemReportMailto`). Drill/session IDs optional via helper args — wire denser context from Session later if needed. |
| C8 | Security headers / HSTS / dependency audit | GO | Headers live on `rinq-tank.de` (HSTS + baseline). Runbook: [security-headers.md](security-headers.md). `pip-audit` clean; `npm audit` → react-router 7.18.2, 0 vulns; frontend build OK. CSP later. |
| C9 | Export/Delete complete on Postgres | GO | Export v2 pulls PG profile/rewards/sessions/grants + redacted billing/withdrawals; delete Stripe+CASCADE. File-only leftovers: scenes/obs/avatars (still walked). |

---

## D. Produkt-Klarheit (Soft-Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| D1 | Onboarding blind test (3–5 strangers, no coaching) | NO-GO | Tutorial engine exists (`features/tutorial`); tests not run. |
| D2 | Mobile arena/couch spotcheck (keyboard, touch) | PARTIAL | UI kit / sheets / hover policy strong; real-world pass pending. |
| D3 | Empty state without live game understandable | PARTIAL | Schedule empty in prod; no demo-scene library for users. |
| D4 | Branding pass (rInQ, OG, favicon; no Vite) | PARTIAL | Favicon/title/OG/Twitter meta in `index.html`; mix “Rink Tank” / rInQ residual in UI copy. |
| D5 | 404 + robots.txt | GO | Branded `/` catch-all `NotFound`; `public/robots.txt` + minimal `sitemap.xml`. |
| D6 | Logo/trademark risk decided (DEL logos) | PARTIAL | Logos in `public/teams/del/`; no attribution/trademark policy. |

---

## E. Consciously later (not launch-block)

- Apple Sign-In / Hide My Email
- Formal curriculum `contentVersion` / `drillVersion` + answer migration
- Multi-tab draft conflict protection
- Product analytics + consent
- Night Circuit / shop curation (cosmetic pool)
- Full admin suite (lock, ban, progress browser)
- Embedded demo scenes for drills without live games
- PayPal
- Formal competence radar / “IQ” (explicitly avoided)

---

## Ampel: original risk themes (1–20)

Cross-check from 2026-08-27 audit vs ChatGPT pre-launch list:

| # | Theme | Status |
|---|--------|--------|
| 1 | Content credibility / QA | PARTIAL |
| 2 | Login / account lifecycle | PARTIAL |
| 3 | Payment / subscription | PARTIAL |
| 4 | Privacy / data flow | PARTIAL |
| 5 | Impressum / ToS / withdrawal | PARTIAL | Impressum+Datenschutz+Kontakt live; AGB/Widerruf still missing |
| 6 | Minors / 18+ | PARTIAL | Checkbox gate shipped; legal sign-off open |
| 7 | Progress durability | GO (+ multi-tab gap) |
| 8 | Curriculum versioning | NO-GO |
| 9 | AI as coach-god | GO (intent; limits missing) |
| 10 | Competence language | GO |
| 11 | Mobile | GO |
| 12 | Onboarding clarity | GO (blind tests pending) |
| 13 | No live game situation | PARTIAL |
| 14 | Video copyright | GO (strategy) |
| 15 | Logos / trademarks | PARTIAL |
| 16 | Support / report | PARTIAL | Kontakt + Footer „Problem melden“ mailto |
| 17 | Admin backend | PARTIAL |
| 18 | Backups / restore | GO | Nightly dump; Pro/PITR deferred |
| 19 | Analytics | LATER (none by policy) |
| 20 | AI cost explosion | PARTIAL | Reflection rate-limit shipped; hard budget open |

**Banale killers already mitigated:** server ownership; premium not trusted from client; no service-role in `VITE_*`; `/dev` admin-gated in prod; dummy sessions skip grants; XP idempotency; HTTPS nginx docs.

**Still dangerous:** legal AVVs / AGB sign-off; branding mix residual; multi-tab LWW; prod/test Stripe discipline until live flip; curriculum ID renames without version.

---

## How to use this board

1. Do not start large new feature work until **A–C** are GO or explicitly dated deferred.
2. Each release before public money: re-run A4–A6 and C1 on the target environment.
3. When an item flips to GO, note date + who verified in the Notes column (or a short changelog under this heading).

### Verification log

| Date | Item | Verified by | Note |
|------|------|-------------|------|
| 2026-08-27 | Board created | Cursor audit | Initial HAVE/PARTIAL/MISSING from repo audit |
| 2026-08-27 | C3, C4, C7, D5, B1 email, B4 gate, A5 copy, OG | Cursor | Low-hanging launch pack 1–8 |
| 2026-08-27 | Mail SPF/DKIM/DMARC | Cursor | IONOS records live; see [launch-ops.md](launch-ops.md) §0/§3 |
| 2026-08-27 | C1/A4 Stripe mode | Cursor | Still `sk_test_`; live checklist documented |
| 2026-08-27 | C5 backup | Cursor + Christoph | Nightly pg_dump live; Supabase Pro deferred |
| 2026-08-27 | A6/C2/C9 lifecycle | Cursor | Stripe detach on delete; export v2 PG; webhook process-then-mark |

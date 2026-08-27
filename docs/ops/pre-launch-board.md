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
| A4 | Stripe Checkout → webhook → immediate `academy_premium` | PARTIAL | `backend/billing/*`, `POST /api/webhooks/stripe`, grant via `entitlement_grants`. Needs live/test Price + webhook + `STORAGE_BACKEND=postgres`. Ops: [stripe-billing.md](stripe-billing.md). |
| A5 | Portal cancel; access until period end (copy = server) | PARTIAL | Cancel-at-period-end kept while Stripe `active`. **Gap:** `past_due` revokes immediately — align FE copy or add grace. |
| A6 | Account delete incl. Supabase + grants (Postgres path) | PARTIAL | Self-service `POST /api/me/delete` (Phase 3G). PG CASCADE on identity; **verify** export/delete completeness under Postgres (JSON-centric leftovers / entitlements JSON). |
| A7 | Session autosave + refresh resume (Mobile Safari spotcheck) | PARTIAL | Debounced drafts + localStorage in `Session.tsx`; resume from Dashboard. **Still:** Safari / lock-screen spotcheck. Multi-tab LWW = LATER. |
| A8 | No double XP on repeat-complete / dummy | GO | `processedEvents` / unit keys / dummy skip (`is_dummy`). |

---

## B. Legal / Trust (Blocker before money)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| B1 | Impressum | PARTIAL | Page + footer link live at `/impressum` (`frontend/src/pages/Impressum.tsx`). **Open:** official rInQ contact email; § 18 Abs. 2 MStV legal review. |
| B2 | Datenschutz (incl. KI / Stripe / Supabase) | PARTIAL | Page live at `/datenschutz`. Still open: contact email, AVVs, log retention, KI legal basis, Fonts strategy — see TODOs on page. |
| B3 | AGB + Widerruf digitale Inhalte | NO-GO | Missing; legal review recommended before monetization. |
| B4 | Age policy (18+ gate or written legal decision) | NO-GO | No account age gate. |
| B5 | No DEB/partnership certification suggestion (copy pass) | PARTIAL | Glossary/QA disclaimers exist; do one global marketing/UI copy pass before launch. |

---

## C. Ops / Sicherheit (Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| C1 | Stripe live/test keys + webhook; no accidental test mode | PARTIAL | Documented; `.env.example` still thin on `STRIPE_*`. Checklist before go-live. |
| C2 | Webhook: process-then-idempotent / reprocess on fail | PARTIAL | Signature + `processed_webhook_events` exist; **mark-before-process** can skip retries after partial fail — fix before scale. |
| C3 | Block checkout if already active/trialing | NO-GO | `create_checkout_session` does not check existing sub/grant. |
| C4 | Reflection rate-limit + cost cap | NO-GO | `POST .../reflection` authenticated + cached; **no** `rate_limit` / budget. |
| C5 | Backup restore practiced once | PARTIAL | PITR notes in [postgres-migration.md](postgres-migration.md); restore drill still open. |
| C6 | Admin minimum: find user + grant/revoke | PARTIAL | API grant/revoke + `require_admin`; **no** user-search / subscription ops UI. |
| C7 | In-app “report problem” (drill id, app version) | NO-GO | Content QA process in `docs/qa/`; no product channel. |
| C8 | Security headers / HSTS / dependency audit | NO-GO | Open in security checklist. Nginx HTTPS documented. |
| C9 | Export/Delete complete on Postgres | PARTIAL | Same as A6 — make storage-backend-aware. |

---

## D. Produkt-Klarheit (Soft-Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| D1 | Onboarding blind test (3–5 strangers, no coaching) | NO-GO | Tutorial engine exists (`features/tutorial`); tests not run. |
| D2 | Mobile arena/couch spotcheck (keyboard, touch) | PARTIAL | UI kit / sheets / hover policy strong; real-world pass pending. |
| D3 | Empty state without live game understandable | PARTIAL | Schedule empty in prod; no demo-scene library for users. |
| D4 | Branding pass (rInQ, OG, favicon; no Vite) | PARTIAL | Favicon/title present; mix “Rink Tank” / rInQ; **no** OpenGraph. |
| D5 | 404 + robots.txt | NO-GO | SPA fallback only; no branded 404 / robots. |
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
| 5 | Impressum / ToS / withdrawal | NO-GO |
| 6 | Minors / 18+ | NO-GO |
| 7 | Progress durability | GO (+ multi-tab gap) |
| 8 | Curriculum versioning | NO-GO |
| 9 | AI as coach-god | GO (intent; limits missing) |
| 10 | Competence language | GO |
| 11 | Mobile | GO |
| 12 | Onboarding clarity | GO (blind tests pending) |
| 13 | No live game situation | PARTIAL |
| 14 | Video copyright | GO (strategy) |
| 15 | Logos / trademarks | PARTIAL |
| 16 | Support / report | PARTIAL | Kontakt page `/kontakt` with email + Rink About It links (not support). In-app bug report still missing. |
| 17 | Admin backend | PARTIAL |
| 18 | Backups / restore | PARTIAL |
| 19 | Analytics | LATER (none by policy) |
| 20 | AI cost explosion | NO-GO |

**Banale killers already mitigated:** server ownership; premium not trusted from client; no service-role in `VITE_*`; `/dev` admin-gated in prod; dummy sessions skip grants; XP idempotency; HTTPS nginx docs.

**Still dangerous:** double checkout; webhook retry after partial fail; legal/OG/robots/404; branding mix; reflection without rate limit; multi-tab LWW; prod/test DB discipline; delete/export E2E on Postgres+Stripe; curriculum ID renames without version.

---

## How to use this board

1. Do not start large new feature work until **A–C** are GO or explicitly dated deferred.
2. Each release before public money: re-run A4–A6 and C1 on the target environment.
3. When an item flips to GO, note date + who verified in the Notes column (or a short changelog under this heading).

### Verification log

| Date | Item | Verified by | Note |
|------|------|-------------|------|
| 2026-08-27 | Board created | Cursor audit | Initial HAVE/PARTIAL/MISSING from repo audit |

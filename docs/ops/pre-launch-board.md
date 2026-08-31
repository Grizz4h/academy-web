# rInQ Pre-Launch Board (Go / No-Go)

Living checklist for the first small public launch.  
**Not** “are all features done?” — **“Can a stranger complete the money loop without us getting sued, locked out, or losing their progress?”**

Launch gate (must work end-to-end):

> Register → A1 free → understands value → A2 locked → pays → immediate access → does A2 → progress persists → cancel / delete → we can debug failures.

Related: [security-and-privacy.md](../ai-rules/security-and-privacy.md) · [stripe-billing.md](stripe-billing.md) · [launch-ops.md](launch-ops.md) · [admin.md](admin.md)

**Status legend:** `GO` done · `PARTIAL` exists but not launch-safe · `NO-GO` missing / untested · `LATER` consciously deferred  
**Owner:** who drives the next step (empty = TBD)

---

## Next 5 (do these before new features)

| # | Action | Owner | Target | Status |
|---|--------|-------|--------|--------|
| 1 | Lawyer: AGB / Widerruf / Datenschutz / 18+ sign-off | Christoph | before Stripe Live | NO-GO |
| 2 | Stripe Live flip per [launch-ops.md](launch-ops.md) §2 | Christoph | after #1 | PARTIAL (`sk_test_`) |
| 3 | Fresh account E2E: Register → A1 → Pay → A2 → Cancel → Delete | Christoph | after #2 | NO-GO |
| 4 | Blind tests: 3–5 strangers, “Hier Link, mach A1”, no coaching | Christoph | parallel | NO-GO |
| 5 | Branding + DEL-logo policy pass | Christoph | before public share | PARTIAL |

---

## Top 30 Go / No-Go

Concrete checkboxes for the launch gate. Flip to `GO` only when verified (date + who).

| # | Check | Status | Owner | Verified | Notes |
|---|-------|--------|-------|----------|-------|
| 1 | Google login works on `rinq-tank.de` | PARTIAL | | | Ops docs exist; live spotcheck open |
| 2 | E-Mail OTP works; mail not spam | PARTIAL | | | SPF/DKIM/DMARC live; deliverability spotcheck open |
| 3 | Fresh user can finish A1 free | PARTIAL | | | Code gates OK; prod fresh-account pass open |
| 4 | A2 locked without Premium (server) | GO | | 2026-08-27 | Entitlements server-side |
| 5 | Checkout starts only when not already subscribed | GO | | 2026-08-27 | HTTP 409 |
| 6 | Stripe webhook → Premium within seconds | PARTIAL | | | Test mode OK; Live pending |
| 7 | After pay, A2 opens without support ticket | PARTIAL | | | Depends on #6 Live |
| 8 | Cancel keeps access until period end | PARTIAL | | | Code/copy OK; Live verify |
| 9 | Account delete stops Stripe + removes PG data | GO | | 2026-08-27 | Fail-closed cleanup |
| 10 | Export downloadable, no password hashes | GO | | 2026-08-27 | Export v2 |
| 11 | Session survives refresh / short lock | PARTIAL | | | Drafts exist; Safari spotcheck open |
| 12 | No double XP on repeat complete / dummy | GO | | 2026-08-27 | Idempotency |
| 13 | Impressum accurate | PARTIAL | | | Live; MStV legal review open |
| 14 | Datenschutz lists real processors (Stripe, Supabase, OpenAI) | PARTIAL | | | Page live; AVV / retention TODOs |
| 15 | AGB + Widerruf digital accepted by lawyer | NO-GO | | | Drafts + flow exist; sign-off open |
| 16 | 18+ gate on signup + checkout | PARTIAL | | | Checkbox shipped; legal sign-off open |
| 17 | No “DEB-certified / official course” claim in UI | PARTIAL | | | QA disclaimers; marketing pass open |
| 18 | Stripe Live keys only (no test mix) | PARTIAL | | | Still `sk_test_` |
| 19 | Nightly PG backup exists | GO | | 2026-08-27 | Cron + first dump |
| 20 | Restore path documented (optional drill) | GO | | 2026-08-27 | Docs; full restore optional |
| 21 | Admin: find user + see billing/progress | GO | | 2026-08-31 | `/admin` + search + support code ([admin.md](admin.md)) |
| 22 | Admin: grant/revoke / Stripe resync | GO | | 2026-08-31 | Audit log; no free-form refunds |
| 23 | “Problem melden” reachable | PARTIAL | | | Footer mailto; denser session context later |
| 24 | Security headers / HTTPS | GO | | 2026-08-27 | HSTS baseline |
| 25 | Welcome / tutorial explains product | PARTIAL | | 2026-08-31 | Welcome screen + DEV „Neues Profil“; blind tests still NO-GO |
| 26 | Blind test notes captured (3–5 people) | NO-GO | | | |
| 27 | Mobile spotcheck (keyboard / touch / arena) | PARTIAL | | | |
| 28 | Branding: no Vite / no wrong product name in chrome | PARTIAL | | | OG/favicon OK; copy mix residual |
| 29 | 404 + robots.txt | GO | | 2026-08-27 | |
| 30 | DEL logos: keep / attribute / remove decision | PARTIAL | | | Assets present; policy missing |

---

## Priority order (A → C before polish)

1. **B Legal / Trust** — Impressum, Datenschutz, AGB/Widerruf, age (blocks monetization legally)
2. **A Launch-Loop** — auth on prod, paywall, Stripe → grant, delete on Postgres
3. **C Ops / Sicherheit** — Live Stripe discipline, limits, backup, admin, report channel
4. **D Produkt-Klarheit** — blind tests, branding, logo policy
5. **E Später** — Apple, curriculum versions, multi-tab, analytics, demo scenes

---

## A. Launch-Loop (Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| A1 | Register Google + E-Mail-OTP on prod domain | PARTIAL | Ops: [supabase-google-auth.md](supabase-google-auth.md), [rinq-domain.md](rinq-domain.md). **Still verify** live redirects + mail deliverability. |
| A2 | A1 free end-to-end | PARTIAL | Free `T0`/`A1` in entitlements. **Still:** prod spotcheck with fresh account. |
| A3 | A2+ server-gated (not UI-only) | GO | `can_access` / `_require_module_access`. Residual: premium drill JSON may still ship in FE bundle. |
| A4 | Stripe Checkout → webhook → `academy_premium` | PARTIAL | Test E2E OK. Live: [launch-ops.md](launch-ops.md) §2. |
| A5 | Portal cancel; access until period end | PARTIAL | Cancel-at-period-end while Stripe `active`. Grace policy undecided. |
| A6 | Account delete incl. Supabase + grants | GO | PG CASCADE + Stripe detach fail-closed. |
| A7 | Session autosave + refresh resume | PARTIAL | Drafts + localStorage; Safari / lock-screen spotcheck open. Multi-tab = LATER. |
| A8 | No double XP on repeat-complete / dummy | GO | `processedEvents` / dummy skip. |

---

## B. Legal / Trust (Blocker before money)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| B1 | Impressum | PARTIAL | `/impressum` live. **Open:** MStV legal review. |
| B2 | Datenschutz (KI / Stripe / Supabase) | PARTIAL | `/datenschutz` live. **Open:** AVVs, log retention, KI basis, Fonts. |
| B3 | AGB + Widerruf digitale Inhalte | PARTIAL | Draft pages + withdrawal flow + SMTP/DNS. **Open:** lawyer review; Stripe Dashboard ToS URLs (Live). |
| B4 | Age policy (18+) | PARTIAL | Signup + checkout checkbox. **Open:** formal legal sign-off. |
| B5 | No DEB/partnership certification suggestion | PARTIAL | Glossary/QA disclaimers; marketing/UI copy pass open. |

---

## C. Ops / Sicherheit (Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| C1 | Stripe live/test keys; no accidental test mode | PARTIAL | Still `sk_test_`. |
| C2 | Webhook process-then-idempotent | GO | Mark processed only after success. |
| C3 | Block checkout if already active/trialing | GO | HTTP 409. |
| C4 | Reflection rate-limit + cost cap | PARTIAL | Per-user/IP limits; hard $ budget open. |
| C5 | Backup restore practiced | GO | Nightly dump; full restore drill optional. |
| C6 | Admin: find user + billing/progress + grant/resync | GO | `/admin` + support codes + audit log ([admin.md](admin.md)). Ban/lock/delete still out of scope. |
| C7 | In-app “report problem” | PARTIAL | Footer + Kontakt mailto; richer Session context later. |
| C8 | Security headers / dependency audit | GO | HSTS baseline; audits clean as of 2026-08-27. |
| C9 | Export/Delete complete on Postgres | GO | Export v2 + Stripe+CASCADE delete. |

---

## D. Produkt-Klarheit (Soft-Blocker)

| # | Item | Status | Evidence / Notes |
|---|------|--------|------------------|
| D1 | Onboarding blind test (3–5 strangers) | NO-GO | Welcome screen + tutorial + DEV „Neues Profil“ shipped 2026-08-31; **tests not run**. |
| D2 | Mobile arena/couch spotcheck | PARTIAL | UI kit strong; real-world pass pending. |
| D3 | Empty state without live game | PARTIAL | No user-facing demo-scene library. |
| D4 | Branding pass (rInQ, OG, favicon) | PARTIAL | Meta OK; residual “Rink Tank” copy possible. |
| D5 | 404 + robots.txt | GO | |
| D6 | Logo/trademark risk (DEL) | PARTIAL | Logos present; policy missing. |

---

## E. Consciously later (not launch-block)

- Apple Sign-In / Hide My Email
- Formal curriculum `contentVersion` / `drillVersion` (see below — **not needed for launch if IDs/schemas stay stable**)
- Multi-tab draft conflict protection
- Product analytics + consent
- Night Circuit / shop curation
- Admin: lock / ban / progress reset
- Embedded demo scenes for drills without live games
- PayPal
- Hard AI $ budget / circuit breaker
- Formal “IQ” marketing language (explicitly avoided)

---

## Why curriculum versioning? (and when we need it)

**Problem:** Sessions store **answers as JSON** keyed to the drill shape of that day (`observations`, option IDs, reflection keys, …). Progress/XP also keys off stable `drill_id`s.

If we later:

1. **rename** `A2_D3` → something else, or  
2. **change answer keys / option IDs / meaning** of a field, or  
3. **delete** a published drill instead of deactivating it,

then old sessions still point at the old shape. History, KI-Reflexion, Competency-Evidence and “Modul fertig” can misread or break — without anyone noticing until a user complains.

**Versioning** would mean: at answer time, store e.g. `drillVersion` / content hash, so we know which schema those answers belong to and can migrate or display “legacy”.

**For launch we do not need a full versioning system if we follow a hard rule:**

> Do not rename published `drill_id`s. Do not change the meaning of persisted answer keys for live drills. Prefer add/deprecate over rewrite. Deactivate content instead of deleting it.

That is enough until we intentionally ship incompatible curriculum rewrites — then versioning becomes a real project, not a pre-launch blocker.

---

## Ampel: risk themes (1–20)

| # | Theme | Status | Note |
|---|--------|--------|------|
| 1 | Content credibility / QA | PARTIAL | `docs/qa/` exists; process + marketing pass open |
| 2 | Login / account lifecycle | PARTIAL | Google+OTP+delete; prod spotcheck + Apple LATER |
| 3 | Payment / subscription | PARTIAL | Test OK; Live flip open |
| 4 | Privacy / data flow | PARTIAL | Inventory + page; AVV/retention open |
| 5 | Impressum / ToS / withdrawal | PARTIAL | Pages + flow; lawyer sign-off open |
| 6 | Minors / 18+ | PARTIAL | Gate shipped; legal sign-off open |
| 7 | Progress durability | GO | Multi-tab LATER |
| 8 | Curriculum versioning | LATER | See section above; process rule until then |
| 9 | AI as coach-god | GO | Intent + rubrics; hard cost cap open |
| 10 | Competence language | GO | Score ≠ XP |
| 11 | Mobile | PARTIAL | Spotcheck open (was over-marked GO) |
| 12 | Onboarding clarity | PARTIAL | Welcome shipped; blind tests open |
| 13 | No live game situation | PARTIAL | |
| 14 | Video copyright | GO | Board strategy |
| 15 | Logos / trademarks | PARTIAL | |
| 16 | Support / report | PARTIAL | Mailto + support codes |
| 17 | Admin backend | GO | Minimum for launch; ban/lock LATER |
| 18 | Backups / restore | GO | Nightly dump |
| 19 | Analytics | LATER | |
| 20 | AI cost explosion | PARTIAL | Rate limit; $ budget open |

**Banale killers already mitigated:** server ownership; premium not from client; no service-role in `VITE_*`; `/dev` admin-gated in prod; dummy skip grants; XP idempotency; HTTPS.

**Still dangerous:** legal sign-off; Stripe Live discipline; branding residual; curriculum ID renames without a migration plan; multi-tab LWW.

---

## How to use this board

1. Do not start large new feature work until **A–C** are GO or explicitly dated deferred.
2. Each release before public money: re-run items **6–9** and **18** on the target environment.
3. When an item flips to GO, fill **Verified** (date + who) in Top 30 or the log below.

### Verification log

| Date | Item | Verified by | Note |
|------|------|-------------|------|
| 2026-08-27 | Board created | Cursor audit | Initial HAVE/PARTIAL/MISSING |
| 2026-08-27 | C3, C4, C7, D5, B1 email, B4 gate, A5 copy, OG | Cursor | Low-hanging pack |
| 2026-08-27 | Mail SPF/DKIM/DMARC | Cursor | IONOS; [launch-ops.md](launch-ops.md) |
| 2026-08-27 | C1/A4 Stripe mode | Cursor | Still `sk_test_` |
| 2026-08-27 | C5 backup | Cursor + Christoph | Nightly pg_dump |
| 2026-08-27 | A6/C2/C9 lifecycle | Cursor | Stripe detach; export v2; webhook mark-after-success |
| 2026-08-31 | C6 admin, D1 welcome, board refresh | Cursor | `/admin` ops UI; welcome + DEV Neues Profil; Top 30 + versioning note |

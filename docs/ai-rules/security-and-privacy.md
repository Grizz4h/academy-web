# RinQ Tank — Security & Privacy Manifest

**Status:** verbindliche Architektur-Rule (lebendes Dokument)  
**Gilt für:** Auth, Userdaten, Datenschutz, APIs, Uploads, Payments, Premium, Admin/Dev, Logging, externe Anbieter, Backend-Exposure

Dieses Dokument ist die Security-/Privacy-Haltung des Produkts. Vor Implementierung oder Änderung in den genannten Bereichen **zuerst dieses Dokument lesen** und die geplante Lösung dagegen prüfen.

Quellen / bestehende Ops-Standards (Ergänzung, nicht Ersatz):

- Backend-Hardening Phase 1: JWT-Pflicht, Loopback-Bind, Session-Ownership
- Runtime-Daten: nicht in Git (`.gitignore` + Untrack-Doku unter `docs/ops/`)
- Nginx → FastAPI auf `127.0.0.1:8000`; Uploads nur über kontrollierte Proxy-Routen
- Geplante Production-Origin (OAuth später): `https://rinq-tank.de`

---

## Leitprinzip

RinQ Tank soll möglichst wenig personenbezogene Daten selbst besitzen und möglichst wenig sicherheitskritische Infrastruktur selbst implementieren.

**Bevorzugt**

- etablierte Managed Services
- minimale Datenspeicherung
- serverseitige Autorisierung
- pseudonyme interne IDs
- Least Privilege
- Defense in Depth

**Nicht**

- eigene Kryptografie
- eigene Payment-Datenhaltung
- eigene Passwort-Infrastruktur, wenn Managed Auth verfügbar ist
- Security nur über versteckte UI
- Client-State als vertrauenswürdige Autorisierung

---

## Bereits verbindlich beschlossene Regeln

### 1. Secrets

- Secrets niemals committen.
- Secrets niemals in Frontend-Code.
- Secrets niemals in `VITE_*`.
- Production-Secrets nur serverseitig über Environment-Konfiguration.
- Kein unsicherer Default-Fallback.
- Backend muss bei fehlendem kritischem Secret **fehlschlagen** statt unsicher weiterzulaufen.

**Bestehender Standard**

- `ACADEMY_JWT_SECRET` liegt ausschließlich serverseitig in `.env.local` (gitignored).
- Startup ohne gültiges Secret (≥32 Zeichen, nicht `dev-secret`) ist nicht erlaubt.

### 2. Backend Exposure

FastAPI darf nicht öffentlich direkt lauschen.

```text
Erlaubt:    Internet → HTTPS / Nginx → 127.0.0.1:8000 → FastAPI
Nicht:      Internet → SERVER_IP:8000
```

**Bestehender Standard:** Bind `127.0.0.1:8000` in Startskripten / Service-Unit.

### 3. Authentication

Aktueller Passwort-Login ist Übergangslösung (Legacy bleibt für Migration).

**Zielarchitektur / Phase 3C**

```text
Google → Supabase Auth → provider_subject (Supabase user id)
      → auth_links (provider=supabase_google)
      → rinq_user_id
```

- Managed Auth: **Supabase Auth** (EU-Projekt empfohlen)
- OAuth-Provider: **Google**; Passwordless: **E-Mail OTP / Magic Link** (`supabase_email`)
- Backend verifiziert Supabase Access Tokens via **JWKS** (`/auth/v1/.well-known/jwks.json`); optional Legacy-HS256 nur serverseitig (`SUPABASE_JWT_SECRET`)
- Kein automatisches Account-Merging anhand E-Mail (Google- und E-Mail-Login mit gleicher Adresse bleiben getrennte RinQ-UUIDs, bis bewusst verknüpft)
- Google-/E-Mail-User werden nicht automatisch Admin
- **Phase 3D — Account Linking:** Bestehenden RinQ-Account (Legacy-Session) bewusst mit Google verknüpfen via `POST /api/me/auth/link/google` (verifiziertes Supabase-Token + aktuelle Auth). Ergebnis: mehrere `auth_links` → dieselbe `rinq_user_id`. Kein E-Mail-Merge.

**Langfristig**

- keine eigene Passwortverwaltung
- keine E-Mail als primäre App-Identität
- kein Vertrauen auf vom Client gelieferte User-ID

Ops-Doku: `docs/ops/supabase-google-auth.md`
### 4. User Identity

**Auth identity ≠ App identity.**

```text
Provider / Legacy JWT subject
      ↓
auth_links  UNIQUE(provider, provider_subject)
      ↓
rinq_user_id  (opaque UUID — sole ownership key)
```

- Legacy JWT: `sub` = normalized username (nicht die RinQ-UUID).
- Nach Auth-Auflösung arbeitet das Backend mit `AuthContext` (`rinq_user_id`, `auth_provider`, `auth_subject`, `display_name`).
- Persistenz der Identity-Schicht: `data/academy/identity_store.json` (atomar + File-Lock).
- JSON-Persistenz der App-Daten ist für OAuth-MVP akzeptabel; **spätestens vor Payment/Webhooks/Subscription-Entitlements** erneut bewerten und voraussichtlich durch transaktionale Persistenz ersetzen.

```text
Nicht:  email@example.com / username / provider sub als App-Primärschlüssel
Sondern: rinq_user_id = opaque UUID
```

### 5. Authorization / Ownership

Authentifizierung ist nicht genug.

Jede userbezogene Ressource muss serverseitig auf Ownership geprüft werden.

```text
User A → Session von User B → kein Zugriff
```

- User-ID aus JWT / Auth-Kontext verwenden.
- Niemals User-ID aus Request-Body oder Query-Parameter als Autorisierungsgrundlage vertrauen.

**Bestehender Standard:** fremde Sessions → `404` (oder konsistente Zugriffssperre); Session-Listing scoped auf Token-User.

### 6. Runtime- / Userdaten

Personenbezogene und dynamische Runtime-Daten dürfen nicht in Git landen.

Dazu zählen insbesondere:

- Accounts, Profile, Sessions, Rewards, Uploads, Observations
- userbezogene Scene-Daten

Statischer Curriculum-/Content-Code bleibt versioniert.

### 7. Payments

RinQ Tank verarbeitet keine Roh-Zahlungsdaten selbst.

```text
Stripe / Payment Provider → Checkout → Apple Pay / Google Pay / PayPal / Karte
```

RinQ Tank speichert höchstens Provider-Referenzen und Subscription-Status.

**Niemals speichern:** Kartennummern, CVV, Bankzugangsdaten, PayPal-Passwörter, Wallet-Credentials.

### 8. Subscription / Entitlements

Zahlungsstatus niemals ausschließlich im Frontend bestimmen.

```text
Nicht:  localStorage.premium = true
Ziel:   Provider → verifizierter serverseitiger Webhook → Subscription → Entitlement → Access Control
```

### 9. Premium Content

Geplant:

| Inhalt   | Zugang  |
|----------|---------|
| Track 0  | free    |
| A1       | free    |
| A2+      | premium |

- Access-Control zentral und konfigurierbar.
- Keine verteilten Drill-ID-Sonderfälle.
- Premium-Content darf langfristig nicht vollständig ungeschützt im öffentlichen Frontend-Bundle ausgeliefert werden.

### 10. Dev- / Admin-Funktionen

**Verstecken ist keine Autorisierung.**

`/dev`, Import, Admin-Funktionen und interne Tools müssen vor echter Produktion serverseitig abgesichert werden.

Eine versteckte Navigation, Secret Gesture oder nicht sichtbarer Button ist kein Security-Mechanismus.

### 11. Rewards / XP / PUX

Client-Werte sind nicht vertrauenswürdig.

Kritische Fortschritts-/Reward-Mutationen müssen langfristig serverseitig validiert werden — besonders vor Payment oder monetarisierbaren Rewards.

### 12. Uploads

Uploads werden nur über kontrollierte Server-Routen ausgeliefert (Nginx → Backend, nicht als öffentliches Filesystem-Listing ohne Proxy-Regeln).

Später prüfen:

- erlaubte Dateitypen, Größenlimits, sichere Dateinamen
- keine ausführbaren Uploads
- keine Path-Traversal-Möglichkeiten

### 13. Logging

Sicherheitsrelevante Ereignisse sollen nachvollziehbar sein:

- Login-Fehler, Auth-Fehler, Authorization-Denials, relevante Backend-Fehler

Logs dürfen **keine** Secrets, Tokens, Passwörter oder unnötige personenbezogene Daten enthalten.

### 14. Rate Limiting

Vor öffentlichem Account-/Payment-Launch Rate Limits prüfen für:

- Login, Signup, OAuth Callback
- sensible API-Mutationen, Uploads
- Payment-/Webhook-Endpunkte

### 15. Input Validation

Alle externen Inputs serverseitig validieren.

Frontend-Validation dient nur UX und ist keine Sicherheitsgrenze.

### 16. Dependencies / Supply Chain

Vor Production-Release:

- npm- und Python-Abhängigkeiten prüfen
- bekannte Vulnerabilities prüfen
- unnötige Dependencies entfernen

Keine automatischen Major-Upgrades ohne Tests.

### 17. HTTPS

Produktionszugriff ausschließlich über HTTPS.

Nginx + Certbot / Let's Encrypt sind der bestehende Standard.

### 18. Datenschutz / Datenminimierung

- Nur Daten speichern, die für das Produkt benötigt werden.
- Keine Datensammlung „für später vielleicht“.
- Kein Tracking/Analytics ohne bewusste Entscheidung.
- Kein Newsletter-/Marketing-Profil standardmäßig.
- **OAuth / Passwordless (Supabase):** RinQ persistiert nicht Provider-E-Mail, Google-Name oder Avatar als Identity. `provider_subject` = Supabase Auth User-ID. **Phase 3E:** neue Managed-Auth-User wählen einmal einen Anzeigenamen (`displayNameChosen` am Profil unter `rinq_user_id`); Google-Name höchstens ephemeral als UI-Vorschlag. Legacy- und verknüpfte Accounts werden nicht erneut gefragt. Kein Account-Merge über E-Mail.

### 19. Externe Provider

Für jeden neuen externen Anbieter prüfen:

- welche Daten übertragen werden und warum
- ob weniger Daten möglich sind
- Region / Datenverarbeitung
- Datenschutz- / DPA-Relevanz

**Eingetragen (Phase 3C):** Supabase Auth (Managed Auth); Google als OAuth-IdP hinter Supabase. Frontend nur Publishable/Anon Key (`VITE_*`). Service Role / JWT-Secret nie im Client.
### 20. Löschung und Export

Vor Public Launch muss es ein Konzept geben für:

- Account löschen
- personenbezogene Daten löschen
- relevante Daten exportieren

Keine Daten dauerhaft behalten, wenn sie nicht mehr benötigt werden.

---

## Geplante noch offene Security-Arbeit (Roadmap)

### Vor OAuth

- [x] `/dev` und interne Navigation absichern (Phase 3B — Production: Admin/`is_admin`, Vite DEV frei)
- [x] Import-Endpunkte mit echter Admin-Rolle schützen (`require_admin` + `ACADEMY_ADMIN_USERNAMES` / `role=admin`)
- [x] offenen Signup- / Legacy-Login bewerten (`ACADEMY_ALLOW_LEGACY_SIGNUP`, Login bleibt)
- [x] UUID-Foundation / Identity-Layer (Phase 3A) — Auth≠App-ID; Ownership über `rinq_user_id`
- [x] Rate Limits MVP für Login/Signup/Admin-APIs + Security-Logging ohne Secrets
- [x] Managed Auth / Google via Supabase (Phase 3C) — JWKS-Verify, `supabase_google` auth_links, kein E-Mail-Merge
- [x] Account Linking Legacy↔Google (Phase 3D) — verifiziert unter bestehender Session, kein E-Mail-Merge
- [x] First-Login Display-Name Onboarding (Phase 3E) — `needs_display_name` / `displayNameChosen`, kein E-Mail-Bezug
- [x] Passwordless E-Mail via Supabase (Phase 3F) — `supabase_email`, OTP/Magic Link, kein E-Mail-Merge

### Vor Payment

- [ ] Rewards / XP / PUX serverseitig härten
- [ ] Entitlement-System
- [ ] Premium-Content serverseitig schützen
- [ ] Rate Limits
- [ ] Input-Validation-Audit
- [ ] Payment-Webhook-Verification
- [ ] Logging / Alerting

### Vor Public Launch

- [ ] Dependency-Audit
- [ ] Security-Header-Audit
- [ ] HTTPS / HSTS prüfen
- [ ] Backup- / Restore-Konzept
- [ ] Datenschutz-Dokumentation
- [ ] Lösch- / Export-Prozess
- [ ] strukturierter Security Review

### Später / High Assurance

- [ ] OWASP ASVS Review
- [ ] externer Security Review / Pentest
- [ ] regelmäßige Dependency- / Security-Checks

---

## Mandatory Security & Privacy Check

Before implementing or modifying any feature involving:

- authentication
- authorization
- user accounts
- personal data
- payments
- subscriptions
- premium access
- uploads
- external providers
- admin/dev functionality
- logging
- API exposure

the implementation must first be checked against this document.

If a requested implementation conflicts with an existing security or privacy principle:

1. do not silently bypass the rule,
2. report the conflict,
3. propose the safer architecture,
4. only change the principle explicitly and document why.

---

## Living Document Rule

Dieses Dokument ist lebend.

- Wenn wir eine neue Security-/Privacy-Entscheidung treffen, muss sie hier ergänzt werden.
- Wenn bestehende Architektur geändert wird, muss geprüft werden, ob dieses Dokument aktualisiert werden muss.
- Roadmap-Items, die erledigt sind, hier als **beschlossene Regel** (mit Verweis auf Code/Ops) nachziehen und in der Roadmap abhaken.

Neue Provider (z. B. Managed Auth, Stripe, Webhooks, Backups) und neue Datenflüsse gehören ausdrücklich in dieses Manifest — nicht nur in Feature-Tickets.

# Content QA Review — D4 (Sidequest / Deprecated)

**Status:** `CONTENT + EVIDENCE APPROVED` *(als Sidequest-Artefakt)* · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `D4`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `D4` *(Rewrite 2026-08-24: Overtime-Lehrkern entfernt; Sidequest-/Deprecated-Framing)*  
**Produkt-Status:** `active: false` · `deprecated: true` · `sidequest_category: numerical_situation`  
**UI:** `numerical_situation_sidequest` in `frontend/src/utils/sessionSidequests.ts`  
**Regulärer Track D:** endet bei **D3** (Entries & Clears)

---

## Framing (wichtig)

| Aspekt | Ist-Zustand |
|--------|-------------|
| Rolle | **Kein** Pflicht-5-Drill-Hauptmodul |
| Erfassung | Opportunistisch: Special Teams → Numerical Situation (6v5, 5v3, Empty Net, …) |
| Drills im JSON | 4× dünne `period_checkin` (Legacy) |
| Review-Zweck | Legacy-Inhalt + Theory nicht irreführend; Claims ehrlich als Sidequest |

Dieser Review **aktiviert D4 nicht** und schlägt keinen 5-Drill-Rebuild vor.

---

## Executive Summary

| Metrik | D4 |
|--------|-----|
| BLOCKER | **0** *(Theory: OT-Vermischung + „Pflicht-Track“-Framing resolved)* |
| MAJOR | **0** |
| MINOR | **4** |
| RECOMMENDED Evidence | **4** → **verified** (MODERATE) |
| Human REQUIRED | **4** |

---

## 1. Track-/Sidequest-Ziel

**Outcome (wenn Situation auftritt):** Struktur klar/instabil/chaotisch → Entscheidung geduldig/forciert/panisch → Risiko abgesichert/teilweise/ungesichert → Teamruhe — **getrennt vom Tor/Empty-Net-Gegentor**.

**Nicht:** Overtime-Systeme, Pull-Timing-Analytics, Ersatz für D1–D3.

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| D4-C0 | D4 = deprecated Sidequest, nicht Pflicht-Track | module meta + theory | RINQ_MODEL | **verified** | MODERATE | Curriculum flags + sessionSidequests | HR REQUIRED (Produkt) |
| D4-C1 | 6v5 braucht Struktur/Rollen trotz Extra-Angreifer | D4_D1 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-D4-01 | HR REQUIRED |
| D4-C2 | Entscheidungsqualität unter Stress ≠ Tor | D4_D2 | RINQ_MODEL | **verified** | MODERATE | — (Didaktik) | Labels „panisch“ · HR |
| D4-C3 | Risiko/Absicherung: Verlust kann einkalkuliert sein | D4_D3 | COACHING_CONVENTION + RINQ_MODEL | **verified** | MODERATE | SRC-D4-01 | HR REQUIRED |
| D4-C4 | Kollektive Ruhe ist beobachtbarer Faktor | D4_D4 | RINQ_MODEL + INTERPRETATION | **verified** | MODERATE | — | HR REQUIRED |
| D4-C5 | Overtime ist nicht D4-Kern | theory (fix) | RINQ_MODEL | model | — | — | Legacy OT entfernt ✓ |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul-Status | **ok** | Sidequest/Deprecated explizit |
| Sections decken Legacy-Drills | **ok** | D1–D4 |
| Keine OT als Lehrkern | **ok** | nach Rewrite |
| Observation-before-Evaluation | **teilweise** | Goals/Hints noch „bewerten“ / „gute Entscheidungen“ — MINOR |
| D3 → D4 Pflichtkette | **korrigiert** | D3 Theory Next-Hint auf Sidequest umgestellt |

---

## 3. Drill Alignment

| Drill | Lernziel | Raster | Absolut? |
|-------|----------|--------|----------|
| D4_D1 | Struktur | klar / instabil / chaotisch | Expl: Chaos≠Risiko — ok; dünn |
| D4_D2 | Entscheidung | geduldig / forciert / panisch | Hint „Gute Entscheidungen bleiben gut“ |
| D4_D3 | Risiko | abgesichert / teilweise / ungesichert | Hint moralisierend („kein Mut“) |
| D4_D4 | Ruhe | ruhig / angespannt / chaotisch | Interpretationsnah |

**Kette:** keine D5-Synthese; passt zu Sidequest-Dünne.

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **D3 regulär Ende** | ✓ (Curriculum + Theory Fix) |
| **Sidequest-Familie** | 6v5 / 5v3 / Empty Net — nicht OT-Modul |
| **Nicht D4** | PP/PK In-Zone, Entries, OZ-Systeme |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| D4-MIN-001 | Goals: „**Bewerte** Entscheidungen…“ | „Ordne … ein“ / Observation-first |
| D4-MIN-002 | D4_D2 Hint: „**Gute** Entscheidungen bleiben gut…“ | Neutraler |
| D4-MIN-003 | D4_D3 Hint: „kein Mut, sondern Kontrollverlust“ | Weniger moralisierend |
| D4-MIN-004 | Legacy-Drills sehr dünn vs. Sidequest-Templates | Prüfen ob UI-Templates die Drills ersetzen (Produkt) |

Keine Curriculum-Aktivierung / kein Drill-Rebuild in diesem Pass.

---

## 6. Evidence

Quellen: [`docs/qa/sources/d4-sources.md`](../sources/d4-sources.md) · 4× MODERATE (+ C0 Modell)

---

## 7. Release Status

| Layer | Status |
|-------|--------|
| Content (Legacy-Drills) | APPROVED *as deprecated sidequest artifact* |
| Evidence | APPROVED |
| theoryData | **aligned** (Sidequest-Frame) |
| Human | **offen** (4× REQUIRED inkl. Produkt-Framing C0) |
| Produkt | bleibt **inactive / deprecated** |

---

*Ende Review D4 Sidequest — 2026-08-24*

# Content QA Review — C3

**Status:** `CONTENT + EVIDENCE APPROVED` · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `C3`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `C3` *(Rewrite 2026-08-24: Legacy „2-3 / 1-2-2 / 1-3-1 / Low Cycle / Point Play“ als Lehrkern entfernt)*  
**Vorgänger:** C2 · **Nachfolger:** Ende Track C (Gameplan / Special Teams später)

---

## Executive Summary

| Metrik | C3 |
|--------|-----|
| BLOCKER | **0** *(Theory-BLOCKER resolved: Spielzug-/Systemnamen-first vs. Struktur-first)* |
| MAJOR | **0** |
| MINOR | **3** |
| RECOMMENDED Evidence | **5** → **verified** (MODERATE) |
| Human REQUIRED | **5** |

---

## 1. Track-Ziel

**Outcome:** In der Angriffszone: besetzte/freie Räume → Verbindungen → Bewegungswirkung → Vorteilnutzung (≠ Ergebnis) → Muster — **Struktur vor Spielzügen**, ohne Gameplan/Special Teams.

**Voraussetzungen:** C2 Neutral Zone.

**Bewusst nicht:** Umbrella/2-3/Cycle als Auswendiglernen, NZ-Eintritt (C2), Gameplan/Special Teams/Spielmanagement.

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| C3-C1 | Besetzte vs. verfügbare OZ-Räume | C3_D1 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C3-01, SRC-C3-02 | HR REQUIRED |
| C3-C2 | Verbindungen / Spielbarkeit zwischen Angreifern | C3_D2 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C3-01 | HR REQUIRED |
| C3-C3 | Bewegung/Rotation erzeugt Defensivreaktion + Vorteil | C3_D3 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C3-02 | HR REQUIRED |
| C3-C4 | Anschlussentscheidung nach Vorteil ≠ Outcome | C3_D4 | RINQ_MODEL + COACHING_CONVENTION | **verified** | MODERATE | SRC-C3-01 | HR REQUIRED |
| C3-C5 | Offensive Muster / Prinzipien ohne Systemlabel zuerst | C3_D5 | RINQ_MODEL | **verified** | MODERATE | — (Didaktik) | Disclaimer ✓ · HR REQUIRED |
| C3-C6 | Struktur vor Spielzügen | description + ignore | RINQ_MODEL | model | — | — | Boundary ✓ |
| C3-C7 | Keine C2/Gameplan-Vermischung | ignore + hints | RINQ_MODEL | model | — | — | ✓ |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul | **ok** | nach Rewrite |
| Sections decken Drills | **ok** | D1–D5 |
| Keine Boundary-Vorwegnahme | **ok** | C2 / Gameplan ausgelagert; Legacy-Namen nur Missverständnis |
| Observation-before-Evaluation | **ok** | |
| Nach Rework mitgezogen? | **ja** (dieser Pass) | Legacy OZ-Systemnamen-Lehrkern entfernt |

---

## 3. Drill Alignment

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Absolut? |
|-------|----------|---------|-----------|----------|----------|
| C3_D1 | Raumverteilung | C1 | C2 ✓ | semantic zones ✓ | nein |
| C3_D2 | Verbindungen | C2 | D1 ✓ | structure ✓ | nein |
| C3_D3 | Bewegungswirkung | C3 | D1–2 ✓ | directional_path ✓ | nein |
| C3_D4 | Vorteilnutzung | C4 | D1–3 ✓ | decision_cause ✓ | nein |
| C3_D5 | Muster | C5 | D1–4 ✓ | period_checkin ✓ | nein (Disclaimer) |

**Drill-Kette:** D1→D5 → Ende Track C ✓

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **C2 → C3** | description: Eintritt verhindern → Angriff strukturieren ✓ |
| **C3 → später** | D5 hint: Gameplan / Special Teams ✓ |
| **Nicht C3** | Systemnamen-first, NZ, Gameplan ✓ |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| C3-MIN-001 | D5 `summary_title`: „Offensive-Zone-Profil“ | Disclaimer stützt; Copy optional weicher |
| C3-MIN-002 | D2 „Sehr gut verbunden“ / „Zu komprimiert“ | Leicht wertend — HR |
| C3-MIN-003 | D4 Entscheidungs- + Enabling-Listen | Granularität wie C1/C2 — HR |

Keine Curriculum-Inhaltsänderung in diesem Pass (nur Theory-Seite).

---

## 6. Evidence

Quellen: [`docs/qa/sources/c3-sources.md`](../sources/c3-sources.md) · 5× MODERATE verified

---

## 7. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | APPROVED |
| Evidence | APPROVED |
| theoryData | **aligned** |
| Human | **offen** (5× REQUIRED) |

---

*Ende Review C3 — 2026-08-24*

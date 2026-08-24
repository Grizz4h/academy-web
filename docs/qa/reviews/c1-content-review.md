# Content QA Review — C1

**Status:** `CONTENT + EVIDENCE APPROVED` · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `C1`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `C1` *(Rewrite 2026-08-24: Legacy „Box / Box+1 / Switches“ als Lehrkern entfernt)*  
**Vorgänger:** B3 · **Nachfolger:** C2 — Neutral Zone Systeme verstehen

---

## Executive Summary

| Metrik | C1 |
|--------|-----|
| BLOCKER | **0** *(Theory-BLOCKER resolved: Systemnamen-first vs. Zweck-first)* |
| MAJOR | **0** |
| MINOR | **3** |
| RECOMMENDED Evidence | **5** → **verified** (MODERATE) |
| Human REQUIRED | **5** |

---

## 1. Track-Ziel

**Outcome:** In der eigenen Zone: Raumprioritäten → Struktur/Staffelung → Druck vs. Absicherung → Verantwortlichkeitswechsel → Stabilität — **Zweck vor Systemnamen**, ohne gut/schlecht.

**Voraussetzungen:** B3 defensives Teamverhalten.

**Bewusst nicht:** Box/Box+1 als Einstieg, Neutral-Zone-Eintritt (C2), Angriffsentwicklung (C3), B3-Sequenzen erneut als Hauptthema.

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| C1-C1 | Raumprioritäten: geschützt / gefährlich / zugelassen | C1_D1 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C1-01, SRC-C1-02 | HR REQUIRED |
| C1-C2 | Struktur = Staffelung/Abstände/Raumfunktion | C1_D2 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C1-01 | HR REQUIRED |
| C1-C3 | Druck vs. Absicherung/Kontrolle (+ Absicherung hinter Zugriff) | C1_D3 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C1-01, SRC-B3-01 | HR REQUIRED |
| C1-C4 | Verantwortlichkeitswechsel / Übergaben | C1_D4 | COACHING_CONVENTION + RINQ_MODEL | **verified** | MODERATE | SRC-C1-02 | HR REQUIRED |
| C1-C5 | Systemstabilität ohne gut/schlecht / ohne erzwungenen Namen | C1_D5 | RINQ_MODEL | **verified** | MODERATE | — (Didaktik) | Disclaimer im Config ✓ · HR REQUIRED |
| C1-C6 | Zweck vor Systemnamen | description + ignore | RINQ_MODEL | model | — | — | Boundary ✓ |
| C1-C7 | Keine Neutral Zone in C1 | ignore + D5 hint | RINQ_MODEL | model | — | — | → C2 ✓ |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul | **ok** | nach Rewrite |
| Sections decken Drills | **ok** | D1–D5 |
| Keine Boundary-Vorwegnahme | **ok** | C2/C3 ausgelagert; Box nur als Missverständnis |
| Observation-before-Evaluation | **ok** | |
| Nach Rework mitgezogen? | **ja** (dieser Pass) | Legacy Systemnamen-Lehrkern entfernt |

---

## 3. Drill Alignment

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Absolut? |
|-------|----------|---------|-----------|----------|----------|
| C1_D1 | Raumprioritäten | C1 | B3 ✓ | system_observation / paint ✓ | nein |
| C1_D2 | Struktur / Staffelung | C2 | D1 ✓ | clickable structure ✓ | nein |
| C1_D3 | Druck vs. Kontrolle | C3 | D1–2 ✓ | trigger marker ✓ | nein (dichte Optionen) |
| C1_D4 | Verantwortlichkeitswechsel | C4 | D1–3 ✓ | before/after ✓ | nein |
| C1_D5 | Stabilität / Profil | C5 | D1–4 ✓ | period_checkin ✓ | nein (Disclaimer) |

**Drill-Kette:** D1→D5→C2 ✓

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **B3 → C1** | description: Verhalten → Ordnung/Zweck ✓ |
| **C1 → C2** | D5 hint: Neutral Zone ✓ |
| **Nicht C1** | Systemnamen als Lernziel, NZ, C3 ✓ |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| C1-MIN-001 | D5 `summary_title`: „Defensivprofil“ | Optional „beobachtete Stabilität“ — Disclaimer stützt schon |
| C1-MIN-002 | D3 Optionstiefe (Trigger × Ausführung × Coverage × Timing) | Human Review: zu granular für Beobachtungsmaske? |
| C1-MIN-003 | Paint-Label „Gefährlicher Raum“ | Kann als „für uns gefährlich“ oder „für Gegner wertvoll“ gelesen werden — Glossar klärt |

Keine Curriculum-Inhaltsänderung in diesem Pass (nur Theory-Seite).

---

## 6. Evidence

Quellen: [`docs/qa/sources/c1-sources.md`](../sources/c1-sources.md) · 5× MODERATE verified

---

## 7. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | APPROVED |
| Evidence | APPROVED |
| theoryData | **aligned** |
| Human | **offen** (5× REQUIRED) |

---

*Ende Review C1 — 2026-08-24*

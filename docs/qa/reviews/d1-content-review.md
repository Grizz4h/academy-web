# Content QA Review — D1

**Status:** `CONTENT + EVIDENCE APPROVED` · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `D1`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `D1` *(Rewrite 2026-08-24: generische PP-Theorie → Drill-Kette Vorteil/Rollen/PK-Bewegung/Attacke/Profil)*  
**Vorgänger:** C3 · **Nachfolger:** D2 — Penalty Killing Reads

---

## Executive Summary

| Metrik | D1 |
|--------|-----|
| BLOCKER | **0** *(Theory-Alignment-BLOCKER resolved)* |
| MAJOR | **0** |
| MINOR | **3** |
| RECOMMENDED Evidence | **5** → **verified** (MODERATE) |
| Human REQUIRED | **5** |

---

## 1. Track-Ziel

**Outcome:** Powerplay In-Zone: lokaler Überzahlvorteil → fünf Funktionen → PK bewegen → Attack-Trigger → Profil — **ohne Systemnamen zuerst**, Entscheidungen getrennt vom Torerfolg.

**Voraussetzungen:** Track C Systemverständnis (OZ-Struktur hilft, ist aber nicht D1-Kern).

**Bewusst nicht:** Entry als Hauptthema, Clearing/PK-Detail (D2), Umbrella/1-3-1 als Lernziel, Torquote als Qualität.

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| D1-C1 | Überzahlvorteil ist lokal (Raum + Signal) | D1_D1 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-D1-01, SRC-D1-02 | HR REQUIRED |
| D1-C2 | Fünf Funktionen gleichzeitig (High/Halfwall/Bumper/NF …) | D1_D2 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-D1-01 | HR REQUIRED |
| D1-C3 | PP bewegt PK → neue Öffnung | D1_D3 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-D1-01 | HR REQUIRED |
| D1-C4 | Attacke folgt Signal (Control→Attack), ≠ Tor | D1_D4 | RINQ_MODEL + COACHING_CONVENTION | **verified** | MODERATE | SRC-D1-02 | HR REQUIRED |
| D1-C5 | PP-Profil aus Mustern, ohne Systemlabel | D1_D5 | RINQ_MODEL | **verified** | MODERATE | — (Didaktik) | Disclaimer ✓ · HR REQUIRED |
| D1-C6 | Keine Systemnamen zuerst | ignore + D5 | RINQ_MODEL | model | — | — | Boundary ✓ |
| D1-C7 | Entry/Clearing nicht Hauptthema | ignore | RINQ_MODEL | model | — | — | → D2 ✓ |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul | **ok** | nach Rewrite |
| Sections decken Drills | **ok** | D1–D5 |
| Keine Boundary-Vorwegnahme | **ok** | D2/Entry ausgelagert |
| Observation-before-Evaluation | **ok** | |
| Nach Rework mitgezogen? | **ja** (dieser Pass) | |

---

## 3. Drill Alignment

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Absolut? |
|-------|----------|---------|-----------|----------|----------|
| D1_D1 | Lokaler Vorteil | C1 | C ✓ | semantic zones ✓ | nein |
| D1_D2 | Funktionen/Rollen | C2 | D1 ✓ | structure ✓ | nein |
| D1_D3 | PK bewegen | C3 | D1–2 ✓ | directional ✓ | nein |
| D1_D4 | Attack-Trigger | C4 | D1–3 ✓ | decision_cause ✓ | MINOR Hint |
| D1_D5 | Profil | C5 | D1–4 ✓ | period_checkin ✓ | nein (Disclaimer) |

**Drill-Kette:** D1→D5→D2 ✓

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **C3 → D1** | OZ-Struktur → Special Teams PP ✓ |
| **D1 → D2** | D5 hint PK ✓ |
| **Nicht D1** | Entry/Clearing/Systemnamen/Torquote ✓ |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| D1-MIN-001 | D1_D4 Hint: „Ein **gutes** Powerplay greift nicht…“ | Neutral: „Ein Powerplay greift oft nicht bei jeder Gelegenheit…“ |
| D1-MIN-002 | Module goals: „Erkenne grundlegende Powerplay-**Setups**“ | Spannungsfeld zu ignore Systemnamen — „Strukturen/Funktionen“? |
| D1-MIN-003 | Englische UI-Labels (Bumper, Seam, Halfwall) | Glossar + optional DE; HR |

Keine Curriculum-Inhaltsänderung in diesem Pass (nur Theory-Seite).

---

## 6. Evidence

Quellen: [`docs/qa/sources/d1-sources.md`](../sources/d1-sources.md) · 5× MODERATE verified

---

## 7. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | APPROVED |
| Evidence | APPROVED |
| theoryData | **aligned** |
| Human | **offen** (5× REQUIRED) |

---

*Ende Review D1 — 2026-08-24*

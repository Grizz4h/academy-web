# Content QA Review — C2

**Status:** `CONTENT + EVIDENCE APPROVED` · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `C2`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `C2` *(Rewrite 2026-08-24: Legacy „1-1-3 / 1-3-1 / 1-2-2 / Regroup“ als Lehrkern entfernt)*  
**Vorgänger:** C1 · **Nachfolger:** C3 — Offensive Zone Systeme verstehen

---

## Executive Summary

| Metrik | C2 |
|--------|-----|
| BLOCKER | **0** *(Theory-BLOCKER resolved: Formationszahlen-first vs. Prinzip-first)* |
| MAJOR | **0** |
| MINOR | **3** |
| RECOMMENDED Evidence | **5** → **verified** (MODERATE) |
| Human REQUIRED | **5** |

---

## 1. Track-Ziel

**Outcome:** In der Neutral Zone: geschlossene/angebotene Wege → Staffelung → Lenkung → Anpassung nach Durchbruch → Profil — **Prinzip vor Systemnamen**, ohne Schuldzuweisung und ohne gut/schlecht.

**Voraussetzungen:** C1 eigene Zone.

**Bewusst nicht:** Forecheck-Namen auswendig, Slot/eigene Zone (C1), Angriffsentwicklung (C3), B3-Zugriff als alleinige Erklärung.

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| C2-C1 | Geschlossene vs. angebotene Wege / Korridore | C2_D1 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C2-01, SRC-C1-01 | HR REQUIRED |
| C2-C2 | Staffelung: Ebenen, Abstände, Breite | C2_D2 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C2-01, SRC-C2-02 | HR REQUIRED |
| C2-C3 | Lenkung = angebotene Entscheidung (Bande, Dump, Tempo …) | C2_D3 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-C2-03, SRC-C2-01 | HR REQUIRED |
| C2-C4 | Anpassung nach Überspielen der ersten Ebene | C2_D4 | COACHING_CONVENTION + RINQ_MODEL | **verified** | MODERATE | SRC-C2-02 | HR REQUIRED · Boundary B3 |
| C2-C5 | NZ-Profil aus Prinzipien, ohne Systemlabel zuerst | C2_D5 | RINQ_MODEL | **verified** | MODERATE | — (Didaktik) | Disclaimer ✓ · HR REQUIRED |
| C2-C6 | Prinzip vor Formationszahlen | description + ignore | RINQ_MODEL | model | — | — | Boundary ✓ |
| C2-C7 | Keine C1/C3-Vermischung | ignore + hints | RINQ_MODEL | model | — | — | ✓ |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul | **ok** | nach Rewrite |
| Sections decken Drills | **ok** | D1–D5 |
| Keine Boundary-Vorwegnahme | **ok** | C1/C3/B3 ausgelagert; Formationszahlen nur Missverständnis |
| Observation-before-Evaluation | **ok** | |
| Nach Rework mitgezogen? | **ja** (dieser Pass) | Legacy 1-x-x-Lehrkern entfernt |

---

## 3. Drill Alignment

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Absolut? |
|-------|----------|---------|-----------|----------|----------|
| C2_D1 | Wege zu/offen | C1 | C1 ✓ | corridor_selection ✓ | nein |
| C2_D2 | Staffelung | C2 | D1 ✓ | structure ✓ | nein |
| C2_D3 | Lenkung | C3 | D1–2 ✓ | directional_path ✓ | nein |
| C2_D4 | Recovery nach Durchbruch | C4 | D1–3 ✓ | directional_path ✓ | nein |
| C2_D5 | Profil | C5 | D1–4 ✓ | period_checkin ✓ | nein (Disclaimer) |

**Drill-Kette:** D1→D5→C3 ✓

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **C1 → C2** | description: eigene Zone → vor der Zone ✓ |
| **C2 → C3** | D5 hint: Offensive Zone ✓ |
| **B3 → C2_D4** | Systemanpassung ≠ Einzelzugriff ✓ |
| **Nicht C2** | 1-2-2-Lehre, C1 Slot, C3 Angriff ✓ |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| C2-MIN-001 | D5 `summary_title`: „Neutral-Zone-Profil“ | Disclaimer stützt; Copy optional weicher |
| C2-MIN-002 | D2 Label „Zu weit / Zu eng“ | Leicht wertend — HR |
| C2-MIN-003 | D3/D4 Optionstiefe | Wie C1_D3: granular — HR |

Keine Curriculum-Inhaltsänderung in diesem Pass (nur Theory-Seite).

---

## 6. Evidence

Quellen: [`docs/qa/sources/c2-sources.md`](../sources/c2-sources.md) · 5× MODERATE verified

---

## 7. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | APPROVED |
| Evidence | APPROVED |
| theoryData | **aligned** |
| Human | **offen** (5× REQUIRED) |

---

*Ende Review C2 — 2026-08-24*

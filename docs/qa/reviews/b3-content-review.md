# Content QA Review — B3

**Status:** `CONTENT + EVIDENCE APPROVED` · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `B3`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `B3` *(Rewrite 2026-08-24: Legacy „Defense-Detailarbeit / Gap Control / Blue Line / Net Front“ entfernt)*  
**Vorgänger:** B2 · **Nachfolger:** C1 — Defensive Zone Systeme verstehen

---

## Executive Summary

| Metrik | B3 |
|--------|-----|
| BLOCKER | **0** *(Theory-BLOCKER resolved: falsches Modul-Framing)* |
| MAJOR | **0** |
| MINOR | **3** |
| RECOMMENDED Evidence | **5** → **verified** (MODERATE) |
| Human REQUIRED | **5** |

---

## 1. Track-Ziel

**Outcome:** Erster defensiver Zugriff → Wirkung (Zeit/Raum/Optionen) → Teamunterstützung → Sequenzverlauf → vorsichtige Muster — **ohne Systeme**, ohne Spielernote, getrennt vom Puckgewinn.

**Voraussetzungen:** B2 Druckentscheidungen; A2/B2 Zeit-Raum-Optionen als Wirkungssprache.

**Bewusst nicht:** Forecheck-Systeme (1-2-2), Box+1, Zonenorganisation (C), Defense-Rollenkurs (Gap/Blue Line/Net Front als Lehrkern).

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| B3-C1 | Erster aktiver defensiver Druck (wer/wo) | B3_D1 | COACHING_CONVENTION + RINQ_MODEL | **verified** | MODERATE | SRC-B3-01, SRC-01 | HR REQUIRED |
| B3-C2 | Wirkung = Zeit / Raum / Optionen (≠ Puckgewinn) | B3_D2 | COACHING_CONVENTION | **verified** | MODERATE | SRC-B3-01, SRC-B2-01 | HR REQUIRED |
| B3-C3 | Support: Timing + Funktion (Passweg/Raum/Druck/Übernahme) | B3_D3 | RINQ_TAXONOMY + COACHING_CONVENTION | **verified** | MODERATE | SRC-B3-01, SRC-01 | HR REQUIRED |
| B3-C4 | Sequenz: Struktur erhalten / verschiebt / bricht | B3_D4 | RINQ_MODEL | **verified** | MODERATE | SRC-B3-02 | HR REQUIRED |
| B3-C5 | Muster-Typen (aggressiv / lenken / kompakt / reaktiv) | B3_D5 | RINQ_MODEL | **verified** | MODERATE | — (Didaktik) | Key `patternIdentity` · HR REQUIRED |
| B3-C6 | Keine Systemlehre in B3 | ignore + description | RINQ_MODEL | model | — | — | Boundary C ✓ |
| B3-C7 | Zugriff ≠ Ergebnis | D1–D5 | RINQ_MODEL | model | — | — | Observation-before-evaluation |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul | **ok** | nach Rewrite |
| Sections decken Drills | **ok** | D1–D5 |
| Keine Boundary-Vorwegnahme | **ok** | C1/C2 explizit ausgelagert |
| Observation-before-Evaluation | **ok** | |
| Nach Rework mitgezogen? | **ja** (dieser Pass) | Legacy Gap/Blue Line/Net Front entfernt |

---

## 3. Drill Alignment

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Absolut? |
|-------|----------|---------|-----------|----------|----------|
| B3_D1 | Erster Zugriff | C1 | B2 ✓ | defensive_observation ✓ | nein |
| B3_D2 | Wirkung Zeit/Raum/Optionen | C2 | A2/B2 ✓ | gleich | nein |
| B3_D3 | Teamunterstützung | C3 | D1–2 ✓ | gleich | nein |
| B3_D4 | Sequenzverlauf | C4 | D1–3 ✓ | gleich | nein |
| B3_D5 | Muster | C5 | D1–4 ✓ | gleich | nein (Didaktik warnt vor Identität) |

**Drill-Kette:** D1→D5→C1 ✓

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **B2 → B3** | description: Teamkontrolle statt Einzelentscheidung ✓ |
| **B3 → C1** | D5 hint: Zweck vor Systemnamen; Neutral Zone → C2 ✓ |
| **Nicht B3** | 1-2-2, Box+1, Gap-Control-Kurs ✓ (Curriculum ignore + Theory Rewrite) |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| B3-MIN-001 | Config-Key / Framing `patternIdentity` | Optional umbenennen / Copy „heutige Tendenz“ |
| B3-MIN-002 | D4 Reflection „**gute** Unterstützung“ | Neutraler: „rechtzeitige Unterstützung“ |
| B3-MIN-003 | D2 UI-Strings ohne Umlaute (`frueher`, `haeufigsten`) | Cosmetik bei nächstem Copy-Pass |

Keine Curriculum-Inhaltsänderung in diesem Pass (nur Theory-Seite).

---

## 6. Evidence

Quellen: [`docs/qa/sources/b3-sources.md`](../sources/b3-sources.md) · 5× MODERATE verified

---

## 7. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | APPROVED |
| Evidence | APPROVED |
| theoryData | **aligned** |
| Human | **offen** (5× REQUIRED) |

---

*Ende Review B3 — 2026-08-24*

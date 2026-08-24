# Content QA Review — B2

**Status:** `CONTENT + EVIDENCE APPROVED` · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `B2`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `B2` *(Rewrite 2026-08-24: Legacy „Winger-Detailarbeit“ entfernt)*  
**Vorgänger:** B1 · **Nachfolger:** B3 — Defensive Stabilität & Zugriff

---

## Executive Summary

| Metrik | B2 |
|--------|-----|
| BLOCKER | **0** *(Theory-BLOCKER resolved: falsches Modul-Framing)* |
| MAJOR | **0** |
| MINOR | **2** |
| RECOMMENDED Evidence | **5** → **verified** (MODERATE) |
| Human REQUIRED | **5** |

---

## 1. Track-Ziel

**Outcome:** Druckfaktoren, versuchte Lösungen, Ursachen unter Bedingungen, erste Anschlussentscheidung nach Puckgewinn, vorsichtige Muster — **getrennt vom Ergebnis**, ohne Spielernote.

**Voraussetzungen:** B1 Rolle/Center; A3 Transitionsmoment. Ignore-Listen blockieren Wiederholung ✓

**Bewusst nicht:** Center-Spezialisierung, Transition-Grundlagen, Systeme/Special Teams, defensive Teamkontrolle (B3)

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| B2-C1 | Druck = Zeit, Raum, Gegner, wenige Optionen | B2_D1 | COACHING_CONVENTION + RINQ_TAXONOMY | **verified** | MODERATE | SRC-B2-01, SRC-B2-02, SRC-01 | HR REQUIRED |
| B2-C2 | Versuchte Lösung: Pass / Carry / Sichern / Befreiung | B2_D2 | RINQ_TAXONOMY | **verified** | MODERATE | SRC-08, SRC-01 | Sichern ≠ A1-Funktion · HR REQUIRED |
| B2-C3 | Ursache aus Bedingungen, nicht aus Outcome | B2_D3 | COACHING_CONVENTION + RINQ_MODEL | **verified** | MODERATE | SRC-B2-01, SRC-B2-03 | HR REQUIRED |
| B2-C4 | Anschluss nach Puckgewinn: Tempo / Kontrolle / Absichern | B2_D4 | RINQ_MODEL + COACHING_CONVENTION | **verified** | MODERATE | SRC-07, SRC-09 | Boundary A3 · HR REQUIRED |
| B2-C5 | Muster = vorsichtige Tendenz, keine Team-Identität | B2_D5 | RINQ_MODEL | **verified** | MODERATE | — (Didaktik) | Disclaimer im Config ✓ · HR REQUIRED |
| B2-C6 | Entscheidung ≠ Ergebnis | D1–D5 ignore | RINQ_MODEL | model | — | — | Observation-before-evaluation |
| B2-C7 | Keine Center-/Transition-Wiederholung | ignore + B2 description | RINQ_MODEL | model | — | — | Boundary ✓ |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul | **ok** | nach Rewrite |
| Sections decken Drills | **ok** | D1–D5 |
| Keine Boundary-Vorwegnahme | **ok** | B3/C explizit ausgelagert |
| Observation-before-Evaluation | **ok** | |
| Nach Rework mitgezogen? | **ja** (dieser Pass) | Legacy Winger entfernt |

---

## 3. Drill Alignment

| Drill | Lernziel | Theorie | Vorwissen | Mechanik | Absolut? |
|-------|----------|---------|-----------|----------|----------|
| B2_D1 | Druckquellen | C1 | B1/A3 ✓ | period_checkin / decision_analysis ✓ | nein |
| B2_D2 | Versuchte Lösung | C2 | D1 ✓ | gleich | nein |
| B2_D3 | Ursache | C3 | D1–2 ✓ | gleich | nein |
| B2_D4 | Anschluss nach Gewinn | C4 | A3 Kontext ✓ | gleich | nein |
| B2_D5 | Muster | C5 | D1–4 ✓ | gleich | nein (Disclaimer) |

**Drill-Kette:** D1→D5→B3 ✓

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **B1 → B2** | description + ignore Center ✓ |
| **A3 → B2_D4** | Transition Kontext, Lernziel = Entscheidung danach ✓ |
| **B2 → B3** | D5 hint: Zugriff/Unterstützung, nicht Systeme ✓ |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| B2-MIN-001 | D1 Frage „Wie schnell **muss** der Spieler handeln?“ | Optional: „Wie viel Zeit bleibt?“ |
| B2-MIN-002 | „Sichern“ in B2 vs. A1-Funktion | Glossar + Human Review |

Keine Curriculum-Änderung in diesem Pass (nur Theory-Seite).

---

## 6. Evidence

Quellen: [`docs/qa/sources/b2-sources.md`](../sources/b2-sources.md) · 5× MODERATE verified

---

## 7. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | APPROVED |
| Evidence | APPROVED |
| theoryData | **aligned** |
| Human | **offen** (5× REQUIRED) |

---

*Ende Review B2 — 2026-08-24*

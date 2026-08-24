# Content QA Review — E3

**Status:** `CONTENT + EVIDENCE APPROVED` · theoryData **aligned** · Human Layer **offen**  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `E3`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `E3` *(Rewrite 2026-08-24: generische „kleine Daten“-Theorie → Nenner/Rate/Vergleich/Bedingung/Evidenz/Claim-Leiter)*  
**Vorgänger:** E2 · **Nachfolger:** E4 — Prognose & Antizipation

---

## Executive Summary

| Metrik | E3 |
|--------|-----|
| BLOCKER | **0** *(Theory-Alignment-BLOCKER resolved)* |
| MAJOR | **0** |
| MINOR | **2** |
| RECOMMENDED Evidence | **5** → **verified** (MODERATE) |
| Human REQUIRED | **5** |

---

## 1. Track-Ziel

**Outcome:** Micro-Analytics als Evidenz-Handwerk: Events nur mit Opportunity-Nenner als Rate; saubere Vergleiche; bedingte Zusammenhänge ohne Kausalität; Evidenzstärke mehrdimensional; Claim-Stufe ≤ Evidenz — **ohne Statistik-Overkill / p-Werte**.

**Voraussetzungen:** E1 Tendenz, E2 Adjustment-Lesen (Kontext).

**Bewusst nicht:** Signifikanztests, Teamwahrheit aus Mini-Sample, Coach-Empfehlungen, Prognose (E4).

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | evidence_status | strength | source_refs | notes |
|---|-------|-----|------------|-----------------|----------|-------------|-------|
| E3-C1 | Anzahl braucht Nenner (Opportunity/Target) | E3_D1 | RINQ_MODEL + COACHING_CONVENTION | **verified** | MODERATE | SRC-E3-01 | HR REQUIRED |
| E3-C2 | Vergleich nur bei gleicher Messung / einer Dimension | E3_D2 | RINQ_MODEL | **verified** | MODERATE | SRC-E3-01 | HR REQUIRED |
| E3-C3 | Bedingter Zusammenhang ≠ Ursache | E3_D3 | FACT-adjacent (Logik) + RINQ_MODEL | **verified** | MODERATE | SRC-E3-01 | HR REQUIRED |
| E3-C4 | Evidenzstärke ≠ nur Prozentunterschied | E3_D4 | RINQ_MODEL | **verified** | MODERATE | SRC-E3-02 | HR REQUIRED |
| E3-C5 | Claim-Stufe ≤ Evidenz; Limits benennen | E3_D5 | RINQ_MODEL | **verified** | MODERATE | SRC-E3-02 | HR REQUIRED |
| E3-C6 | Keine p-Werte / Signifikanz in E3 | ignore | RINQ_MODEL | model | — | — | ✓ |
| E3-C7 | Boundary E1/E2/E4 | hints | RINQ_MODEL | model | — | — | ✓ |

---

## 2b. Theory-Page Alignment

| Prüfung | Status | Details |
|---------|--------|---------|
| Titel / overview ↔ Modul | **ok** | nach Rewrite |
| Sections decken Drills | **ok** | D1–D5 |
| Keine Stats-Overclaim | **ok** | Legacy „objektiv wiederkehren“ entfernt |
| Observation-before-Evaluation | **ok** | |
| Nach Rework mitgezogen? | **ja** (dieser Pass) | |

---

## 3. Drill Alignment

| Drill | Lernziel | Theorie | Absolut? |
|-------|----------|---------|----------|
| E3_D1 | Opportunity-Rate | C1 | nein |
| E3_D2 | Cohort-Vergleich | C2 | nein |
| E3_D3 | Bedingter Zusammenhang | C3 | nein |
| E3_D4 | Evidence Assessment | C4 | nein |
| E3_D5 | Claim Ladder | C5 | MINOR „gute Analyse“ in Expl |

**Mechaniken:** `opportunity_rate` → `cohort_rate_compare` → `conditional_outcome_compare` → `evidence_assessment` → `claim_ladder` ✓  
**Drill-Kette:** D1→D5→E4 ✓

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| **E2 → E3** | Adjustment-Lesen → Evidenz/Nenner ✓ |
| **E3 → E4** | D5 hint Prognose ✓ |
| **Nicht E3** | p-Werte, Kausalität, Coach-Fixes ✓ |

---

## 5. QA-Findings

### MINOR

| ID | Problem | Empfehlung |
|----|---------|------------|
| E3-MIN-001 | D5 Expl: „Eine **gute** Analyse…“ | Neutral: „Eine belastbare Analyse…“ |
| E3-MIN-002 | Viele Learning Goals (8) | Optional bündeln für UI — Inhalt ok |

Keine Curriculum-Inhaltsänderung in diesem Pass (nur Theory-Seite).

---

## 6. Evidence

Quellen: [`docs/qa/sources/e3-sources.md`](../sources/e3-sources.md) · 5× MODERATE verified

---

## 7. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | APPROVED |
| Evidence | APPROVED |
| theoryData | **aligned** |
| Human | **offen** (5× REQUIRED) |

---

*Ende Review E3 — 2026-08-24*

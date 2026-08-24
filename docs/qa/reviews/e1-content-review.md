# Content QA Review — E1

**Status:** methodische Schärfung umgesetzt · Human Layer **`NEEDS_CHANGE`** (Endfreigabe offen)  
**Datum:** 2026-08-24  
**Reviewer:** Content QA (Cursor)  
**Curriculum:** `data/academy/curriculum.json` · Module `E1`  
**Theorie:** `frontend/src/data/theoryData.json` · Key `E1`  
**Human Review:** [`e1-human-review.md`](../human-review/e1-human-review.md) · Quellen: [`e1-sources.md`](../sources/e1-sources.md)  
**Nachfolger:** E2 — Anpassungen ableiten

---

## Executive Summary

| Metrik | E1 |
|--------|-----|
| BLOCKER | **0** |
| MAJOR | **0** (D4 Attribution → Kontextstabilität umgesetzt) |
| MINOR | **0** offen in Copy (MIN-001…003 in HR als `NEEDS_CHANGE`) |
| Evidence | **5× MODERATE** (RINQ_MODEL) |
| Human REQUIRED | **5** · Status `NEEDS_CHANGE` |

---

## 1. Track-Ziel

**Outcome:** Systematisches Beobachten: Beobachtungen sammeln → Merkmale vergleichen → Bedingungen/Gegenfälle → stabile/variable Merkmale → Kontextstabilität → vorläufige Segment-Tendenzen (auch null).

**Grenzen:** Keine wissenschaftliche Mustererkennung, keine objektive Teamdiagnose, keine Ursachenattribution aus 3–5 Szenen.

---

## 2. Theory Inventory

| # | Claim | Ort | claim_type | strength | source_refs |
|---|-------|-----|------------|----------|-------------|
| E1-C1 | Vergleichsmerkmale; 3 = Mindestmenge Übung | E1_D1 | RINQ_MODEL | MODERATE | SRC-DEB-RRL-2020-S12, SRC-IIHF-CEF-2025, SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017, RINQ-MODEL-E1-COMPARISON-FEATURES |
| E1-C2 | Gegenfälle ohne Auto-Stärkung/Widerlegung | E1_D2 | RINQ_MODEL | MODERATE | …, RINQ-MODEL-E1-COUNTERCASE |
| E1-C3 | Stabil/variabel; funktionaler Kern = RinQ-Arbeitsbegriff | E1_D3 | RINQ_MODEL | MODERATE | …, RINQ-MODEL-E1-STABLE-VARIABLE-FEATURES |
| E1-C4 | Kontextstabilität statt kausaler Attribution | E1_D4 | RINQ_MODEL | MODERATE | …, RINQ-DECISION-E1-REMOVE-CAUSAL-ATTRIBUTION |
| E1-C5 | Segment-Tendenzen; null gültig | E1_D5 | RINQ_MODEL | MODERATE | …, RINQ-MODEL-E1-SEGMENT-TENDENCIES |

---

## 3. Drill Alignment

| Drill | Titel (UI) | Summary-Titel |
|-------|------------|---------------|
| E1_D1 | Wiederholt sich wirklich etwas? | Hinweis auf eine mögliche Tendenz · Vergleichsmerkmale |
| E1_D2 | Unter welchen Bedingungen tritt es auf? | Bedingungen der bisherigen Beobachtungen |
| E1_D3 | Was bleibt ähnlich, was verändert sich? | Stabile und variable Merkmale |
| E1_D4 | In welchen Kontexten bleibt die Tendenz sichtbar? | Kontextstabilität im beobachteten Segment |
| E1_D5 | Tendenzen im beobachteten Segment | `minTendencies: 0` |

**Mechaniken (IDs stabil):** `pattern_log` → `pattern_condition` → `pattern_invariant` → `pattern_attribution` → `tendency_profile`  
**Semantik D4:** Feldwerte `mostly_structural` / `mostly_situational` etc. bleiben als technische Keys; Labels = Kontextstabilität. Legacy-Ursachenlabels lesbar, nicht in neuer UI angeboten.

---

## 4. Boundary

| Richtung | Status |
|----------|--------|
| E1 → E2 | Lesen → Anpassungen |
| Nicht E1 | Ursachen als Wahrheit, Teamdiagnostik, Prognose, Systemnamen |

---

## 5. Track Release Status

| Layer | Status |
|-------|--------|
| Content (Drills) | umgesetzt · Human Endfreigabe offen |
| Evidence | Katalog aktualisiert |
| theoryData | aligned |
| Human | **`NEEDS_CHANGE`** (kein CONFIRMED*) |

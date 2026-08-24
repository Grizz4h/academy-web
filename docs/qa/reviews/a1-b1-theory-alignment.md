# Theory Alignment Review — A1–B1

**Datum:** 2026-08-24  
**Scope:** `frontend/src/data/theoryData.json` vs `data/academy/curriculum.json` (Module A1, A2, A3, B1)  
**Regel:** `docs/ai-rules/content-quality.md` §5.2 (neu)  
**Status:** **Theory aligned (A1–B1)** nach Rewrite 2026-08-24 · Curriculum-Drills bleiben `CONTENT + EVIDENCE APPROVED`  
**Fix-Pass:** theoryData A1–B1 + **B2–E4** Rewrite + QA (2026-08-24). Reviews bis [`e4-content-review.md`](e4-content-review.md). D4 Sidequest-Frame. Human Review offen. Track E abgeschlossen.

---

## Executive Summary

| Modul | Curriculum-Titel | theoryData-Titel (nach Fix) | Alignment |
|-------|------------------|------------------------------|-----------|
| **A1** | Rink IQ & Rollenverständnis | Rink IQ & Rollenverständnis | **aligned** — D1–D5 Vokabular, keine Antizipation als Kern |
| **A2** | Struktur & Optionen lesen | **Struktur & Optionen lesen** | **aligned** — Breakout-Legacy entfernt |
| **A3** | Transition & Tempo | Transition & Tempo | **aligned** — Observation-first, Superlative entschärft |
| **B1** | Centerrolle verstehen und lesen | **Centerrolle verstehen und lesen** | **aligned** — Support/Outlet/Timing; Low/M/H nur A1-Erinnerung |

**Hinweis:** Alter A2-Text (Breakout/Blue Line) liegt in Git-History; nicht gelöscht aus späteren Tracks, aber nicht mehr unter Key `A2`.

---

## Layer-Modell (Referenz)

| Layer | Datei | UI |
|-------|-------|-----|
| Drill-Didaktik | `curriculum.json` | Session |
| Theorie-Seite | `theoryData.json` | „Theorie lesen“ |

Zukünftige Reviews prüfen **immer beide** (Template §2b · content-quality §5).

---

## A1

### Curriculum (Soll)

Center finden → Low/M/H → Funktionen (Sichern/Verbinden/Mit nach vorne) → Beziehungen → einfache Strukturen. Observation-first. **Kein** Transition/Antizipation als Kern.

### theoryData (Ist)

| Element | Befund |
|---------|--------|
| Titel | passt |
| Overview | „**Antizipation statt Reaktion**“, Spiel lesen „**bevor es passiert**“ — vorweg A3/B1 Timing |
| Sections | Rink IQ, Rollen, Dreiecke, Ordnung/Chaos — teilweise passend |
| Lücken | Kaum: Low/M/H, Sichern/Verbinden/Mit nach vorne, Passoption/Anschlussoption als A1-Vokabular |
| Vorwegnahme | Umschalten / Puckverlust in Overview-Nähe (Chaos-Framing) |

### Findings

| ID | Severity | Problem | Korrektur-Richtung |
|----|----------|---------|-------------------|
| TH-A1-001 | MAJOR | Overview betont Antizipation statt Beobachtung/Rollen | Overview an A1-Ziele: Center, Beziehungen, erste Struktur |
| TH-A1-002 | MAJOR | Coverage-Lücke: A1-Funktionen/Beziehungen fehlen | Sections an D1–D5 alignen |
| TH-A1-003 | MINOR | Dreieck-Section ok, aber ohne „keine Geometriepflicht“ | Mit A1_D5/Glossar abstimmen |

---

## A2

### Curriculum (Soll)

Struktur → Optionen → Entscheidung (Pass/Carry/Dump/Reset) → Raum/Zeit → Strukturentwicklung. **Keine** Breakout-Analyse (A1_D5-Handoff explizit).

### theoryData (Ist)

| Element | Befund |
|---------|--------|
| Titel | **„Raum, Linien & Breakout-Logik“** — Legacy-Phasenname |
| Overview | Breakouts, Blue Line, Spiel eröffnen — **anderes Modul** |
| Sections | Zonen, Blue Line, Breakout-Logik, erste Passoption, Raumgefühl, Linienlogik |
| Coverage vs Drills | Struktur/Optionen/Strukturentwicklung **fehlen** als Leitfaden |

### Findings

| ID | Severity | Problem | Korrektur-Richtung |
|----|----------|---------|-------------------|
| **TH-A2-001** | **BLOCKER** | theoryData = alter Track, nicht „Struktur & Optionen“ | **theoryData A2 neu schreiben** (oder Legacy-Content verschieben/archivieren) |
| TH-A2-002 | BLOCKER | Breakout-Theorie widerspricht A2-Ignore/Boundary | Breakout-Inhalt nicht unter A2 belassen |
| TH-A2-003 | MAJOR | Pass/Carry/Dump/Reset, Strukturentwicklung fehlen | In neues A2-Theorie-Framing aufnehmen |

---

## A3

### Curriculum (Soll)

Transitionsmoment → erste Reaktion → Fortsetzen/Kontrolle → Rückreaktion → Gap/Abstand. **Ohne Qualitätsurteil.**

### theoryData (Ist)

| Element | Befund |
|---------|--------|
| Titel | passt |
| Themen | Transition, Tempo, Turnovers, Rush, Backchecking, Gap — grob aligned |
| Sprache | Viele „**gutes** …“, „**gute** Rush-Entscheidungen“, „spielentscheidend“ — Evaluation vor Observation |
| Extra | Rush-Schwerpunkt stärker als A3_D3 „Fortsetzung/Kontrolle“; Tempo-Kapitel breiter als Curriculum |

### Findings

| ID | Severity | Problem | Korrektur-Richtung |
|----|----------|---------|-------------------|
| TH-A3-001 | MAJOR | Qualitäts-/Urteilssprache vs. Observation-first | Auf „Woran erkennst du…“ / ohne gut/schlecht umstellen |
| TH-A3-002 | MAJOR | Superlative („gefährlichsten“, „entscheidet Spiele“) | Entschärfen analog A2-C7/A3-C1 |
| TH-A3-003 | MINOR | Rush vs. Fortsetzung/Kontrolle-Terminologie | An A3_D3 + Glossar anbinden |
| TH-A3-004 | NOTE | Struktur passt thematisch besser als A1/A2 | Rework = Language + Alignment, kein Full Rewrite nötig |

---

## B1

### Curriculum (Soll)

Spielbarer Support → Verbindungen/Stabilität → Aufgaben → Outlet → Timing. Low/M/H bereits in **A1**.

### theoryData (Ist)

| Element | Befund |
|---------|--------|
| Titel | „Center-Detailarbeit“ — nah genug |
| Subtitle | **Low / Middle / High** als Hauptrahmen — das ist A1_D2 |
| Sections | Höhen-Zustände dominant; Turnovers; wenig Outlet/spielbar/Timing als Kern |
| Lücken | Outlet, spielbare Unterstützung, Aufgaben-Taxonomie, Timing schwach oder fehlend |

### Findings

| ID | Severity | Problem | Korrektur-Richtung |
|----|----------|---------|-------------------|
| TH-B1-001 | MAJOR | Low/M/H als B1-Hauptinhalt → Boundary zu A1 / Doppelung | Höhen nur kurz referenzieren; Fokus Support/Outlet/Timing |
| TH-B1-002 | MAJOR | Outlet & spielbare Unterstützung unterrepräsentiert | An B1_D1/D4 lernenGoals ausrichten |
| TH-B1-003 | MINOR | Turnover-Section → eher A3-Nähe | Kürzen oder klar als Randnotiz |
| TH-B1-004 | NOTE | Center als Strukturspieler — passt thematisch | Behalten, reframen |

---

## Priorisierte Fix-Liste — **erledigt 2026-08-24**

| Prio | ID | Status |
|------|-----|--------|
| 1 | TH-A2-001/002 | **resolved** — A2 neu: Struktur → Optionen → Pass/Carry/Dump/Reset → Raum/Zeit → Entwicklung |
| 2 | TH-A1-001/002/003 | **resolved** — A1 an D1–D5; Dreieck ohne Geometriepflicht |
| 3 | TH-B1-001/002 | **resolved** — Support/Outlet/Timing; Low/M/H nur Erinnerung |
| 4 | TH-A3-001/002/003 | **resolved** — Sprache Observation-first; Fortsetzen/Kontrolle statt Rush-Urteil |

---

## Release-Hinweis (nach Fix)

| Layer | A1 | A2 | A3 | B1 |
|-------|----|----|----|-----|
| Curriculum Drills | CONTENT + EVIDENCE APPROVED | gleich | gleich | gleich |
| theoryData | **aligned** | **aligned** | **aligned** | **aligned** |
| Human | offen | offen | offen | offen |

**Offen außerhalb Scope:** `theoryData` **B2** heißt noch „Winger-Detailarbeit“, Curriculum B2 ist „Entscheidungen unter Druck“ — eigener Pass.

---

## Recheck (Fix-Pass)

| Prüfung | A1 | A2 | A3 | B1 |
|---------|----|----|----|-----|
| Titel/Overview ↔ Modul | ✓ | ✓ | ✓ | ✓ |
| Sections decken Drills | ✓ | ✓ | ✓ | ✓ |
| Keine Breakout-Vorwegnahme in A2 | ✓ | ✓ | n/a | n/a |
| Observation-before-Evaluation | ✓ | ✓ | ✓ | ✓ |
| RinQ-Labels gekennzeichnet | ✓ | Reset/Taxonomie | Rollen D2 | Aufgaben-Raster |

---

## Governance

Umgesetzt 2026-08-24:

- `docs/ai-rules/content-quality.md` §5.1–5.2 — beide Layer verpflichtend
- `docs/qa/content-review-template.md` — Meta + §2b Theory-Page Alignment
- `.cursor/rules/content-quality.mdc` — Kurzregel

---

*Ende Theory Alignment A1–B1 — Audit only 2026-08-24*

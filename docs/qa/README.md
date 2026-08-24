# Content QA

Strukturierte inhaltliche Reviews für RinQ Tank Lerninhalte.

| Datei | Zweck |
|-------|--------|
| [`content-review-template.md`](content-review-template.md) | Wiederverwendbares Template pro Track |
| [`reviews/`](reviews/) | Abgeschlossene und laufende Track-Reviews |
| [`reviews/a1-b1-theory-alignment.md`](reviews/a1-b1-theory-alignment.md) | theoryData ↔ Curriculum Drift A1–B1 |
| [`sources/`](sources/) | Externe Quellenlisten pro Review |
| [`human-review/`](human-review/) | Menschliche Freigabe (AI ≠ Human Approval) |

**Glossar:** [`docs/content/hockey-glossary.md`](../content/hockey-glossary.md)

**Release-Stufen:** `CONTENT APPROVED` → `CONTENT + EVIDENCE APPROVED` → `CONTENT + EVIDENCE + HUMAN APPROVED`

**Immer zwei Content-Layer prüfen:** `curriculum.json` (Drills/Didaktik) **und** `frontend/src/data/theoryData.json` (Theorie lesen).

**Track A Stand:** A1–A3 Drills Evidence ✓ · theoryData A1–A3 **aligned** · Human offen  
**Track B Stand:** B1–B3 Drills Evidence ✓ · theoryData B1–B3 **aligned** · Human offen  
**Track C Stand:** C1–C3 Drills Evidence ✓ · theoryData C1–C3 **aligned** · Human offen  
**Track D Stand:** D1–D3 Evidence ✓ · theory aligned · D4 Sidequest reviewed (inactive) · Human offen  
**Track E Stand:** E1–E4 Drills Evidence ✓ · theoryData E1–E4 **aligned** · Human offen · Track E in diesem Pass **abgeschlossen**

**Rules:** `docs/ai-rules/content-quality.md` · `docs/ai-rules/curriculum-boundaries.md`

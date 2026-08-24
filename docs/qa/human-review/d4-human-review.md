# Human Review — D4 (Sidequest / Deprecated)

**Status:** Human-Entscheidungen dokumentiert · Umsetzung 2026-08-24 · finale Freigabe offen  
**Datum:** 2026-08-24  
**AI-Evidence:** [`d4-content-review.md`](../reviews/d4-content-review.md) · [`d4-sources.md`](../sources/d4-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § D4

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Produkt-Status:** Module **inactive / deprecated** · Sidequest `numerical_situation` · Track D regulär = D1–D3

**Umsetzungsnotiz:** Curriculum D4_D1–D3 geschärft; D4_D4 Teamruhe entfernt/inaktiv; theoryData als Sidequest-Hilfe; Sidequest-Template Extra-Angreifer auf RinQ-Raster; Glossar/Quellen aktualisiert; `d4Polish.test.ts`. Alle Claims bleiben `NEEDS_CHANGE` bis Christoph freigibt.

---

## HUMAN_REVIEW_REQUIRED

### HR-D4-C0 — Sidequest-Framing (Produkt)

| Feld | Wert |
|------|------|
| **claim_id** | D4-C0 |
| **Ort** | Curriculum meta + UI Sidequest |
| **Claim** | 6v5/EN/5v3 als Sidequest, nicht als 5-Drill-Pflichttrack |
| **Warum HR** | Architekturentscheidung Track D |
| **Was prüfen** | Bleibt Theory-Key `D4` sichtbar? Legacy-Drills vs. Sidequest-Templates? |
| **AI-Evidence** | MODERATE (Produktflags) |
| **Offene Frage** | Theory-Seite im UI ausblenden oder als „Sidequest-Hilfe“ belassen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D4 bleibt als inaktive/deprecated Sidequest außerhalb des regulären Track-Fortschritts. Der Theory-Key darf nur als klar gekennzeichnete Sidequest-Hilfe erreichbar bleiben (Badge + Footer ohne „Session starten“). Legacy-Drills dürfen nicht als regulärer Pflichttrack erscheinen. Die Beobachtung numerischer Sondersituationen bleibt optional und ereignisabhängig. UI-Hub: „Numerische Sondersituation“. |
| **human_source_refs** | SRC-DEB-RRL-2020-S23; SRC-IIHF-RULEBOOK-2025-26-R84.2; SRC-IIHF-TERMINOLOGY-EXTRA-ATTACKER; RINQ-PRODUCT-DECISION-D4-SIDEQUEST |

---

### HR-D4-C1 — Strukturraster

| Feld | Wert |
|------|------|
| **claim_id** | D4-C1 |
| **Ort** | D4_D1 |
| **Claim** | klar / instabil / chaotisch |
| **Warum HR** | Sehr grob; „chaotisch“ wertend |
| **Was prüfen** | Für Sidequest ausreichend? |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Das Raster klar / instabil / chaotisch wird geändert. Chaotisch ist wertend und nicht operational definiert. Künftig wird ausschließlich beschrieben, ob Raumaufteilung, Abstände, Rollen und Anschlussoptionen durchgehend, teilweise oder nicht stabil erkennbar sind. Nicht sicher beurteilbar wird ergänzt. Interne Werte klar/instabil/chaotisch bleiben speicherbar und werden nur in der Anzeige remapped — ohne höhere Genauigkeit vorzutäuschen. Das resultierende Raster ist ein RinQ-Beobachtungsmodell und kein offizieller DEB- oder IIHF-Standard. |
| **human_source_refs** | SRC-DEB-RRL-2020-S23; SRC-IIHF-COACHING-1V1-OUTLETS; SRC-IIHF-COACHING-5V5-OFFENCE; RINQ-MODEL-D4-STRUCTURE |

---

### HR-D4-C2 — Entscheidungsraster

| Feld | Wert |
|------|------|
| **claim_id** | D4-C2 |
| **Ort** | D4_D2 |
| **Claim** | geduldig / forciert / panisch |
| **Warum HR** | „panisch“ stark interpretativ; Hint absolut |
| **Was prüfen** | Labels umbenennen? |
| **AI-Evidence** | Didaktik MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Geduldig / forciert / panisch wird verworfen. Panisch ist eine nicht zuverlässig beobachtbare psychologische Zuschreibung; die übrigen Werte vermischen Verhalten und Qualität. Titel: Vorbereitung der Aktion. Künftig wird erfasst, welche Anschlussoptionen vor der Aktion sichtbar vorbereitet waren. Ergebnis und vermeintlich bessere Alternativen dürfen die Einordnung nicht bestimmen. Nicht sicher beurteilbar wird ergänzt. Key `decision_quality` bleibt intern; UI zeigt keine Entscheidungsqualität. Legacy-Werte hidden und nicht mit neuer Skala vergleichbar. |
| **human_source_refs** | SRC-DEB-RRL-2020-S23; SRC-IIHF-COACHING-1V1-OUTLETS; SRC-IIHF-COACHING-5V5-OFFENCE; RINQ-MODEL-D4-ACTION-PREPARATION |

---

### HR-D4-C3 — Risiko / Absicherung

| Feld | Wert |
|------|------|
| **claim_id** | D4-C3 |
| **Ort** | D4_D3 |
| **Claim** | abgesichert / teilweise / ungesichert |
| **Warum HR** | Kern 6v5-Risikologik |
| **Was prüfen** | Hint moralisierend? |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Absicherung bleibt als beobachtbarer Kern erhalten, wird aber neutral operationalisiert. Erfasst werden Positionen hinter dem Puck, mögliche Befreiungswege und unmittelbares Anschlussverhalten. Ob ein Risiko einkalkuliert war, darf nicht behauptet werden. Keine sichtbare Absicherung ist eine Beobachtung und kein automatisches Qualitätsurteil. Ballverlust → Puckverlust. Nicht sicher beurteilbar wird ergänzt. Glossar an A1 Absichern angeschlossen. |
| **human_source_refs** | SRC-DEB-RRL-2020-S23; SRC-IIHF-COACHING-1V1-OUTLETS; SRC-IIHF-COACHING-2V2-SHOOTING-BOARD; RINQ-MODEL-A1-ABSICHERN; RINQ-MODEL-D4-PUCK-SECURITY |

---

### HR-D4-C4 — Teamruhe

| Feld | Wert |
|------|------|
| **claim_id** | D4-C4 |
| **Ort** | D4_D4 |
| **Claim** | ruhig / angespannt / chaotisch |
| **Warum HR** | Schwächste Evidence; leicht „Psychologie“ |
| **Was prüfen** | Behalten für Sidequest oder streichen? |
| **AI-Evidence** | MODERATE / Interpretation |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Teamruhe sowie ruhig / angespannt / chaotisch werden entfernt. Aus Körpersprache, Spieltempo oder Kommunikation kann kein verlässlicher mentaler Teamzustand abgeleitet werden. D4_D4 ist aus der Sidequest entfernt (`active: false`, `deprecated`, Fragen hidden/legacy). Keine Ersatz-Psychologie-Vorlage; D4_D1–D3 decken den beobachtbaren Bedarf. Altdaten bleiben lesbar. |
| **human_source_refs** | SRC-DEB-RRL-2020-S23; RINQ-METHODOLOGY-OBSERVABLE-BEHAVIOR; RINQ-DECISION-D4-REMOVE-TEAM-COMPOSURE |

---

## HUMAN_REVIEW_OPTIONAL

### HR-D4-MIN-001 — Goals „Bewerte“

| Feld | Wert |
|------|------|
| **claim_id** | D4-MIN-001 |
| **Ort** | learningGoals |
| **Claim** | „Bewerte Entscheidungen…“ |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Lernziele ersetzt durch beobachtbare Formulierungen (Raumaufteilung/Anschlussoptionen; Aktionen unabhängig vom Ergebnis; Absicherung hinter dem Puck; sichtbare Merkmale vs. Absicht/mental). Kein „Bewerte“ / „Unterscheide Geduld von Panik“ mehr. |
| **human_source_refs** | RINQ-METHODOLOGY-OBSERVABLE-BEHAVIOR |

---

### HR-D4-MIN-002 — „Gute Entscheidungen bleiben gut“

| Feld | Wert |
|------|------|
| **claim_id** | D4-MIN-002 |
| **Ort** | D4_D2 Hint |
| **Claim** | Absolute Qualitätsaussage |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Hint ersetzt durch: sichtbare Anschlussoptionen vor der Aktion beschreiben — nicht das Ergebnis. Keine „gute Entscheidung bleibt gut“-Formulierung. |
| **human_source_refs** | RINQ-MODEL-D4-ACTION-PREPARATION |

---

### HR-D4-MIN-003 — „kein Mut, sondern Kontrollverlust“

| Feld | Wert |
|------|------|
| **claim_id** | D4-MIN-003 |
| **Ort** | D4_D3 Hint |
| **Claim** | Moralisierende Absicherungsformulierung |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Hint ersetzt durch neutrale Beobachtung von Positionen hinter dem Puck und Befreiungswegen; Ergebnis nicht allein beurteilen. Moralformel entfernt. |
| **human_source_refs** | RINQ-MODEL-D4-PUCK-SECURITY |

---

### HR-D4-MIN-004 — Legacy-Drills vs. Sidequest-Templates

| Feld | Wert |
|------|------|
| **claim_id** | D4-MIN-004 |
| **Ort** | Produkt / UI |
| **Claim** | Legacy-Drills dünn vs. Sidequest-Templates |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Sidequest-Template `extra_attacker_offense` nutzt jetzt dasselbe RinQ-Raster (Struktur / Vorbereitung / Absicherung). Legacy-Modul bleibt deprecated; Theory als Sidequest-Hilfe. Hub-Label DE: Numerische Sondersituation. |
| **human_source_refs** | RINQ-PRODUCT-DECISION-D4-SIDEQUEST |

---

## Quellenhinweis

DEB S. 23 und IIHF Regel-/Terminologiequellen stützen Relevanz und Regelsprachlichkeit. Die konkreten Beobachtungsraster sind RinQ-Modelle und keine Verbandsstandards.

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C0–C4) · alle `NEEDS_CHANGE` |
| **OPTIONAL** | **4** (MIN-001–004) · alle `NEEDS_CHANGE` |

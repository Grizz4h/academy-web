# Human Review — E4

**Status:** `NEEDS_CHANGE` (Umsetzung dokumentiert; menschliche Endfreigabe offen)  
**Datum:** 2026-08-24  
**AI-Evidence:** [`e4-content-review.md`](../reviews/e4-content-review.md) · [`e4-sources.md`](../sources/e4-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § E4

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** Sprach-/Methodenschärfung · D5 ohne Skill-Profil · Human **offen**

---

## HUMAN_REVIEW_REQUIRED

### HR-E4-C1 — Erwartung und tatsächliche Aktion trennen

| Feld | Wert |
|------|------|
| **claim_id** | E4-C1 |
| **Ort** | E4_D1 |
| **Claim** | Antizipation = begründete Erwartung; Übereinstimmung ≠ Begründung |
| **Warum HR** | Kern von Track E Abschluss; Nutzer tendieren zu Accuracy |
| **Was prüfen** | UI/Reflection trennt Outcome vs. Begründung klar genug? |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Antizipation bleibt eine begründete Erwartung und keine sichere Vorhersage. Die UI trennt ursprüngliche Erwartung, vorab sichtbare Hinweise, tatsächliche Aktion, Übereinstimmung und spätere Nachprüfung. Erwartung, Hinweise und Sicherheit werden vor der Auflösung gespeichert und danach nicht rückwirkend verändert. Eine Übereinstimmung beweist keine hohe Qualität; eine Abweichung beweist keine schlechte Antizipation. Pauschale Read-Qualität wird durch konkrete Merkmale der ursprünglichen Begründung ersetzt. |
| **human_source_refs** | SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-ACTIVE-INFERENCE-SPORT-2022; SRC-OUTCOME-BIAS-SPORT-2019; RINQ-MODEL-E4-READ-OUTCOME-SEPARATION |

---

### HR-E4-C2 — Rollen sichtbarer Hinweise

| Feld | Wert |
|------|------|
| **claim_id** | E4-C2 |
| **Ort** | E4_D2 |
| **Claim** | Haupthinweis / unterstützend / nicht genutzt — keine Punkte |
| **Warum HR** | Gewichtungsmodell ist RinQ-spezifisch |
| **Was prüfen** | Rollen verständlich? Nachprüfung ok? |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Das RinQ-Rollenmodell für Hinweise bleibt ohne Punkte oder Prozentwerte bestehen. Die sichtbaren Rollen werden zu Haupthinweis, unterstützender Hinweis und wahrgenommen, aber nicht für die Erwartung genutzt geschärft. Die Rollen beschreiben die Nutzung durch den Beobachter und keine objektive Cue-Wichtigkeit. Genau ein Haupthinweis wird vor der Aktion festgelegt. Die Nachprüfung fragt nach Sichtbarkeit, Konkretheit, fortbestehender Relevanz, neuen Informationen und möglicherweise übersehenen Hinweisen – nicht nur nach der tatsächlichen Aktion. |
| **human_source_refs** | SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-ACTIVE-INFERENCE-SPORT-2022; RINQ-MODEL-E4-CUE-ROLES |

---

### HR-E4-C3 — Hauptoption, Alternative und Auslöser

| Feld | Wert |
|------|------|
| **claim_id** | E4-C3 |
| **Ort** | E4_D3 |
| **Claim** | Eine Alternative + beobachtbarer Auslöser; didaktische Begrenzung |
| **Warum HR** | Leicht zu „alles ist möglich“ zu verwässern |
| **Was prüfen** | Trigger-Suggestions; Zwang zu genau einer Alternative |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D3 bleibt als fokussierte Übung auf eine primäre Erwartung, genau ein realistisches Alternativszenario und einen beobachtbaren Auslöser begrenzt. Diese Begrenzung ist didaktisch und behauptet nicht, dass objektiv nur zwei Aktionen möglich waren. Der Auslöser muss eine konkrete neue oder veränderte sichtbare Information sein. Wenn keine realistische Alternative besteht, soll eine andere Szene gewählt werden. Die Nachprüfung trennt das Eintreten von Hauptoption, Alternative und Auslöser. |
| **human_source_refs** | SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-ACTIVE-INFERENCE-SPORT-2022; RINQ-MODEL-E4-SCENARIO-BRANCH |

---

### HR-E4-C4 — Erwartung aktualisieren

| Feld | Wert |
|------|------|
| **claim_id** | E4-C4 |
| **Ort** | E4_D4 |
| **Claim** | Behalten/ändern + Timing ohne Speed-Score |
| **Warum HR** | Update-Timing ist sensibel (zu früh/zu spät) |
| **Was prüfen** | Copy gegen Reactivity-Score / Speed-Bias |
| **AI-Evidence** | MODERATE |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | D4 bleibt eine Übung zur Aktualisierung einer Erwartung anhand neuer sichtbarer Informationen. Beibehalten und Ändern sind beide gültig und werden nicht automatisch gewertet. Keine relevante neue Information und nicht sicher beurteilbar werden ergänzt. Das Timing wird relativ zum Auftreten des Auslösers dokumentiert, aber nicht in einen Reaktivitäts-, Geschwindigkeits- oder Kompetenzscore übersetzt. Copy gegen Speed-Bias und die pauschale Wertung frühen oder häufigen Aktualisierens wird neutralisiert. |
| **human_source_refs** | SRC-ACTIVE-INFERENCE-SPORT-2022; SRC-ANTICIPATION-SPORT-REVIEW-2019; RINQ-MODEL-E4-PREDICTION-UPDATE |

---

### HR-E4-C5 — Kein Antizipationsprofil oder Skill-Level

| Feld | Wert |
|------|------|
| **claim_id** | E4-C5 |
| **Ort** | E4_D5 |
| **Claim** | Beschreibende Zusammenfassung ohne Skill-Score; Freischaltung nach Quelldrills |
| **Warum HR** | Abschlussprofil darf nicht als Skill-Score gelesen werden |
| **Was prüfen** | Aggregation + Copy; minReadsForProfile=20 |
| **AI-Evidence** | MODERATE (RinQ) |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Anticipation Profile wird durch Meine bisherigen Antizipations-Beobachtungen ersetzt. Die Zusammenfassung beschreibt ausschließlich die bislang dokumentierten Hinweise, Alternativszenarien und Aktualisierungsauslöser. Sie erzeugt keine Trefferquote, kein Hockey-IQ, kein Antizipations-Level, keinen Talentwert und keinen Kompetenzscore. Die starre Schwelle von 20 Reads wird nicht als Evidenz- oder Validitätsgrenze verwendet. Bevorzugt wird nach Abdeckung aller vier Quelldrills freigeschaltet; vorher kann eine klar unvollständige Zusammenfassung erscheinen. Häufig und selten werden nicht als gut oder schlecht interpretiert. |
| **human_source_refs** | SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-PERCEPTUAL-COGNITIVE-EXPERTISE-META-ANALYSIS; SRC-ICE-HOCKEY-SCANNING-2024; RINQ-DECISION-E4-NO-SKILL-PROFILE |

---

## HUMAN_REVIEW_OPTIONAL

### HR-E4-MIN-001 — „guter Read“

| **claim_id** | E4-MIN-001 | **human_status** | `NEEDS_CHANGE` |
| **Ort** | E4 Copy | **AI-Evidence** | MODERATE |
| **human_notes** | Pauschale Sprache wie guter oder schlechter Read wird durch konkrete Merkmale der ursprünglichen Erwartung ersetzt. Beschrieben werden Sichtbarkeit und Konkretheit der Hinweise, fehlende Informationen und Grenzen des Bildausschnitts. Die tatsächliche Aktion bestimmt diese Einordnung nicht automatisch. |
| **human_source_refs** | SRC-ANTICIPATION-SPORT-REVIEW-2019; SRC-OUTCOME-BIAS-SPORT-2019; RINQ-METHODOLOGY-E4-NO-GOOD-BAD-READ |

### HR-E4-MIN-002 — „Kippmomente“

| **claim_id** | E4-MIN-002 | **human_status** | `NEEDS_CHANGE` |
| **Ort** | E4 Lernziele | **AI-Evidence** | MODERATE |
| **human_notes** | Das unscharfe Lernziel frühe Warnsignale für Kippmomente wird durch sichtbare Veränderungen erkennen, die eine andere nächste Aktion plausibler machen ersetzt. Damit bleibt E4 bei konkret beobachtbarer Information und vermeidet rückblickende Spielverlaufsnarrative. |
| **human_source_refs** | SRC-ACTIVE-INFERENCE-SPORT-2022; RINQ-DECISION-E4-REMOVE-TIPPING-MOMENT |

### HR-E4-MIN-003 — Intro „Gute Spieler …“

| **claim_id** | E4-MIN-003 | **human_status** | `NEEDS_CHANGE` |
| **Ort** | E4_D1 Intro | **AI-Evidence** | MODERATE |
| **human_notes** | Die normative Intro-Formulierung Gute Spieler und Beobachter wird entfernt. Die neue Einleitung beschreibt neutral die Lernhandlung: eine Erwartung vor der Aktion formulieren, sichtbare Hinweise dokumentieren und anschließend Erwartung und tatsächliche Aktion getrennt vergleichen. |
| **human_source_refs** | SRC-IIHF-CEF-2025; RINQ-METHODOLOGY-E4-NEUTRAL-INTRO |

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) → `NEEDS_CHANGE` |
| **OPTIONAL** | **3** → `NEEDS_CHANGE` |

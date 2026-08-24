# Human Review — B2

**Status:** `NOT_REVIEWED` (alle Punkte)  
**Datum:** 2026-08-24  
**AI-Evidence:** [`b2-content-review.md`](../reviews/b2-content-review.md) · [`b2-sources.md`](../sources/b2-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § B2

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · theoryData aligned · Human **offen**

---

## HUMAN_REVIEW_REQUIRED

### HR-B2-C1 — Vier Druckquellen

| Feld | Wert |
|------|------|
| **claim_id** | B2-C1 |
| **Ort** | B2_D1 |
| **Claim** | Zeitdruck, Raumdruck, Gegnerdruck, Optionsdruck als dominante Quellen |
| **Warum HR** | Kernmodell B2; Taxonomie nicht IIHF-Standard; Scoring-UI (0–3) kann wie Messung wirken |
| **Was prüfen** | Vier Quellen didaktisch tragfähig? Score_map zu „hart“? |
| **Quellenarten** | Constraints-led / Hockey sense / IIHF pressure |
| **AI-Evidence** | MODERATE — Konzept Zeit/Raum/Druck ja; Set = RinQ |
| **Offene Frage** | Optionsdruck als eigene Quelle oder Folge von Zeit/Raum/Gegner? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die bisherige Viererstruktur bleibt als RinQ-Beobachtungsmodell erhalten, wird aber nicht mehr als vier unabhängige oder objektiv messbare „Druckquellen“ dargestellt. Verwendet werden die deutschsprachigen Beobachtungsdimensionen verfügbare Zeit, verfügbarer Raum, unmittelbarer Gegnerdruck und verfügbare Handlungsoptionen. Die Dimensionen dürfen sich überschneiden. Besonders eingeschränkte Handlungsoptionen können eine Folge von wenig Zeit, wenig Raum oder Gegnerdruck sein und werden daher nicht als eigenständige Ursache behauptet. Eine Auswahl markiert den in der Szene am stärksten sichtbaren Einflussfaktor, nicht die tatsächliche innere Ursache der Spielerentscheidung. Falls die UI weiterhin Werte von 0–3 nutzt, muss deutlich werden, dass dies eine Beobachtungs- und Vergleichshilfe innerhalb RinQ und keine validierte objektive Messskala ist. Sichtbare Texte, Theorie, Feedback, Auswertung und Hover-over-Glossar entsprechend schärfen. Nach geprüfter Umsetzung kann der Status auf CONFIRMED_AS_RINQ_MODEL gesetzt werden.|
| **human_source_refs** | DEB-RTK-ONLINE-2020 — spielangepasstes technisches und taktisches Verhalten sowie sukzessive Vermittlung taktischer Prinzipien: https://www.deb-online.de/2020/04/30/online-rahmentrainingskonzeption/ · DEB-RAHMENRICHTLINIEN-TRAINERAUSBILDUNG-2020 — allgemeiner Ausbildungsrahmen, keine Bestätigung einer festen Vierer-Taxonomie · IIHF-COACHING — allgemeiner Rahmen für spielnahes Coaching und Entscheidungsentwicklung, keine standardisierte RinQ-Viererstruktur: https://www.iihf.com/en/statichub/20485/coaching|

---

### HR-B2-C2 — Lösungsarten inkl. Sichern / Befreiung

| Feld | Wert |
|------|------|
| **claim_id** | B2-C2 |
| **Ort** | B2_D2 |
| **Claim** | Pass, Carry, Sichern, Befreiung als versuchte Lösung |
| **Warum HR** | Überlapp A2 Taxonomie; **Sichern** doppeldeutig vs. A1; Befreiung = RinQ |
| **Was prüfen** | Labels für DE-Coaches klar? Dump/Clear statt Befreiung? |
| **AI-Evidence** | MODERATE partial |
| **Offene Frage** | Sichern umbenennen (z. B. „Kontrolle halten“)? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Die sichtbaren Lösungsarten werden nach dem Deutsch-first-Prinzip als Pass, Puck führen, Kontrolle halten und Befreiung bezeichnet. Carry wird durch Puck führen ersetzt. Das bisherige Sichern wird zu Kontrolle halten, damit keine Verwechslung mit der A1-Funktion Absichern entsteht. Befreiung bleibt als verständlicher deutscher RinQ-Begriff erhalten und bezeichnet eine Lösung, bei der die unmittelbare Druck- oder Gefahrensituation vorrangig aufgelöst wird, auch wenn dabei Puckbesitz oder Anschlussmöglichkeiten verloren gehen können. Sie ist vom A2-Begriff Tief spielen abzugrenzen: Tief spielen beschreibt eine taktische Platzierung in die Tiefe; eine Befreiung priorisiert das unmittelbare Auflösen von Druck oder Gefahr. Pass, Carry, Secure, Clear und gegebenenfalls Dump können im Glossar als englische Suchbegriffe oder Synonyme hinterlegt werden, sollen aber nicht die primären UI-Bezeichnungen sein. Theorie, Auswahloptionen, Feedback, Auswertung und Hover-over-Glossar konsistent anpassen. Interne IDs möglichst stabil halten und sichtbare Labels gezielt ändern. Nach geprüfter Umsetzung kann der Status auf CONFIRMED_AS_RINQ_MODEL gesetzt werden.|
| **human_source_refs** | DEB-RTK-ONLINE-2020 — deutsche Vermittlung von Stocktechnik und taktischem Verhalten im Spielkontext: https://www.deb-online.de/2020/04/30/online-rahmentrainingskonzeption/ · IIHF-COACHING — allgemeine Grundlage für spielnahe Lösungen und Entscheidungsentwicklung: https://www.iihf.com/en/statichub/20485/coaching · RINQ-TERMINOLOGY-DECISION — Deutsch-first; Abgrenzung zu A1 Absichern und A2 Tief spielen|

---

### HR-B2-C3 — Ursache ≠ Outcome

| Feld | Wert |
|------|------|
| **claim_id** | B2-C3 |
| **Ort** | B2_D3 |
| **Claim** | Dominante Bedingung erklärt die Lösung, nicht das Ergebnis |
| **Warum HR** | Zentrale Haltung Premium-Track; Nutzer-Feedback |
| **Was prüfen** | Ursachenliste vs. D1-Quellen redundant? |
| **AI-Evidence** | MODERATE — RPD / familiarity research |
| **Offene Frage** | D1 und D3 zu ähnlich? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** |Die Aussage „die dominante Bedingung erklärt die Lösung“ wird epistemisch geschärft. Aus einer beobachteten Szene können weder die tatsächliche Ursache noch die Wahrnehmung oder Absicht des Spielers sicher abgeleitet werden. B2 erfasst deshalb den am stärksten sichtbaren Einflussfaktor und setzt ihn zur gewählten Lösung in Beziehung. Formulierungen wie „Ursache“, „erklärt die Entscheidung“ oder „der Spieler entschied sich deshalb“ sind durch beobachtbare Formulierungen zu ersetzen, zum Beispiel: „In dieser Szene war wenig verfügbare Zeit der auffälligste Druckfaktor; der Spieler wählte einen Pass.“ D1 und D3 bleiben didaktisch unterscheidbar: D1 trainiert das getrennte Erkennen der Beobachtungsdimensionen; D3 verbindet den auffälligsten Faktor mit der sichtbaren Lösung, ohne Kausalität zu behaupten. Theorie, Aufgabenstellung, KI-Feedback und Hover-over-Glossar entsprechend anpassen. Nach geprüfter Umsetzung kann der Status auf CONFIRMED_AS_RINQ_MODEL gesetzt werden. |
| **human_source_refs** | DEB-RTK-ONLINE-2020 — taktisches Verhalten wird an das Spielgeschehen angepasst: https://www.deb-online.de/2020/04/30/online-rahmentrainingskonzeption/ · IIHF-COACHING — Coaching- und Reflexionsrahmen, aber keine Grundlage für sichere Ursachenzuschreibungen aus Einzelbeobachtungen: https://www.iihf.com/en/statichub/20485/coaching · RINQ-METHODOLOGY-DECISION — Beobachtung wird von Interpretation und Kausalbehauptung getrennt|

---

### HR-B2-C4 — Anschluss vs. A3

| Feld | Wert |
|------|------|
| **claim_id** | B2-C4 |
| **Ort** | B2_D4 |
| **Claim** | Erste Anschlussentscheidung nach Puckgewinn (Tempo/Kontrolle/Absichern) |
| **Warum HR** | Boundary zu A3 Fortsetzung/Kontrolle; Verwechslungsrisiko |
| **Was prüfen** | Didaktik klar genug getrennt? |
| **AI-Evidence** | MODERATE — Transition-Optionen |
| **Offene Frage** | Labels an A3 angleichen oder bewusst anders halten? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | B2_D4 wird klar von A3 abgegrenzt. A3 analysiert das kollektive Umschalten nach einem Puckgewinn: gemeinsame Richtung, Anschlussrollen und Absicherung. B2_D4 betrachtet ausschließlich die erste sichtbare Lösung des neuen Puckführers unter den vorhandenen Druckbedingungen. Der Drill soll deshalb nicht erneut allgemein zwischen Tempo, Kontrolle und Absichern klassifizieren. Stattdessen werden die B2-Lösungsarten Pass, Puck führen, Kontrolle halten, Befreiung und bei Bedarf Unklar verwendet und mit dem auffälligsten sichtbaren Druckfaktor verbunden. A3-Begriffe wie Sofort fortsetzen, Kontrolliert neu aufbauen und Absicherung sichtbar bleiben der kollektiven Umschaltanalyse vorbehalten. Theorie, Drilltitel, Aufgabenstellung, Feedback, Auswertung und Hover-over-Glossar müssen diese Grenze ausdrücklich erklären. Nach geprüfter Umsetzung kann der Status auf CONFIRMED_AS_RINQ_MODEL gesetzt werden.|
| **human_source_refs** | DEB-RTK-ONLINE-2020 — positions- und spielangepasster Ausbau taktischen Verhaltens: https://www.deb-online.de/2020/04/30/online-rahmentrainingskonzeption/ · IIHF-COACHING — spielnahe Entscheidungsentwicklung: https://www.iihf.com/en/statichub/20485/coaching · RINQ-CURRICULUM-BOUNDARY-A3-B2 — A3 = kollektives Umschalten; B2 = erste individuelle Drucklösung des Puckführers|

---

### HR-B2-C5 — Muster / Profil

| Feld | Wert |
|------|------|
| **claim_id** | B2-C5 |
| **Ort** | B2_D5 |
| **Claim** | Entscheidungsprofil als heutige Tendenz, keine Team-Identität |
| **Warum HR** | MiniFeedback „Entscheidungsprofil des Teams“ kann härter klingen als Disclaimer |
| **Was prüfen** | Copy „Profil“ vs. Disclaimer |
| **AI-Evidence** | Didaktik MODERATE |
| **Offene Frage** | „Profil“ durch „heutige Tendenz“ ersetzen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Der Ausdruck Entscheidungsprofil des Teams ist für die begrenzte Beobachtungsmenge zu stark und wird ersetzt. Verwendet werden heutige Beobachtungstendenz, Muster in dieser Stichprobe oder eine gleichwertige vorsichtige Formulierung. Das Ergebnis beschreibt nur, welche Lösungen in den ausgewählten Szenen unter den jeweils beobachteten Bedingungen häufiger vorkamen. Es beschreibt weder eine dauerhafte Team-Identität noch eine allgemeine Qualität, Philosophie oder Kompetenz des Teams. Im Feedback müssen Stichprobengröße und Kontext sichtbar bleiben. Bei sehr wenigen oder uneindeutigen Szenen darf kein stabiles Muster behauptet werden. Theorie, Ergebnistext, MiniFeedback und Hover-over-Glossar entsprechend anpassen. Nach geprüfter Umsetzung kann der Status auf CONFIRMED_AS_RINQ_MODEL gesetzt werden.|
| **human_source_refs** | DEB-RTK-ONLINE-2020 — langfristige und entwicklungsgemäße Ausbildung statt Identitätsableitung aus einzelnen Beobachtungen: https://www.deb-online.de/2020/04/30/online-rahmentrainingskonzeption/ · RINQ-METHODOLOGY-DECISION — Ergebnisse gelten für die analysierte Stichprobe und werden nicht als dauerhafte Team-Eigenschaft generalisiert|

---

## HUMAN_REVIEW_OPTIONAL

### HR-B2-MIN-001 — „muss der Spieler handeln“

|**claim_id** | B2-MIN-001 | **human_status** | `NEEDS_CHANGE` | **human_notes** |Die Formulierung „muss der Spieler handeln“ wird vermieden, weil sie normativ und zugleich unspezifisch ist. Je nach Satzkontext verwenden: „wählt der Spieler eine Lösung“, „wird eine Entscheidung sichtbar“ oder „reagiert der Spieler auf die Spielsituation“. Dabei keine innere Wahrnehmung, Absicht oder zwingende Ursache unterstellen. Die Anpassung ist als redaktionelle Schärfung gemeinsam mit B2-C3 umzusetzen. Nach geprüfter Umsetzung kann der Status auf CONFIRMED gesetzt werden.|

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) |
| **OPTIONAL** | **1** |

# Human Review — A1 & A2

**Status:** `NEEDS_CHANGE` umgesetzt (Curriculum/Theory/Glossar 2026-08-24) · Human-Final `CONFIRMED_AS_RINQ_MODEL` **noch offen** (Christoph)  
**Datum angelegt:** 2026-08-23 (Evidence-Closeout)  
**Umsetzung:** 2026-08-24 (Cursor, nach Human Notes)  
**AI-Evidence-Basis:** [`docs/qa/reviews/a1-a2-content-review.md`](../reviews/a1-a2-content-review.md) · [`docs/qa/sources/a1-a2-sources.md`](../sources/a1-a2-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md)

**Regel:** AI/automatisierte QA setzt **niemals** `human_status` auf `CONFIRMED`, `CONFIRMED_AS_RINQ_MODEL` oder `REJECTED`. Nur explizite menschliche Entscheidung (Christoph / fachlich Verantwortliche).

---

## Release-Stufen

| Stufe | Bedingung |
|-------|-----------|
| `CONTENT APPROVED` | Didaktik + Boundary (AI/Review) |
| `CONTENT + EVIDENCE APPROVED` | Evidence-Pass + Glossar/Metadaten |
| `CONTENT + EVIDENCE + HUMAN APPROVED` | Alle **HUMAN_REVIEW_REQUIRED**-Punkte menschlich abgeschlossen |

**Aktuell A1/A2:** `CONTENT + EVIDENCE APPROVED` · Human Notes umgesetzt · Final-Confirm **offen**

---

## Review-Punkte

### HR-A1-C4 — Sichern / Verbinden / Mit nach vorne

| Feld | Wert |
|------|------|
| **claim_id** | A1-C4 |
| **Track/Drill/Ort** | A1 · A1_D3 · `observation_guide.what_to_watch`, `functionOptions` |
| **Claim** | Funktionen: **Absichern**, **Verbinden**, **Angriff unterstützen** — operational definiert; keine feste Höhen-Zuordnung. |
| **Review-Priorität** | **HUMAN_REVIEW_REQUIRED** |
| **Warum menschliche Prüfung** | Zentrale A1-Beobachtungsschicht; DE-Triade ist **RinQ-Label**, nicht IIHF-Standard; MODERATE Evidence; beeinflusst Drill-Auswahl und KI-Feedback. |
| **Was prüfen/recherchieren** | Ob die drei Labels für DE-Coaches verständlich und nicht irreführend sind; ob englische Nähe (support / connecting / advancing) in Trainerkommunikation passt; ob Synonym-Konflikte (Absichern vs. Sichern) ok sind. |
| **Empfohlene Quellenarten** | DEB/BEV-Trainerfortbildung · IIHF Level I · erfahrene DEL/Nachwuchs-Coaches (Interview) |
| **AI-Evidence-Zusammenfassung** | MODERATE via SRC-01, SRC-02 — Konzepte Support/back-side/connecting abgedeckt; **Triade als Ganzes RinQ**. |
| **Offene Frage** | Triade beibehalten oder UI später auf Support/Connect/Advance vereinheitlichen? |
| **human_status** | `NEEDS_CHANGE` → **umgesetzt** (Final: Christoph → `CONFIRMED_AS_RINQ_MODEL`) |
| **human_notes** | ie Triade bleibt als RinQ-Beobachtungsmodell erhalten, wird aber zu **Absichern / Verbinden / Angriff unterstützen** vereinheitlicht. **Sichern** wird zu **Absichern**, weil damit die relationale Sicherheits- bzw. Rückoption klarer bezeichnet und eine Verwechslung mit „Sichern“ als Puckkontrolle in B2 vermieden wird. **Mit nach vorne** wird zu **Angriff unterstützen**, weil dies präziser ist, bereits als `summaryLabel` verwendet wird und der DEB-Terminologie entspricht. **Verbinden** bleibt als verständliches RinQ-Label bestehen. Die DEB-Quellen stützen die zugrunde liegenden Prinzipien: Freilaufen, Anbieten, Mitspieler unterstützen, Raumaufteilung, Anspielstationen und mehrere Optionen schaffen. „Angriff unterstützen“ wird in den DEB-Rahmenrichtlinien ausdrücklich genannt. Die Dreiteilung selbst sowie „Absichern“ und „Verbinden“ als feste Funktionskategorien sind keine nachgewiesene DEB-Taxonomie, sondern eine RinQ-eigene didaktische Operationalisierung. Nach konsistenter Umsetzung in Lernziel, Erklärung, Observation Guide, `functionOptions` und Feedback kann der Status auf `CONFIRMED_AS_RINQ_MODEL` gesetzt werden. |
| **implementation** | 2026-08-24: Labels/Goals/Theory/Glossar auf Absichern / Verbinden / Angriff unterstützen; IDs `securing`/`connecting`/`advancing` unverändert. |
| **human_source_refs** |DEB Rahmenrichtlinien für die Traineraus-, Fort- und Weiterbildung 2020, S. 23 · https://www.deb-rtk.de/basisschulung/taktisches-verhalten · https://www.deb-rtk.de/grundlagentraining/defensive-zone · https://www.deb-rtk.de/einfuehrung/wettspiel-in-den-ausbildungsstufen · https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf |

---

### HR-A1-C5 — Passoption / Anschlussoption / Absicherung

| Feld | Wert |
|------|------|
| **claim_id** | A1-C5 |
| **Track/Drill/Ort** | A1 · A1_D4 · `relationOptions`, `observation_guide` |
| **Claim** | **Direkte Passoption** · **Anschlussoption** · **Absicherung** als Beziehungstypen Puckführer↔Center. |
| **Review-Priorität** | **HUMAN_REVIEW_REQUIRED** |
| **Warum menschliche Prüfung** | Passoption SIHF-belegt; **Anschlussoption** ohne Standardterm; Absicherung vs. Support/Outlet (B1); MODERATE Evidence; Kern von A1_D4-Mechanik. |
| **Was prüfen/recherchieren** | Ob „Anschlussoption“ didaktisch trägt oder ersetzt werden sollte; Abgrenzung Absicherung vs. B1-Outlet; DE-Verbandsterminologie. |
| **Empfohlene Quellenarten** | SIHF Good Practice · DEB-Coach-Material · Praxis-Feedback aus Vereinstraining |
| **AI-Evidence-Zusammenfassung** | MODERATE — SRC-03 (Passoption), SRC-01/02 (Support); Anschlussoption = RINQ_OPERATIONAL_LABEL. |
| **Offene Frage** | Anschlussoption behalten oder glossar-näher an „next option“ / „Folgepass“ benennen? |
| **human_status** | `NEEDS_CHANGE` → **umgesetzt** (Final: Christoph → `CONFIRMED_AS_RINQ_MODEL`) |
| **human_notes** |Die Begriffe **Direkte Passoption / Anschlussoption / Absicherung** bleiben erhalten. Die DEB-Quellen stützen Passoptionen, Anspielstationen, Aufbauoptionen und Absicherung als taktische Prinzipien. **Anschlussoption** wurde nicht als feste DEB-Terminologie nachgewiesen und bleibt deshalb ein `RINQ_OPERATIONAL_LABEL`. Die aktuelle Definition ist grundsätzlich passend: Der Center ist nicht zwingend der nächste Passempfänger, ermöglicht aber eine unmittelbar folgende spielbare Verbindung, zum Beispiel Defense → Wing → Center. Die Kategorien können sich überschneiden: Eine direkte Passoption kann gleichzeitig absichern, eine Anschlussoption kann später eine Absicherungsfunktion übernehmen. Cursor soll deshalb in A1_D4 bei `observation_guide.how_to_decide` ausdrücklich ergänzen: **„Eine Beziehung kann mehrere Funktionen gleichzeitig erfüllen. Wähle die Funktion, die in der beobachteten Situation am stärksten auffällt.“** Die Definition der Anschlussoption soll außerdem einheitlich klarstellen: **„Der Center ist nicht zwingend der nächste Passempfänger, macht aber eine unmittelbar folgende spielbare Verbindung möglich.“** Die Begriffe nicht zu „Folgepass“ oder „nächste Option“ umbenennen, weil es um eine mögliche Verbindung und nicht zwingend um den tatsächlich folgenden Pass geht. Anschließend Theory, Lernziel, `relationOptions`, Mini-Feedback, Reflection Guidance und A1_D5 auf dieselbe Definition und die zulässige Überschneidung prüfen. Nach konsistenter Umsetzung kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden. |
| **human_source_refs** | DEB-RTK „Wettspiel/Playbook in den Ausbildungsstufen“: https://www.deb-rtk.de/einfuehrung/wettspiel-in-den-ausbildungsstufen · DEB-RTK „Neutrale Zone – Aufbautraining 2“: https://www.deb-rtk.de/aufbautraining-2/neutrale-zone · DEB „Deutschland-Eishockey Playbook“, insbesondere Passoptionen sowie „F3 – Absicherung und Gefahr“: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf · DEB Trainingstag „Offensive Zone“, F3-Absicherung und Interaktion mit Mitspielern: https://www.deb-rtk.de/fileadmin/user_upload/DEB_Trainingstag_Offensive_Zone.pdf|

---

### HR-A1-C6 — Dreieck / kleine Strukturen

| Feld | Wert |
|------|------|
| **claim_id** | A1-C6 |
| **Track/Drill/Ort** | A1 · A1_D5 · `structureType: triangle`, didactics |
| **Claim** | **Dreieck** = drei Spieler, mehrere spielbare Verbindungen, **keine Geometrieprüfung**; plus einfache Strukturformen. |
| **Review-Priorität** | **HUMAN_REVIEW_REQUIRED** |
| **Warum menschliche Prüfung** | Coaching-Metapher stark verbreitet, aber nicht universal; MODERATE Evidence; Risiko „Dreieck-Pflicht“ trotz Entschärfung. |
| **Was prüfen/recherchieren** | Ob Metapher für Zielgruppe (A1) angemessen ist; ob „Dreieck“ vs. „L-Support“/Triangle in DE-Training üblich ist. |
| **Empfohlene Quellenarten** | Weiss / Coaches Site / Belfry · SIHF · Nachwuchstrainer |
| **AI-Evidence-Zusammenfassung** | MODERATE — SRC-02, SRC-05, SRC-06; Anti-Geometrie aligned mit Belfry „handwritten L“. |
| **Offene Frage** | Dreieck-Label ok oder eher „kleine Gruppe mit mehreren Verbindungen“ ohne Geometrie-Wort? |
| **human_status** | `NEEDS_CHANGE` → **umgesetzt** (Final: Christoph → `CONFIRMED_AS_RINQ_MODEL`) |
| **human_notes** | *Dreieck** und die Beobachtung kleiner Strukturen bleiben erhalten. Der Begriff ist fachlich gestützt: Die DEB-Rahmenrichtlinien nennen das **Angriffsdreieck**, und das offizielle Deutschland-Eishockey-Playbook fordert in der offensiven Zone ausdrücklich, Angriffsdreiecke zu bilden. Die aktuelle RinQ-Definition „drei Spieler mit mehreren spielbaren Verbindungen – keine Geometrieprüfung“ ist jedoch zu weit, weil nicht jede verbundene Dreiergruppe automatisch eine erkennbare Dreiecksstruktur bildet. Cursor soll die Definition einheitlich schärfen zu: **„Drei Spieler bilden durch ihre Positionen eine ungefähr dreieckige Unterstützungsstruktur mit mehreren spielbaren Verbindungen. Es geht nicht um perfekte oder statische Geometrie.“** Außerdem soll die Abgrenzung präzisiert werden: **Mehrere Anschlussoptionen** bedeutet, dass mehrere nächste Verbindungen sichtbar sind, aber keine klar erkennbare räumliche Dreiecksstruktur; **Dreieck** bedeutet, dass drei Spieler aus unterschiedlichen Richtungen bzw. Winkeln eine ungefähr dreieckige Unterstützungsstruktur bilden; **Absicherungsstruktur** bedeutet, dass hinter oder neben der Aktion eine zusätzliche sichere Verbindung bestehen bleibt. Diese Klarstellung ist in Erklärung, `observation_guide.how_to_decide`, `structureOptions`, Mini-Feedback und Reflection Guidance konsistent einzupflegen. Die Formulierung „keine Geometrieprüfung“ darf sinngemäß erhalten bleiben, darf aber nicht bedeuten, dass jede Dreiergruppe als Dreieck gilt. Die vereinfachte Auswahl verschiedener kleiner Strukturformen bleibt ein RinQ-Beobachtungsmodell; der Begriff Angriffsdreieck selbst ist durch DEB-Material gestützt. Nach konsistenter Umsetzung kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden|
| **human_source_refs** | DEB Rahmenrichtlinien für die Traineraus-, Fort- und Weiterbildung 2020, S. 23 („Angriffsdreieck“) · DEB „Deutschland-Eishockey Playbook“, insbesondere Offensive Zone/OZ-Struktur und „Angriffsdreiecke bilden“: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf · DEB-RTK „Wettspiel/Playbook in den Ausbildungsstufen“: https://www.deb-rtk.de/einfuehrung/wettspiel-in-den-ausbildungsstufen · DEB-RTK „Überzahl/Unterzahl – Aufbautraining 1“, Dreiecksstrukturen: https://www.deb-rtk.de/aufbautraining-1/ueberzahl/unterzahl|

---

### HR-A2-C3 — Pass / Carry / Dump / Reset

| Feld | Wert |
|------|------|
| **claim_id** | A2-C3 |
| **Track/Drill/Ort** | A2 · A2_D3 · `executedActionOptions` |
| **Claim** | Entscheidung = genutzte Option; Aktion: **Pass, Carry, Dump, Reset** (+ unklar). |
| **Review-Priorität** | **HUMAN_REVIEW_REQUIRED** |
| **Warum menschliche Prüfung** | `RINQ_TAXONOMY`; Reset nicht Standard; Dump/Reset ohne Track-Glossar bis Closeout; beeinflusst Premium-Track A2 direkt. |
| **Was prüfen/recherchieren** | Ob Vierer-Set für Beobachter lernbar ist; ob Reset-Label durch „Rückpass/Regroup“ ersetzt oder glossiert werden soll; DE vs. EN in UI. |
| **Empfohlene Quellenarten** | Karlsson analytics · BVHS Regroup · IIHF · Coach-Praxis Breakout |
| **AI-Evidence-Zusammenfassung** | MODERATE — Pass/Carry/Dump SRC-08; Reset ≈ Regroup SRC-10/11; Taxonomie explizit RinQ. |
| **Offene Frage** | Reset im UI behalten mit Glossar-Hinweis — ausreichend? |
| **human_status** | `NEEDS_CHANGE` → **umgesetzt** (Final: Christoph → `CONFIRMED_AS_RINQ_MODEL`) |
| **human_notes** |Die Vierer-Taxonomie bleibt als RinQ-Beobachtungsmodell erhalten, wird für die deutschsprachige UI aber zu **Pass / Puck führen / Tief spielen / Neuaufbau** geändert. **Carry** wird zu **Puck führen**, weil dies die sichtbare Aktion verständlich beschreibt und an die deutsche Fachsprache „Puckführung/Scheibenführung“ anschließt. **Dump** wird zu **Tief spielen**, weil der Puck bewusst tief oder in freien Raum gespielt wird; „Befreiung“ ist kein geeigneter Ersatz, da eine Befreiung eine spezielle defensive Drucklösung bezeichnet, während ein tief gespielter Puck auch dem Raumgewinn oder der Vorbereitung eines Forechecks dienen kann. **Reset** wird zu **Neuaufbau**, weil der Begriff den taktischen Zweck verständlich beschreibt und an die DEB-Terminologie „Neuaufbau“ und „Regroup“ anschließt. Cursor soll in A2_D3 die Labels, Hints, Erklärungen, Observation Guide, Mini-Feedback, Zusammenfassungen und Reflection Guidance konsistent anpassen. Zieldefinitionen: **Pass:** „Der Puck wird gezielt zu einem Mitspieler gespielt.“ **Puck führen:** „Der Spieler behält den Puck und bewegt ihn selbst kontrolliert weiter.“ **Tief spielen:** „Der Puck wird bewusst tief oder in freien Raum gespielt, ohne einen unmittelbar vorgesehenen Passempfänger.“ **Neuaufbau:** „Der unmittelbare Vorwärtsversuch wird bewusst zurückgenommen, damit das Team unter Kontrolle neue Struktur und neue Optionen herstellen kann.“ Zusätzlich ist eine Prioritätsregel aufzunehmen: **„Kann eine Aktion sowohl als Pass als auch als Neuaufbau beschrieben werden, wähle Neuaufbau, wenn das bewusste Zurücknehmen und Neuordnen die auffälligste Funktion der Aktion ist.“** Nicht jeder Rückpass ist automatisch ein Neuaufbau. **Regroup** ist eine konkrete Form des Neuaufbaus, insbesondere in der neutralen Zone; nicht jeder Neuaufbau ist ein Regroup. Auch „Tief spielen“ ist von einem gezielten Pass in den tiefen Raum abzugrenzen: Gibt es einen klar vorgesehenen Passempfänger, wird **Pass** gewählt; wird der Puck ohne unmittelbar kontrollierten Empfänger bewusst tief oder in freien Raum gebracht, wird **Tief spielen** gewählt. Die Taxonomie als Ganzes ist keine nachgewiesene DEB-Standardtaxonomie, sondern eine RinQ-eigene didaktische Einteilung auf Grundlage etablierter Hockeyaktionen. Das Hover-over-Glossar ist im selben Pass anzupassen: Die primären deutschen Einträge sollen **Puck führen**, **Tief spielen** und **Neuaufbau** heißen. Die englischen Begriffe **Carry**, **Dump** und **Reset** sollen als Synonyme/englische Nähe dokumentiert werden, nicht als primäre UI-Begriffe. Der Glossareintrag **Regroup** muss als spezifische Form des Neuaufbaus abgegrenzt werden. Cursor soll anschließend das gesamte Curriculum auf Carry-, Dump- und Reset-Vorkommen prüfen. Nutzerseitige Texte sind dort anzupassen, wo dieselbe Bedeutung vorliegt; keine blinde globale Ersetzung, da Begriffe in späteren Tracks kontextspezifischer verwendet werden können. Interne IDs wie `carry`, `dump` und `reset` dürfen aus Gründen der Daten- und Auswertungskompatibilität bestehen bleiben, sofern sie nicht in der UI angezeigt werden. Nach Umsetzung sind Theory↔Drill, Feedback, Glossar und nachgelagerte Tracks auf konsistente Terminologie zu prüfen. Danach kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden. |
| **human_source_refs** |DEB Rahmenrichtlinien für die Traineraus-, Fort- und Weiterbildung 2020, S. 23 („Re-group“, „Neuaufbau in der NZ“) · DEB-RTK Glossar, Definition von „Regroup“ als Neuaufbau in der neutralen Zone: https://www.deb-rtk.de/einfuehrung/glossar-und-erlaeuterungen · DEB-RTK „Überzahl/Unterzahl – Aufbautraining 2“, Dump, Rim, Pass, Drop-back und Aufbau: https://www.deb-rtk.de/aufbautraining-2/ueberzahl/unterzahl · DEB-RTK „Überzahl/Unterzahl – Anschlusstraining“, Neutral-Zone-Regroup: https://www.deb-rtk.de/anschlusstraining/ueberzahl/unterzahl · DEB-RTK „Defensive Zone“, Aufbauoptionen und selbst mit dem Puck laufen: https://www.deb-rtk.de/grundlagentraining/defensive-zone · DEB-RTK „Torwartspiel“, Rims/Dumps als tief gespielte Pucks und direkte Anspielstationen: https://www.deb-rtk.de/einfuehrung/torwartspiel  |

---

### HR-A2-C7 — Puckbesitzwechsel / Strukturveränderung (Transition-Teaser)

| Feld | Wert |
|------|------|
| **claim_id** | A2-C7 |
| **Track/Drill/Ort** | A2 · A2_D5 · `learning_hint`, `handoffText` *(Micro-Pass 2026-08-23)* |
| **Claim** | „**Ein häufig zentraler Moment für Strukturveränderungen ist ein Wechsel des Puckbesitzes.**“ → Teaser A3 Transition. |
| **Review-Priorität** | **HUMAN_REVIEW_REQUIRED** |
| **Warum menschliche Prüfung** | Grenzfall Content/Evidence; Transition-Konzept belegt, Struktur-Framing RinQ; A3 echo in `A3_D1.why_it_matters` noch alte Formulierung — Boundary-Hinweis. |
| **Was prüfen/recherchieren** | Ob entschärfte Formulierung fachlich + didaktisch reicht; ob A3_D1-Echo synchronisiert werden soll (separater A3-Pass). |
| **Empfohlene Quellenarten** | USA Hockey Transition · IIHF · Rollins/Perron |
| **AI-Evidence-Zusammenfassung** | MODERATE — SRC-07, SRC-01, SRC-09; Superlativ entfernt im Closeout. |
| **Offene Frage** | ~~A3_D1 `why_it_matters` + „wichtigster Trigger“ in A3 — im A3-Review nachziehen?~~ → **A3_D1 Micro-Pass erledigt** (2026-08-23, siehe `a3-content-review.md` §8.1). Optional: A3_D1 `description`/`explanation` menschlich gegenlesen. |
| **human_status** | `NEEDS_CHANGE` → **umgesetzt** (Final: Christoph → `CONFIRMED_AS_RINQ_MODEL`) |
| **human_notes** | Der fachliche Kern des Claims wird bestätigt: Ein Wechsel des Puckbesitzes führt im Eishockey häufig zu einem Umschalten zwischen offensiven und defensiven Aufgaben und damit zu Veränderungen von Rollen, Laufwegen, Abständen und Unterstützungsbeziehungen. Die DEB-Rahmentrainingskonzeption beschreibt ausdrücklich schnelles Umschalten von Abwehr auf Angriff, unmittelbare Rückreaktionen nach Puckverlust sowie veränderte Aufgaben nach Puckgewinn und Puckverlust. Der Claim bleibt bewusst qualifiziert: Puckbesitzwechsel ist **häufig ein zentraler Auslöser**, aber nicht der einzige mögliche Auslöser einer Strukturveränderung. Cursor soll die Formulierung in A2_D5 vereinheitlichen zu: **„Ein Wechsel des Puckbesitzes ist häufig ein zentraler Auslöser für strukturelle Veränderungen.“** Die Begriffe **Transition** und **Transitionsmoment** sollen in der deutschsprachigen Nutzeroberfläche grundsätzlich durch **Umschalten** und **Umschaltmoment** ersetzt werden. Der Übergang zu A3 soll entsprechend lauten: **„Als Nächstes beobachtest du in A3 Umschaltmomente: wann die Situation kippt und was die Spieler danach tun – noch ohne das Umschalten zu bewerten.“** A3 soll im selben Pass auf sprachliche Konsistenz geprüft werden, insbesondere Modultitel, Summary, Description, Lernziele, A3_D1-Titel, `description`, `goal`, `why_it_matters`, Erklärung, Observation Guide, Feedback und Konfiguration. Empfohlener deutscher Modultitel: **„A3 – Umschalten & Tempo“**. Dabei keine blind-mechanische Ersetzung vornehmen: „Transition“ kann in internen IDs oder technischen Datenfeldern bestehen bleiben, sofern es nicht nutzerseitig angezeigt wird. Im Hover-over-Glossar soll **Umschalten** der primäre Begriff sein. Definition: **„Wechsel zwischen offensiven und defensiven Aufgaben, häufig ausgelöst durch Puckgewinn oder Puckverlust.“** `Transition` wird dort als englisches Synonym dokumentiert. **Umschaltmoment** soll definiert werden als: **„Der beobachtbare Moment, in dem sich die Spielsituation verändert und Spieler ihre Aufgaben und Bewegungsrichtungen neu ausrichten.“** Das Glossar muss außerdem klarstellen, dass nicht jede Strukturveränderung durch einen Puckbesitzwechsel ausgelöst wird und ein Puckbesitzwechsel nicht automatisch eine gute oder schlechte Umschaltaktion bedeutet. Nach der Anpassung sind A2_D5 und A3_D1 gemeinsam als Boundary-Paar zu prüfen: identische Kernaussage, keine vorgezogene Bewertung in A2 und keine widersprüchliche Absolutheit in A3. Nach konsistenter Umsetzung kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden, da die Bedeutung des Umschaltens durch DEB-Material gestützt wird, während das konkrete Struktur-Framing Teil des RinQ-Lernmodells ist. |
| **human_source_refs** | EB-RTK „Motorik/Athletik – Basisschulung“, ausdrücklich „Puckverlust heißt Umschalten auf Abwehr“: https://www.deb-rtk.de/basisschulung/motorik/athletik · DEB-RTK „Defensive Zone“, schnelles Umschalten von Abwehr auf Angriff und Rückreaktion nach Puckverlust: https://www.deb-rtk.de/grundlagentraining/defensive-zone · DEB-RTK „Offensive Zone – Grundlagentraining“, Umschalten sowie veränderte Aufgaben nach Puckverlust: https://www.deb-rtk.de/grundlagentraining/offensive-zone · DEB-RTK „Offensive Zone – Aufbautraining 2“, sofortige Reaktion und Wiedergewinnversuch nach Puckverlust: https://www.deb-rtk.de/aufbautraining-2/offensive-zone · DEB-RTK „Überzahl/Unterzahl – Anschlusstraining“, schnelles Umschalten und Transition im PP: https://www.deb-rtk.de/anschlusstraining/ueberzahl/unterzahl · DEB Trainingstag „Rollen“, Rollenwechsel, Puckgewinn und Umschalten: https://www.deb-rtk.de/fileadmin/user_upload/DEB_Trainingstag_Rollen.pdf |

---

## OPTIONAL — weitere A1/A2-Punkte

### HR-A1-C1 — Center als Einstieg (OPTIONAL)

| Feld | Wert |
|------|------|
| **claim_id** | A1-C1 |
| **Review-Priorität** | **HUMAN_REVIEW_OPTIONAL** |
| **Claim** | Center als guter Einstieg; pendelt zwischen Aufgaben/Räumen. |
| **Warum optional** | Didaktische Wahl (RINQ_MODEL-Anteil); OPTIONAL Evidence; geringes Reputationsrisiko. |
| **human_status** | `NOT_REVIEWED` |
| **human_notes** | |

### HR-A2-C5 — Raum / Zeit / Gegnerdruck (OPTIONAL)

| Feld | Wert |
|------|------|
| **claim_id** | A2-C5 |
| **Review-Priorität** | **HUMAN_REVIEW_OPTIONAL** |
| **Claim** | Optionen entstehen nicht zufällig; Raum, Zeit, Gegnerdruck. |
| **Warum optional** | Konvention plausibel; „nicht zufällig“ leicht absolut — Formulierung optional prüfen. |
| **human_status** | `NOT_REVIEWED` |
| **human_notes** | |

### HR-A1-C3 — Low / Middle / High (OPTIONAL)

| Feld | Wert |
|------|------|
| **claim_id** | A1-C3 |
| **Review-Priorität** | **HUMAN_REVIEW_OPTIONAL** |
| **Claim** | RinQ räumliche Höhen-Labels Low/Middle/High. |
| **Warum optional** | Explizit RINQ_MODEL; kein Evidence-Zwang; kurz bestätigen, dass Labels nicht als IIHF gelten. |
| **human_status** | `NEEDS_CHANGE` → **umgesetzt** (Final: Christoph → `CONFIRMED_AS_RINQ_MODEL`) |
| **human_notes** | Die A1-Beobachtungskategorien **Low / Middle / High** werden in der deutschsprachigen Nutzeroberfläche durch **Hinter dem Spiel / Auf Verbindungshöhe / Vor dem Spiel** ersetzt; **Unklar** bleibt bestehen. Die DEB-Rahmentrainingskonzeption verwendet „hoch“ und „tief“ als räumliche Hockeybegriffe, beispielsweise „tief anbieten“, „hoch bleiben“ oder „hoch kommen“. Eine feste Dreiteilung Low/Middle/High relativ zum aktuellen Spiel wurde jedoch nicht als DEB-Standardtaxonomie nachgewiesen. Die Einteilung bleibt daher ein RinQ-Beobachtungsmodell. Die längeren deutschen Labels werden gewählt, weil **Mitte** mit Spielfeldmitte oder Mittelbahn und **tief/hoch** mit festen Zonenpositionen verwechselt werden könnten. Cursor soll folgende Definitionen konsistent verwenden: **Hinter dem Spiel:** „Der Center befindet sich relativ zur aktuellen Aktion eher auf der rückwärtigen Seite.“ **Auf Verbindungshöhe:** „Der Center befindet sich zwischen rückwärtiger Absicherung und vorderer Fortsetzung und kann Spieler oder Räume verbinden.“ **Vor dem Spiel:** „Der Center befindet sich relativ zur aktuellen Aktion eher auf der vorwärtsgerichteten Seite.“ **Unklar:** „Der Center wurde gefunden, seine relative Höhe ist in diesem Moment aber nicht eindeutig.“ Cursor soll A1-Lernziel, A1_D2 und die nachfolgenden A1-Drills auf sämtliche nutzerseitigen Vorkommen von Low/Middle/High prüfen und Erklärung, Observation Guide, Optionen, Hints, Guidance, Mini-Feedback, Zusammenfassungen und Reflection Guidance konsistent anpassen. Die zentrale Erläuterung muss erhalten bleiben: **Die Kategorien beschreiben die Position relativ zum aktuellen Spiel und keine drei starren Streifen auf dem Eis.** Interne IDs `low`, `middle` und `high` dürfen aus Gründen der Datenkompatibilität bestehen bleiben, sofern sie nicht nutzerseitig angezeigt werden. Das Hover-over-Glossar ist im selben Pass um **Hinter dem Spiel**, **Auf Verbindungshöhe** und **Vor dem Spiel** zu erweitern. Low, Middle und High werden dort als bisherige beziehungsweise englische RinQ-Bezeichnungen dokumentiert, nicht als primäre UI-Begriffe. Diese Änderung ist ausdrücklich auf die relative A1-Beobachtungstaxonomie begrenzt. Spätere taktische Begriffe wie **Low Cycle**, **High Slot**, **High/Point** oder **Low-to-High** dürfen nicht automatisch ersetzt werden; sie werden bei der Human Review der jeweiligen Tracks separat auf deutsche Benennung und fachlichen Kontext geprüft. Nach Umsetzung ist A1_D2→A1_D3→A1_D4 auf durchgängige Terminologie zu prüfen. Danach kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden.|
| **human_source_refs** | DEB-RTK „Defensive Zone“, unter anderem tiefes Anbieten, Mittelstürmer-Unterstützung und räumliche Ebenen: https://www.deb-rtk.de/grundlagentraining/defensive-zone · DEB-RTK „Wettspiel/Playbook in den Ausbildungsstufen“, unter anderem „Spieler bleibt hoch“ und „Stürmer bieten sich tief an“: https://www.deb-rtk.de/einfuehrung/wettspiel-in-den-ausbildungsstufen · DEB „Deutschland-Eishockey Playbook“, unter anderem „F3 High“, „F1 low high“ und „F3 kommt hoch“: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf |

---

## Zusammenfassung

| Priorität | Anzahl | claim_ids |
|-----------|--------|-----------|
| **HUMAN_REVIEW_REQUIRED** | **5** | A1-C4, A1-C5, A1-C6, A2-C3, A2-C7 |
| **HUMAN_REVIEW_OPTIONAL** | **3** | A1-C1, A1-C3, A2-C5 |

**Nächster Schritt (menschlich):** Umgesetzte `NEEDS_CHANGE`-Punkte in UI/Theory gegenlesen → bei OK `CONFIRMED_AS_RINQ_MODEL` setzen → dann **`CONTENT + EVIDENCE + HUMAN APPROVED`**.

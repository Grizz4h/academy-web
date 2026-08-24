# Human Review — A3

**Status:** `NOT_REVIEWED` (alle Punkte)  
**Datum:** 2026-08-23  
**AI-Evidence:** [`a3-content-review.md`](../reviews/a3-content-review.md) · [`a3-sources.md`](../sources/a3-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § A3

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Human **offen**

---

## HUMAN_REVIEW_REQUIRED

### HR-A3-C1 — Transitionsmoment / Puckbesitzwechsel

| Feld | Wert |
|------|------|
| **claim_id** | A3-C1 |
| **Ort** | A3_D1 (description, goal, why_it_matters, explanation, how_to_decide) |
| **Claim** | Puckbesitzwechsel als **häufig zentraler Auslöser** für Phasenwechsel; nicht jeder Strukturwechsel vom Puck. |
| **Warum HR** | Kern des A3-Tracks; Premium-relevant; war Superlativ-Debt von A2; MODERATE Evidence. |
| **Was prüfen** | Ob entschärfte Formulierung didaktisch reicht; ob „Auslöser“ vs. „Trigger“ DE ok ist. |
| **Quellenarten** | USA Hockey Transition · IIHF · DEB-Coach-Praxis |
| **AI-Evidence** | MODERATE — SRC-07, SRC-01, SRC-09; aligned A2_D5. |
| **Offene Frage** | „Auslöser“ vs. „Trigger“ vereinheitlichen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Der fachliche Kern wird bestätigt: Ein Wechsel des Puckbesitzes ist häufig ein zentraler Auslöser für das Umschalten und damit verbundene Veränderungen von Rollen, Laufwegen, Abständen und Unterstützungsbeziehungen. Die DEB-Rahmentrainingskonzeption beschreibt ausdrücklich schnelles Umschalten nach Puckgewinn sowie unmittelbare defensive Rückreaktionen nach Puckverlust. Die Formulierung bleibt bewusst qualifiziert: Ein Puckbesitzwechsel ist **häufig ein zentraler Auslöser**, aber nicht der einzige mögliche Auslöser einer veränderten Spielsituation. Im deutschsprachigen Produkt wird **Auslöser** statt **Trigger**, **Umschalten** statt **Transition** und **Umschaltmoment** statt **Transitionsmoment** verwendet. Cursor soll A3 entsprechend vereinheitlichen: empfohlener Modultitel **„A3 – Umschalten & Tempo“**, Drilltitel **„Umschaltmoment erkennen“** und zentrale Formulierung **„Ein Wechsel des Puckbesitzes ist häufig ein zentraler Auslöser für strukturelle Veränderungen.“** A3_D1 soll zusätzlich klarstellen: **„Nicht jede Strukturveränderung entsteht durch einen Puckbesitzwechsel. Auch andere klar erkennbare Wechsel der Spielsituation dürfen als Umschaltmoment erfasst werden.“** Modultitel, Summary, Description, Lernziele, A3_D1 `description`, `goal`, `why_it_matters`, Erklärung, Observation Guide, Mini-Feedback und nutzerseitige Konfiguration sind konsistent anzupassen. A2_D5 und A3_D1 müssen anschließend gemeinsam geprüft werden: A2 bereitet das Thema lediglich vor, A3 trainiert das Erkennen des Umschaltmoments; beide verwenden dieselbe qualifizierte Kernaussage und keine Superlative. Das Hover-over-Glossar ist im selben Pass anzupassen: **Umschalten** ist der primäre deutsche Begriff, `Transition` das englische Synonym. Definition Umschalten: **„Wechsel zwischen offensiven und defensiven Aufgaben, häufig ausgelöst durch Puckgewinn oder Puckverlust.“** Definition Umschaltmoment: **„Der beobachtbare Moment, in dem sich die Spielsituation verändert und Spieler ihre Aufgaben und Bewegungsrichtungen neu ausrichten.“** Interne IDs dürfen unverändert bleiben, sofern sie nicht nutzerseitig angezeigt werden. Nach konsistenter Umsetzung kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden, weil das Umschalten nach Puckgewinn und Puckverlust durch DEB-Material gestützt wird, während das konkrete Struktur-Framing Teil des RinQ-Lernmodells ist. |
| **human_source_refs** | DEB-RTK „Motorik/Athletik – Basisschulung“, ausdrücklich „Puckverlust heißt Umschalten auf Abwehr“: https://www.deb-rtk.de/basisschulung/motorik/athletik · DEB-RTK „Defensive Zone“, schnelles Umschalten von Abwehr auf Angriff und Rückreaktion nach Puckverlust: https://www.deb-rtk.de/grundlagentraining/defensive-zone · DEB-RTK „Offensive Zone – Grundlagentraining“, Umschalten sowie veränderte Aufgaben nach Puckverlust: https://www.deb-rtk.de/grundlagentraining/offensive-zone · DEB-RTK „Offensive Zone – Aufbautraining 2“, unmittelbare Reaktion nach Puckverlust: https://www.deb-rtk.de/aufbautraining-2/offensive-zone · DEB Trainingstag „Rollen“, Rollenwechsel, Puckgewinn, Puckverlust und Umschalten: https://www.deb-rtk.de/fileadmin/user_upload/DEB_Trainingstag_Rollen.pdf |

---

### HR-A3-C9 — Rollen nach Puckgewinn

| Feld | Wert |
|------|------|
| **claim_id** | A3-C9 |
| **Ort** | A3_D2 `role_context` |
| **Claim** | Beschleuniger, Absicherung, Erste Passoption, Tiefengeber, Unterstützer — Muster, keine festen Positionen. |
| **Warum HR** | RinQ-Fünfer-Raster; beeinflusst period_checkin; MODERATE; mehrere Coach-Schulen. |
| **Was prüfen** | Verständlich für DE-Nachwuchs? Synonyme? Zu viele Labels? |
| **Quellenarten** | USA Hockey Transition · Vereinstrainer |
| **AI-Evidence** | MODERATE — Konzept Support/backcheck; Liste RinQ. |
| **Offene Frage** | Labels behalten oder auf 3 Kernrollen reduzieren? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Das RinQ-Rollenraster nach Puckgewinn bleibt grundsätzlich erhalten, wird aber von fünf überschneidenden Labels auf vier klarer beobachtbare situative Funktionen reduziert: **Puckführer / Erste Passoption / Tiefenläufer / Absicherung**. **Puckführer:** „Bewegt oder passt den Puck nach dem Gewinn kontrolliert nach vorne.“ **Erste Passoption:** „Bietet sich unmittelbar und sichtbar für den ersten Pass an.“ **Tiefenläufer:** „Läuft in freien Raum, gibt dem Angriff Tiefe oder zieht Gegenspieler auseinander.“ **Absicherung:** „Bleibt gestaffelt hinter oder neben dem ersten Angriff und hält eine sichere weitere Verbindung offen.“ **Beschleuniger** wird durch **Puckführer** ersetzt, weil damit ein unmittelbar beobachtbarer Beteiligter und dessen Verhalten bezeichnet wird. **Tiefengeber** wird zu **Tiefenläufer**, weil die sichtbare Bewegung statt einer abstrakten Wirkung benannt wird. **Unterstützer** entfällt als eigene Kategorie, da Unterstützung ein Oberbegriff ist und sich mit erster Passoption, Tiefenlauf und Absicherung überschneidet. Cursor soll ausdrücklich ergänzen: **„Das sind situative Funktionen nach dem Puckgewinn, keine festen Spielerpositionen. Ein Spieler kann innerhalb weniger Sekunden zwischen diesen Funktionen wechseln und mehrere Funktionen nacheinander erfüllen.“** A3_D2 `role_context`, Erklärung, Focus Text, Observation Guide, Common Mistakes, Mini-Feedback, `role_structure_indicators` und alle weiteren nutzerseitigen Vorkommen sind konsistent anzupassen. Die aktuelle bewertende Sprache widerspricht dem Beobachtungsziel und ist zu neutralisieren: **„Reagieren mehrere Spieler sinnvoll aufeinander?“** wird zu **„Sind die Reaktionen mehrerer Spieler erkennbar aufeinander bezogen?“**; **„gute Rollenverteilung“** wird zu **„klare bzw. erkennbare Rollenverteilung“**. Fragen wie **„Ist Kontrolle ein geplanter Schritt oder ein Zeichen von Unsicherheit?“** sind zu entfernen oder rein beobachtend umzuformulieren, da die Absicht aus der Szene nicht sicher ableitbar ist. Ebenso ist **„Welche minimale, klare Erstaktion hätte Stabilität erzeugt?“** zu entfernen, weil dies bereits eine Coaching-Alternative verlangt. Stattdessen soll gefragt werden, woran Kontrolle, Vorwärtsbewegung, Tiefenlauf, Passoption oder Absicherung sichtbar wurden. Das Hover-over-Glossar ist im selben Pass um **Puckführer**, **Erste Passoption**, **Tiefenläufer** und **Absicherung nach Puckgewinn** zu ergänzen. Die Glossareinträge müssen darauf hinweisen, dass es sich um situative RinQ-Funktionslabels und nicht um feste Positionsrollen oder eine nachgewiesene DEB-Rollentaxonomie handelt. **Absicherung nach Puckgewinn** ist außerdem von der A1-Kategorie Absichern konsistent abzuleiten: In beiden Fällen bleibt hinter oder neben der Aktion eine sichere weitere Verbindung erhalten; A3 betrachtet diese Funktion speziell in den ersten Sekunden des Umschaltens. Nach Umsetzung sind A3_D1→A3_D2→A3_D3 sowie die A1-Terminologie auf Konsistenz zu prüfen. Danach kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden. |
| **human_source_refs** |DEB Trainingstag „Rollen“, Rollen im Umschalten, offensives Verhalten mit und ohne Puck, Freilaufen, Unterstützen sowie Pass- und Laufbahnen schaffen: https://www.deb-rtk.de/fileadmin/user_upload/DEB_Trainingstag_Rollen.pdf · DEB „Deutschland-Eishockey Playbook“, Umschaltprinzipien nach Scheibengewinn: Puck nach vorne bewegen oder passen, alle fünf Spieler bereit, Unterstützung: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf · DEB-RTK „Defensive Zone – Grundlagentraining“, Bahnen besetzen, Mittelbahndrang, Zug zum Tor und Unterstützung beim Gegenangriff: https://www.deb-rtk.de/grundlagentraining/defensive-zone · DEB-RTK „Neutrale Zone – Anschlusstraining“, Passoption, nachfolgender Mitspieler, Mittelbahndrang und Einbindung des Verteidigers: https://www.deb-rtk.de/anschlusstraining/neutrale-zone · DEB-RTK „Defensive Zone – Aufbautraining 2“, schnelles Anbieten, nahe Unterstützung und wiederholtes Herstellen neuer Optionen: https://www.deb-rtk.de/aufbautraining-2/defensive-zone |

---

### HR-A3-C12 — Fortsetzen vs. Kontrolle

| Feld | Wert |
|------|------|
| **claim_id** | A3-C12 |
| **Ort** | A3_D3 |
| **Claim** | Sichtbare Richtung: direkte Fortsetzung / Kontrolle / Absicherung — kein richtig/falsch; „Rush vs. Stop“ als Nähe. |
| **Warum HR** | Zentrale A3-Beobachtungsschicht; RinQ-Labels; Feedbackeffekt auf Nutzer-Lesen. |
| **Was prüfen** | Ob Dreier-Set didaktisch trägt; EN-Jargon in Didaktik ok? |
| **Quellenarten** | Perron/Rollins · USA Hockey |
| **AI-Evidence** | MODERATE — counter vs. regroup. |
| **Offene Frage** | „Absicherung“ hier vs. A1 — Verwechslungsrisiko? |
| **human_status** | `NOT_REVIEWED` |
| **human_notes** | |
| **human_source_refs** | |

---

### HR-A3-C15 — Backchecking / Rückreaktion

| Feld | Wert |
|------|------|
| **claim_id** | A3-C15 |
| **Ort** | A3_D4 |
| **Claim** | Rückreaktion begrenzt Gefahr wenn **Gegneroptionen** sich ändern — Rückweg, Druck, Raum. |
| **Warum HR** | Fachlicher Kern D4; IIHF/USA belegbar; Nutzer bewertet indirekt „Begrenzung ja/nein“. |
| **Was prüfen** | Backchecking vs. Tracking terminologisch; DE „Rückreaktion“ ausreichend? |
| **Quellenarten** | IIHF · USA Hockey |
| **AI-Evidence** | MODERATE — Pinning Backchecking; Appert transition defense. |
| **Offene Frage** | Tracking-Begriff ergänzen oder bei Backchecking bleiben? |
| **human_status** | `NOT_REVIEWED` |
| **human_notes** | |
| **human_source_refs** | |

---

### HR-A3-C17 — Gap Control

| Feld | Wert |
|------|------|
| **claim_id** | A3-C17 |
| **Ort** | A3_D5 |
| **Claim** | Gap Control fachlich; Beobachtung: Abstand, Tempo, Raum — stabil vs. kippt; nicht pauschal „viel Abstand = sicher“. |
| **Warum HR** | EN-Fachterm im DE-Produkt; MODERATE Evidence; reputationsrelevant wenn falsch dargestellt. |
| **Was prüfen** | Gap Control im UI belassen oder nur DE-Labels? Tiefe für A3-Niveau ok? |
| **Quellenarten** | IIHF Closing the Gap · USA Hockey · Tearse |
| **AI-Evidence** | MODERATE — etablierter Coach-Begriff. |
| **Offene Frage** | Ein Satz Glossar-Link in Drill-UI sinnvoll? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** |Der fachliche Kern bleibt erhalten: Nach Puckgewinn kann ein Team die neue Situation **sofort fortsetzen** oder den Puck halten und **kontrolliert neu aufbauen**. Die aktuelle Auswahl **direkte Fortsetzung / Kontrolle / Absicherung / unklar** vermischt jedoch unterschiedliche Beobachtungsebenen. Fortsetzung und Neuaufbau beschreiben die Hauptrichtung der Aktion; Absicherung ist eine begleitende Funktion, die bei beiden Richtungen sichtbar sein kann. Cursor soll A3_D3 deshalb in zwei getrennte Beobachtungsfelder aufteilen. **Feld 1 – Sichtbare Hauptrichtung:** `Sofort fortsetzen / Kontrolliert neu aufbauen / Unklar`. Definition **Sofort fortsetzen:** „Das Team nutzt die neue Situation unmittelbar und bewegt oder passt den Puck erkennbar nach vorne.“ Definition **Kontrolliert neu aufbauen:** „Das Team nimmt Tempo aus der unmittelbaren Vorwärtsbewegung, hält den Puck und stellt neue Struktur oder Optionen her.“ **Feld 2 – Absicherung sichtbar:** `Ja / Nein / Unklar`. Definition: „Hinter oder neben dem ersten Impuls bleibt eine sichere weitere Verbindung erkennbar.“ Absicherung darf nicht mehr als dritte Alternative neben Fortsetzung und Neuaufbau geführt werden. Diese Trennung ist in Ziel, Erklärung, Observation Guide, `how_to`, Inline-Erklärungen, Mini-Feedback, Konfiguration, Auswertung und Reflection Guidance konsistent umzusetzen. Die Begriffe sind nach dem Deutsch-first-Prinzip anzupassen: **Rush vs. Stop** aus nutzerseitigen Texten entfernen; **Defense** durch **Verteidigung**, **Separation** durch **Abstandsvorteil**, **Transitionsmoment** durch **Umschaltmoment** und die sichtbaren Zonenlabels `defensive / neutral / offensive` durch **Verteidigungszone / neutrale Zone / Angriffszone** ersetzen. Interne IDs dürfen stabil bleiben. Die Gründe für **Sofort fortsetzen** sollen ausschließlich beobachtbare Merkmale enthalten: Abstandsvorteil zum direkten Gegenspieler, Verteidiger müssen sich neu ausrichten oder drehen, zahlenmäßiger Vorteil und offene Pass- oder Laufbahn. Gründe für **Kontrolliert neu aufbauen**: Verteidigung ist geordnet, Puckführer steht unter unmittelbarem Druck, Pass- oder Laufwege sind geschlossen oder das Team hält den Puck und stellt sichtbar neue Optionen her. Keine dieser Beobachtungen darf automatisch als gute oder schlechte Entscheidung bewertet werden. Formulierungen wie **„Unter welchen Bedingungen kippt es in Fortsetzung?“** sind neutraler zu formulieren, beispielsweise: **„Woran erkennst du, dass das Team sofort fortsetzt?“** Der Hover-over-Glossar ist im selben Pass um **Sofort fortsetzen** und **Kontrolliert neu aufbauen** zu ergänzen. **Kontrolliert neu aufbauen** ist mit dem in A2-C3 beschlossenen Oberbegriff **Neuaufbau** zu verknüpfen. Das Glossar soll klarstellen, dass Absicherung eine parallel beobachtbare Unterstützungsfunktion und keine Alternative zur Hauptrichtung ist. Nach Umsetzung sind A3_D2→A3_D3→A3_D4 sowie die A1-Definition von Absicherung und die A2-Definition von Neuaufbau auf Konsistenz zu prüfen. Danach kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden.  |
| **human_source_refs** |DEB „Deutschland-Eishockey Playbook“, Umschaltprinzipien nach Scheibengewinn: Puck schnell nach vorne bewegen oder passen, ungeordnete Verteidigung angreifen, Unterstützung sowie tief spielen und sichern: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf · DEB „Deutschland-Eishockey Playbook“, kontrollierter Aufbau bei verfügbarem Raum und Zeit: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf · DEB-RTK „Defensive Zone – Grundlagentraining“, schnelles Umschalten, Bahnbesetzung und Gegenangriff: https://www.deb-rtk.de/grundlagentraining/defensive-zone · DEB-RTK „Defensive Zone – Aufbautraining 1“, Kreuzaufbau, Neuordnung und zusätzliche Aufbauoptionen: https://www.deb-rtk.de/aufbautraining-1/defensive-zone · DEB-RTK „Überzahl/Unterzahl – Anschlusstraining“, Regroup als kontrollierter Neuaufbau: https://www.deb-rtk.de/anschlusstraining/ueberzahl/unterzahl · DEB Trainingstag „Offensive Zone“, unmittelbarer Angriff nach Scheibengewinn: https://www.deb-rtk.de/fileadmin/user_upload/DEB_Trainingstag_Offensive_Zone.pdf  |

---

## HUMAN_REVIEW_OPTIONAL

### HR-A3-C2 — Andere Strukturwechsel ohne Puck

| **claim_id** | A3-C2 | **human_status** | `NOT_REVIEWED` |

### HR-A3-C18 — Wer diktiert Distanz

| **claim_id** | A3-C18 | **human_status** | `NOT_REVIEWED` |

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1, C9, C12, C15, C17) |
| **OPTIONAL** | **2** (C2, C18) |

**Nächster Schritt:** Christoph prüft REQUIRED → `CONFIRMED` / `CONFIRMED_AS_RINQ_MODEL` → **`CONTENT + EVIDENCE + HUMAN APPROVED`**

# Human Review — B1

**Status:** `NOT_REVIEWED` (alle Punkte)  
**Datum:** 2026-08-24  
**AI-Evidence:** [`b1-content-review.md`](../reviews/b1-content-review.md) · [`b1-sources.md`](../sources/b1-sources.md)  
**Glossar:** [`docs/content/hockey-glossary.md`](../../content/hockey-glossary.md) § B1

**Regel:** AI setzt **niemals** `human_status` auf CONFIRMED / CONFIRMED_AS_RINQ_MODEL / REJECTED.

**Track-Status:** `CONTENT + EVIDENCE APPROVED` · Human **offen**

---

## HUMAN_REVIEW_REQUIRED

### HR-B1-C1 — Spielbare Unterstützung

| Feld | Wert |
|------|------|
| **claim_id** | B1-C1 |
| **Ort** | B1_D1 (glossary „spielbar“, observation_guide) |
| **Claim** | Support = Winkel + Timing + Position; Nähe allein reicht nicht. |
| **Warum HR** | Kern von B1; Arbeitsbegriff „spielbar“; MODERATE Evidence; Feedback an Nutzer. |
| **Was prüfen** | Ob DE-Definition für Zielgruppe trägt; Abgrenzung zu A1 Support/Absicherung. |
| **Quellenarten** | IIHF Support · Center breakout coaching |
| **AI-Evidence** | MODERATE — SRC-01, SRC-B1-01, SRC-B1-02 |
| **Offene Frage** | Glossary-Text in UI belassen oder kürzen? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Der Kern bleibt erhalten: Nähe allein erzeugt noch keine spielbare Unterstützung. Die Formulierung **„Support = Winkel + Timing + Position“** darf jedoch nicht wie eine vollständige oder universelle Formel wirken. Spielbarkeit hängt unter anderem von Position, erreichbarer Passbahn, Abstand, Körperausrichtung und dem Zeitpunkt der Unterstützung ab. Cursor soll die Kernaussage ändern zu: **„Spielbare Unterstützung entsteht, wenn ein Mitspieler rechtzeitig eine tatsächlich erreichbare und nutzbare Passmöglichkeit herstellt. Position, Passwinkel, Abstand, Körperausrichtung und Zeitpunkt können dazu beitragen; Nähe allein reicht nicht.“** Der Begriff **Support** soll in nutzerseitigen deutschen Texten primär durch **Unterstützung** ersetzt werden; `Support` bleibt als englisches Synonym im Hover-over-Glossar. Die Kurzdefinition für den Hover soll lauten: **„Spielbar: für den Puckführer über eine erkennbare Passbahn erreichbar und für eine unmittelbare Fortsetzung nutzbar.“** Eine längere Glossardefinition darf ergänzen, dass Spielbarkeit situationsabhängig ist und nicht automatisch bedeutet, dass ein Pass die richtige Entscheidung wäre. Die aktuelle Formulierung „sofort sinnvoll anspielen“ ist zu ändern, weil „sinnvoll“ bereits eine Qualitätsbewertung enthält. Besser: **„unmittelbar erreichbar anspielen“** beziehungsweise **„als konkrete Passmöglichkeit verfügbar“**. Die Auswahlwerte und Gründe in B1_D1 sind zu neutralisieren: wertende Labels wie „guter Winkel“, „gute Vororientierung“, „Winkel schlecht“, „Timing zu spät“ oder „keine Unterstützungsidee“ durch beobachtbare Formulierungen ersetzen, etwa **Passbahn offen/teilweise geschlossen/geschlossen**, **vor dem Druck verfügbar/erst unter Druck verfügbar**, **Körper zum Spielfeld geöffnet/Passannahme erschwert**, **erreichbarer/zu großer Abstand**. „Vororientierung“ darf nur über sichtbare Hinweise wie Schulterblick oder Körperausrichtung erfasst werden; eine innere Wahrnehmung darf nicht behauptet werden. Das Hover-over-Glossar soll **Spielbar**, **Anspielbar** und **Unterstützung/Support** voneinander abgrenzen: anspielbar bezeichnet eine erreichbare direkte Passmöglichkeit; spielbar ergänzt die erkennbare Möglichkeit zur unmittelbaren Fortsetzung; Unterstützung ist der Oberbegriff. Nach Umsetzung sind A1 Passoption/Anschlussoption/Absicherung und B1_D1 auf konsistente Definitionen zu prüfen. Danach kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden. |
| **human_source_refs** | DEB-RTK „Taktisches Verhalten“, Freilaufen, Anbieten, Mitspieler unterstützen und aktive Passbereitschaft: https://www.deb-rtk.de/basisschulung/taktisches-verhalten · DEB-RTK „Defensive Zone – Aufbautraining 2“, nahe Unterstützung, schnelles Anbieten und wiederholtes Herstellen neuer Optionen: https://www.deb-rtk.de/aufbautraining-2/defensive-zone · DEB „Deutschland-Eishockey Playbook“, aktive Anspielbarkeit, Unterstützung und mehrere Optionen: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf · DEB-RTK „Zweikampf offensiv – Aufbautraining 1“, Schulterblick und Anspielstationen lesen: https://www.deb-rtk.de/aufbautraining-1/zweikampf-offensiv |

---

### HR-B1-C2 — Dreiecksstabilität

| Feld | Wert |
|------|------|
| **claim_id** | B1-C2 |
| **Ort** | B1_D2 |
| **Claim** | Verbindungen/Anspielbarkeit/Stabilität — kein Geometrie-Quiz. |
| **Warum HR** | Baut auf A1 Dreieck; Center als Stabilisator — mehrere Coach-Schulen. |
| **Was prüfen** | Ob „Dreiecksstabilität“ als Titel irreführend ist; Metapher ok für B1? |
| **Quellenarten** | Weiss / Belfry / Coaches Site (wie A1-C6) |
| **AI-Evidence** | MODERATE — SRC-02, SRC-05, SRC-06 |
| **Offene Frage** | Titel „Verbindungen halten“ statt „Dreiecksstabilität“? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Der Drill bleibt als Vertiefung der in A1 eingeführten kleinen Unterstützungsstrukturen erhalten, wird aber von **„Dreiecksstabilität“** zu **„Verbindungen erhalten“** umbenannt. Der bisherige Titel ist irreführend, weil der Drill ausdrücklich keine geometrische Dreiecksprüfung durchführen soll und überwiegend Anspielbarkeit, Verbindungen und deren Veränderung beobachtet. Cursor soll die Leitfrage vereinheitlichen zu: **„Wie verändern sich die spielbaren Verbindungen rund um den Center?“** Empfohlene neutrale Zustände: **Neue Verbindung entsteht / Verbindungen bleiben erhalten / Verbindung wird eingeschränkt / Keine klare Verbindung erkennbar**. Die aktuellen Zustände „stabilisiert aktiv“, „reagiert zu spät“ und „verliert Verbindung“ enthalten bereits Ursachen- oder Qualitätsurteile und sind entsprechend zu ersetzen. Die Beobachtung soll sich auf sichtbare Merkmale beschränken: Passbahn öffnet oder schließt sich, Abstand verändert sich, eine Rückoption bleibt oder entfällt, der Center bewegt sich in oder aus einer spielbaren Verbindung. Fragen nach der „früheren Korrektur“, der Bewegung, die „gereicht hätte“, oder danach, „warum“ die Struktur verloren ging, sind zu entfernen oder neutral umzuformulieren, weil sie Coaching-Alternativen beziehungsweise nicht sicher beobachtbare Ursachen verlangen. Stattdessen fragen: **„Welche Verbindung war zuerst nicht mehr sichtbar?“**, **„Was hat sich an Abstand, Passbahn oder Rückoption verändert?“** und **„Welche Bewegung des Centers war unmittelbar zu sehen?“** Die in A1-C6 beschlossene Dreiecksdefinition bleibt gültig: Drei Spieler bilden eine ungefähr dreieckige Unterstützungsstruktur mit mehreren spielbaren Verbindungen; perfekte oder statische Geometrie ist nicht erforderlich. B1 vertieft nicht die Form, sondern die Entwicklung dieser Verbindungen unter Bewegung. Das Hover-over-Glossar soll **Verbindung erhalten** beziehungsweise **Verbindungsstruktur** ergänzen und auf den A1-Eintrag **Dreieck** verweisen. Nach Umsetzung sind A1_D5 und B1_D2 gemeinsam auf Progression und Terminologie zu prüfen. Danach kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden.|
| **human_source_refs** |DEB Rahmenrichtlinien für die Traineraus-, Fort- und Weiterbildung 2020, S. 23 („Angriffsdreieck“) · DEB „Deutschland-Eishockey Playbook“, Angriffsdreiecke, aktive Anspielbarkeit, Absicherung und mehrere Optionen: https://www.deb-rtk.de/fileadmin/user_upload/Deutschland-Eishockey_Playbook_Version_23_11_23.pdf · DEB-RTK „Wettspiel/Playbook in den Ausbildungsstufen“, Anspielstationen und Aufbauoptionen: https://www.deb-rtk.de/einfuehrung/wettspiel-in-den-ausbildungsstufen · DEB-RTK „Taktisches Verhalten“, Freilaufen, Anbieten und gegenseitige Unterstützung: https://www.deb-rtk.de/basisschulung/taktisches-verhalten |

---

### HR-B1-C3 — Center-Aufgaben-Taxonomie

| Feld | Wert |
|------|------|
| **claim_id** | B1-C3 |
| **Ort** | B1_D3 `state_options` |
| **Claim** | Support geben · Absichern · Anschluss herstellen · Räume öffnen (+ unklar) |
| **Warum HR** | `RINQ_TAXONOMY`; Überlapp zu A1-Funktionen; Reputationsrisiko wenn als Standard wirkt. |
| **Was prüfen** | 4 Labels verständlich? Redundanz mit A1 Sichern/Verbinden/Mit nach vorne? |
| **Quellenarten** | Coach-Praxis · Glossar-Abgleich |
| **AI-Evidence** | MODERATE partial — Konzepte ja, Set = RinQ |
| **Offene Frage** | Explizit als RinQ-Raster in UI kennzeichnen? |
| **human_status** | `NOT_REVIEWED` |
| **human_notes** | |
| **human_source_refs** | |

---

### HR-B1-C4 — Outlet

| Feld | Wert |
|------|------|
| **claim_id** | B1-C4 |
| **Ort** | B1_D4 · learningGoals |
| **Claim** | Center als Outlet/Anschlussoption — verbindet Situationen, oft erste stabile Verbindung nach Druck. |
| **Warum HR** | Fachbegriff Kern B1; aus A1 verschoben; Premium-relevant. |
| **Was prüfen** | Outlet vs. Anschlussoption Verwechslung; Breakout-Framing ohne Systemanalyse ok? |
| **Quellenarten** | Better Hockey · Line1 · Revak |
| **AI-Evidence** | MODERATE — Outlet etabliert |
| **Offene Frage** | Outlet nur EN-Label oder DE-Paraphrase („Ausspielstation“)? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** |Der englische Begriff **Outlet** wird nach dem Deutsch-first-Prinzip in der Nutzeroberfläche durch **Anspielstation** ersetzt. Der empfohlene Drilltitel lautet **„Center als Anspielstation und Anschlussoption“**. Die beiden Begriffe sind klar abzugrenzen: **Anspielstation** bezeichnet einen Spieler, der als unmittelbares, erreichbares Passziel verfügbar ist; **Anschlussoption** bezeichnet eine mögliche folgende Verbindung und muss nicht der nächste Passempfänger sein. Die Formulierung „Outlet heißt oft: erste stabile Verbindung nach Druck oder Chaos“ ist zu präzisieren zu: **„Der Center kann nach Druck oder einer unübersichtlichen Situation eine unmittelbar erreichbare Anspielstation herstellen und weitere Anschlussmöglichkeiten offenhalten.“** Dies ist als mögliche Centerfunktion und nicht als allgemeingültige Rollenregel zu formulieren. Alle sichtbaren Vorkommen von Outlet und Outlet-Linie in B1_D4 sind durch **Anspielstation**, **Passlinie** oder **erreichbare Verbindung** zu ersetzen. `Outlet` kann in internen IDs bestehen bleiben. Das Hover-over-Glossar soll **Anspielstation** als primären Begriff führen und `Outlet` als englisches Synonym dokumentieren. Definition: **„Ein Spieler, der für den Puckführer als unmittelbares und erreichbares Passziel verfügbar ist.“** Zusätzlich auf **Anschlussoption** verweisen und den Unterschied erläutern. Der Drill darf Breakout- beziehungsweise Aufbausituationen als Beobachtungskontext verwenden, aber keine festen Breakout-Systeme lehren oder behaupten, der Center müsse immer die erste Anspielstation sein. Wertende oder hypothetische Fragen wie „Was hätte frühere Verfügbarkeit verändert?“ sind durch beobachtende Fragen zu ersetzen, etwa **„Wann wurde die Anspielstation erstmals sichtbar?“** und **„Welche Passbahn oder Verbindung wurde dadurch erkennbar?“** Ursachenlabels wie „Center antizipiert früh“ sind nur zu verwenden, wenn sie als sichtbare Vorbereitung beschrieben werden; ansonsten durch beobachtbare Positionierung, Bewegung oder Körperausrichtung ersetzen. Nach Umsetzung sind A1 Anschlussoption, B1_D1 Anspielbarkeit und B1_D4 Anspielstation gemeinsam auf begriffliche Konsistenz zu prüfen. Danach kann der Claim als `CONFIRMED_AS_RINQ_MODEL` klassifiziert werden.  |
| **human_source_refs** | DEB-RTK „Taktisches Verhalten“, Freilaufen, Anbieten und aktiv den Puck fordern: https://www.deb-rtk.de/basisschulung/taktisches-verhalten · DEB-RTK „Wettspiel/Playbook in den Ausbildungsstufen“, Anspielstationen schaffen und Aufbauoptionen: https://www.deb-rtk.de/einfuehrung/wettspiel-in-den-ausbildungsstufen · DEB-RTK „Neutrale Zone – Aufbautraining 1“, zusätzliche Anspielstation durch Einbindung eines Verteidigers: https://www.deb-rtk.de/aufbautraining-1/neutrale-zone · DEB-RTK „Defensive Zone – Aufbautraining 2“, schnell anbieten, nahe Unterstützung und wiederholte Anspielbarkeit: https://www.deb-rtk.de/aufbautraining-2/defensive-zone · IIHF „1vs1 plus outlets“, Outlet als englischer Fachbegriff für einen unterstützenden Passspieler: https://www.iihf.com/en/coaching/18787/1vs1-plus-outlets |

---

### HR-B1-C5 — Timing / frühe Wahrnehmung

| Feld | Wert |
|------|------|
| **claim_id** | B1-C5 |
| **Ort** | B1_D5 |
| **Claim** | Frühe Wahrnehmung und Vorbereitung — Antizipation ≠ Hellsehen; Boundary zu B2. |
| **Warum HR** | Grauzone Wahrnehmung/Urteil; Timing-Labels können wie Bewertung wirken. |
| **Was prüfen** | Ob „früh/rechtzeitig/verzögert“ observation-first bleibt; B2-Abgrenzung klar? |
| **Quellenarten** | IHS Center timing · Weiss · IIHF |
| **AI-Evidence** | MODERATE |
| **Offene Frage** | quality_key „Timing der Aufgabe“ in D3 — Verwechslungsrisiko mit D5? |
| **human_status** | `NEEDS_CHANGE` |
| **human_notes** | Der fachliche Kern bleibt erhalten: Antizipation bedeutet nicht Hellsehen, sondern beruht auf Wahrnehmung relevanter Hinweise, Erfahrung und sichtbarer Vorbereitung auf eine mögliche nächste Situation. Im Drill darf jedoch nicht behauptet werden, der Center habe etwas „früh erkannt“ oder „früh wahrgenommen“, weil innere Wahrnehmung aus einer Szene nicht direkt beobachtbar ist. Der nutzerseitige Schwerpunkt wird deshalb von **„Timing & frühe Wahrnehmung“** zu **„Timing & sichtbare Vorbereitung“** geändert. Empfohlene Leitfrage: **„Wann wird die Vorbereitung des Centers im Verhältnis zu Druck und Passfenster sichtbar?“** Empfohlene Zustände: **Vor dem Druck vorbereitet / Im nutzbaren Zeitfenster verfügbar / Erst unter Druck verfügbar / Nach Schließen des Zeitfensters / Unklar**. Definitionen: **Vor dem Druck vorbereitet:** Position, Bewegung oder Körperausrichtung sind bereits vor unmittelbarem Gegnerdruck erkennbar auf eine mögliche Fortsetzung ausgerichtet. **Im nutzbaren Zeitfenster verfügbar:** Der Center wird verfügbar, solange eine erreichbare Pass- oder Anschlussmöglichkeit besteht. **Erst unter Druck verfügbar:** Die Unterstützung wird erst sichtbar, nachdem der Puckführer bereits unmittelbar unter Druck steht. **Nach Schließen des Zeitfensters:** Die Vorbereitung wird erst sichtbar, nachdem die zuvor erkennbare Pass- oder Anschlussmöglichkeit nicht mehr verfügbar ist. Die aktuellen Kategorien „früh vorbereitet / rechtzeitig / leicht verzögert / deutlich verzögert“ sind zu ersetzen, weil „rechtzeitig“ und „verzögert“ ohne klaren Bezugspunkt wie Qualitätsnoten wirken und `Unklar` trotz entsprechender Didaktik fehlt. `Unklar` ist als vollwertige Auswahl zu ergänzen. Die `quality_options` dürfen keine innere Wahrnehmung behaupten; „früh wahrgenommen“ wird durch sichtbare Merkmale wie **Schulterblick sichtbar / Körper vororientiert / Bewegung vor dem Druck / erst auf Druck reagiert / unklar** ersetzt. Aussagen wie „Druck vermieden“, „Spiel beschleunigt“ oder „Mitspieler isoliert“ dürfen nur als sichtbare Folge und nicht als bewiesene Ursache der Centerbewegung formuliert werden. Fragen wie „Wann hätte die Vorbereitung früher lesbar sein müssen?“ sind zu neutralisieren zu **„Wann wurde die Vorbereitung erstmals sichtbar?“** und **„War zu diesem Zeitpunkt noch eine erreichbare Verbindung vorhanden?“** Das Hover-over-Glossar soll **Antizipation** definieren als: **„Auf Grundlage wahrgenommener Hinweise und Erfahrung eine mögliche nächste Spielsituation vorwegnehmen und sich darauf vorbereiten.“** Zusätzlich klarstellen, dass RinQ Antizipation nicht direkt aus Gedanken ableitet, sondern nur sichtbare Vorbereitung beobachtet. B1 bleibt bei Timing und Rollenverfügbarkeit; B2 analysiert anschließend Druckbedingungen und Entscheidungsentstehung. Nach Umsetzung sind B1_D3, B1_D4, B1_D5 und der Übergang zu B2 auf diese Grenze zu prüfen. Danach kann der Claim als `CONFIRMED` klassifiziert werden, da Antizipation fachlich durch DEB-Material gestützt ist und die überarbeitete Erfassung auf beobachtbare Vorbereitung begrenzt wird. |
| **human_source_refs** | **human_source_refs** | DEB-RTK „Spielerpersönlichkeit entwickeln – Anschlusstraining“, Antizipation als Vorwegnahme der nächsten Sekunden auf Grundlage von Spielerfahrung: https://www.deb-rtk.de/anschlusstraining/spielerpersoenlichkeit-entwickeln · DEB-RTK „Motorik/Athletik – Aufbautraining 1“, Antizipation in realen Spielsituationen und situationsgebundenes taktisches Wissen: https://www.deb-rtk.de/aufbautraining-1/motorik/athletik · DEB-RTK „Motorik/Athletik – Aufbautraining 2“, Blickstrategien und Antizipation: https://www.deb-rtk.de/aufbautraining-2/motorik/athletik · DEB-RTK „Taktisches Verhalten“, Schulterblick, Kommunikation und Anbieten: https://www.deb-rtk.de/basisschulung/taktisches-verhalten · DEB-RTK „Zweikampf offensiv – Aufbautraining 1“, Schulterblick und Anspielstationen lesen: https://www.deb-rtk.de/aufbautraining-1/zweikampf-offensiv ||

---

## HUMAN_REVIEW_OPTIONAL

### HR-B1-C6 — Battle ↔ Outlet Wechsel

| **claim_id** | B1-C6 | **human_status** | `NOT_REVIEWED` |
| **Hinweis** | Sprache bereits entschärft („Gute“ entfernt) |

### HR-B1-C7 — Position ≠ Aufgabe

| **claim_id** | B1-C7 | **human_status** | `NOT_REVIEWED` |

---

## Zusammenfassung

| Priorität | Anzahl |
|-----------|--------|
| **REQUIRED** | **5** (C1–C5) |
| **OPTIONAL** | **2** (C6, C7) |

**Nächster Schritt:** REQUIRED abhaken → `CONTENT + EVIDENCE + HUMAN APPROVED`

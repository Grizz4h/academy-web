# RinQ Tank — Hockey-Glossar (A1–E4)

**Status:** Draft · A1–D3 · D4 Sidequest · E1–**E4** (2026-08-24)  
**Gilt für:** Curriculum A1–E4 · QA · KI-Feedback  
**Quellen:** `docs/qa/sources/` (… `e1`–`e4`)

Dieses Glossar trennt **etablierte Hockey-/Coaching-Sprache** von **RinQ-Beobachtungslabels**. Es ist kein IIHF-Regelwerk und kein vollständiges Coach-Lexikon.

---

## Taxonomie (RinQ)

### Pass / Puck führen / Tief spielen / Neuaufbau

| Feld | Wert |
|------|------|
| **Begriff** | Pass / Puck führen / Tief spielen / Neuaufbau (Vierer-Taxonomie) |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Beobachtungsschicht in A2_D3: Welche **Aktion** nutzt der Puckführer aus sichtbaren Optionen — ohne Qualitätsurteil. Primäre UI-Begriffe deutsch. |
| **Etablierte Terminologie** | EN-Nähe: **Pass**, **Carry**, **Dump**, **Reset**/Regroup. DEB: Neuaufbau / Regroup in der NZ. |
| **Abgrenzung** | Die **Vierer-Liste als geschlossenes Set** ist RinQ. Interne IDs `pass`/`carry`/`dump`/`reset` bleiben. Regroup ⊂ Neuaufbau (NZ), nicht identisch. |
| **source_refs** | SRC-08, SRC-01, SRC-10, SRC-11 · HR A2-C3 (DEB) |
| **notes** | Siehe Pass, Puck führen, Tief spielen, Neuaufbau, Regroup. |

---

## Beziehungen & Support (A1)

### Support

| Feld | Wert |
|------|------|
| **Begriff** | Support |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Mitspieler ohne Puck positionieren sich so, dass der Puckführer **Anschlussmöglichkeiten** hat — relational, nicht nur „irgendwo frei stehen“ (A1_D4). |
| **Etablierte Terminologie** | EN: *Support*, *puck support*; IIHF: Spieler ohne Puck als *passing option* in the Attacke. DE: *Unterstützung*, *Support* (SIHF/mobilesport). |
| **Abgrenzung** | Support ≠ Outlet (Outlet → B1). Support ist relational, nicht nur Positionslabel. |
| **source_refs** | SRC-01, SRC-03, SRC-04 |
| **notes** | Im Curriculum oft deutsch paraphrasiert; EN-Label in Drill-Config teils implizit. |

### Passoption

| Feld | Wert |
|------|------|
| **Begriff** | Passoption / Direkte Passoption |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Center (oder Mitspieler) ist **unmittelbar anspielbar** und kann die aktuelle Aktion direkt fortsetzen (A1_D4 `direct_option`). |
| **Etablierte Terminologie** | DE: *Passoption* (SIHF Good Practice F3). EN: *passing option*, *direct option*. |
| **Abgrenzung** | Direkte Passoption ≠ Anschlussoption (sequenziell). |
| **source_refs** | SRC-03, SRC-01, SRC-02 |
| **notes** | Etablierter DE-Begriff in Verbandsmaterial. |

### Anschlussoption

| Feld | Wert |
|------|------|
| **Begriff** | Anschlussoption |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Center ist **nicht zwingend der nächste Passempfänger**, macht aber eine **unmittelbar folgende spielbare Verbindung** möglich (A1_D4 `next_option`). Eine Beziehung kann mehrere Funktionen gleichzeitig erfüllen — wähle die auffälligste. |
| **Etablierte Terminologie** | Kein fester DEB-Standardterm. Konzeptuell nah: *next option*, sequenzielle Fortsetzung. |
| **Abgrenzung** | Nicht umbenennen zu „Folgepass“ / „nächste Option“ — es geht um mögliche Verbindung, nicht zwingend den nächsten Pass. |
| **source_refs** | DEB Passoptionen / Absicherung (HR A1-C5) |
| **notes** | Human Review A1-C5 · Umsetzung 2026-08-24 |

### Absicherung

| Feld | Wert |
|------|------|
| **Begriff** | Absicherung |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Hinter oder neben der Aktion entsteht **Sicherheit** — eine Option bleibt, falls die aktuelle Aktion scheitert (A1_D3/D4 `coverage` / securing). |
| **Etablierte Terminologie** | EN: *back-side support*, *back-side passing option*. DEB: Absicherung in Playbook-Kontexten. |
| **Abgrenzung** | RinQ-Relational-Label ohne Qualitätsurteil. ≠ defensive System-Absicherung als Pflichtregel. |
| **source_refs** | SRC-02, SRC-01 · HR A1-C5 |
| **notes** | Eng verwandt mit Funktion **Absichern**. |

### Absichern

| Feld | Wert |
|------|------|
| **Begriff** | Absichern (offensiv) |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Center-Funktion (A1_D3 / B1_D3): Hinter oder neben der **eigenen** Aktion entsteht **Sicherheit** — eine sichere weitere Verbindung bleibt bestehen. |
| **Etablierte Terminologie** | EN: *back-side support*, *safety option*. Früheres UI-Label: **Sichern**. |
| **Abgrenzung** | **Nicht** B3-defensiv (Slot schützen, Passwege schließen, Gegenspieler übernehmen). **Nicht** B2 „Sichern“ (Puckkontrolle). Keine feste Regel Hinter dem Spiel = Absichern. |
| **source_refs** | SRC-01, SRC-02 · HR A1-C4 |
| **notes** | Triade/A1+B1: Absichern / Verbinden / Angriff unterstützen |

### Verbinden

| Feld | Wert |
|------|------|
| **Begriff** | Verbinden |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Center-Funktion (A1_D3 / B1_D3): Puckführer und **nächste Option / Mitspieler / Raum** werden **spielbar verbunden**. |
| **Etablierte Terminologie** | EN: *connecting*, *passing lane*, *mid-lane support*. B1 früher: „Anschluss herstellen“. |
| **Abgrenzung** | RinQ-Leselinse, keine geometrische Pflicht. |
| **source_refs** | SRC-01, SRC-02 · HR A1-C4 |
| **notes** | A1→B1 konsistent |

### Angriff unterstützen

| Feld | Wert |
|------|------|
| **Begriff** | Angriff unterstützen |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Center-Funktion (A1_D3 / B1_D3): Durch Position oder Bewegung **Raum**, **vorwärtsgerichtete Bahn** oder eine **weitere offensive Aktion** ermöglichen. |
| **Etablierte Terminologie** | DEB: „Angriff unterstützen“; EN: *offensive support*. B1 früher: „Räume öffnen“. |
| **Abgrenzung** | Nicht „Center muss immer nach vorne“. |
| **source_refs** | DEB Rahmenrichtlinien · HR A1-C4 |
| **notes** | A1→B1 konsistent |

### Hinter dem Spiel / Auf Verbindungshöhe / Vor dem Spiel

| Feld | Wert |
|------|------|
| **Begriff** | Hinter dem Spiel · Auf Verbindungshöhe · Vor dem Spiel |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Relative Höhe zum **aktuellen Spiel** (A1_D2+): rückwärtig / verbindend / vorwärtsgerichtet — keine starren Eisstreifen. Unklar bleibt erlaubt. |
| **Etablierte Terminologie** | Frühere/englische RinQ-Labels: Low / Middle / High. DEB nutzt hoch/tief räumlich, aber nicht diese feste Dreiteilung. |
| **Abgrenzung** | Nur A1-Beobachtungstaxonomie. **Nicht** Low Cycle / High Slot / Low-to-High automatisch ersetzen. |
| **source_refs** | HR A1-C3 |
| **notes** | Interne IDs `low`/`middle`/`high` bleiben |

---

## Aktionen (A2)

### Pass

| Feld | Wert |
|------|------|
| **Begriff** | Pass |
| **term_type** | `STANDARD_HOCKEY_TERM` |
| **RinQ-Definition** | Der Puck wird **gezielt zu einem Mitspieler** gespielt (A2_D3) — Beobachtung ohne Passqualität. |
| **Etablierte Terminologie** | Universal; Analytics: *Controlled Pass*. |
| **Abgrenzung** | Pass ≠ beste Entscheidung. Klar vorgesehener Empfänger im tiefen Raum → Pass (nicht Tief spielen). |
| **source_refs** | SRC-08, SRC-01 · HR A2-C3 |
| **notes** | — |

### Puck führen

| Feld | Wert |
|------|------|
| **Begriff** | Puck führen |
| **term_type** | `STANDARD_HOCKEY_TERM` (UI) / EN *Carry* |
| **RinQ-Definition** | Der Spieler **behält den Puck** und bewegt ihn **selbst kontrolliert weiter** (A2_D3 `carry`). |
| **Etablierte Terminologie** | EN: *carry the puck*, *Controlled Carry*; DE: Puckführung / Scheibenführung. |
| **Abgrenzung** | Beobachtungslabel, kein Werturteil. Interne ID `carry`. |
| **source_refs** | SRC-08 · HR A2-C3 |
| **notes** | Primärer UI-Begriff; Carry = Synonym |

### Tief spielen

| Feld | Wert |
|------|------|
| **Begriff** | Tief spielen |
| **term_type** | `COACHING_TERM` (UI) / EN *Dump* |
| **RinQ-Definition** | Puck wird **bewusst tief oder in freien Raum** gespielt, **ohne** unmittelbar vorgesehenen Passempfänger (A2_D3 `dump`). |
| **Etablierte Terminologie** | EN: *dump*, *dump-in*, *chip*. ≠ „Befreiung“ (spezielle Drucklösung). |
| **Abgrenzung** | Mit klarem Empfänger → Pass. Interne ID `dump`. |
| **source_refs** | SRC-08 · HR A2-C3 |
| **notes** | Dump = englische Nähe |

### Neuaufbau

| Feld | Wert |
|------|------|
| **Begriff** | Neuaufbau |
| **term_type** | `RINQ_OPERATIONAL_LABEL` (UI) / EN *Reset* |
| **RinQ-Definition** | Der unmittelbare Vorwärtsversuch wird **bewusst zurückgenommen**, damit das Team unter Kontrolle **neue Struktur und Optionen** herstellt (A2_D3 `reset`). |
| **Etablierte Terminologie** | DEB: Neuaufbau / Regroup (NZ). EN-Nähe: *Reset*, *Regroup*, *Reverse*. |
| **Abgrenzung** | Nicht jeder Rückpass = Neuaufbau. Bei Pass+Neuaufbau-Überlappung: Neuaufbau, wenn Zurücknehmen/Neuordnen die auffälligste Funktion ist. **Regroup** = spezifische Form (bes. NZ). Interne ID `reset`. |
| **source_refs** | DEB-RTK Glossar · HR A2-C3 |
| **notes** | Reset = englische Nähe, nicht primäre UI |

### Regroup

| Feld | Wert |
|------|------|
| **Begriff** | Regroup |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Spezifische Form des **Neuaufbaus**, insbesondere in der **neutralen Zone**. |
| **Etablierte Terminologie** | DEB-Glossar: Neuaufbau in der NZ. |
| **Abgrenzung** | Regroup ⊂ Neuaufbau; nicht jeder Neuaufbau ist Regroup. |
| **source_refs** | DEB-RTK Glossar · HR A2-C3 |
| **notes** | — |

---

## Struktur (A1, Kurz)

### Dreieck

| Feld | Wert |
|------|------|
| **Begriff** | Dreieck / Angriffsdreieck |
| **term_type** | `COACHING_TERM` + `RINQ_MODEL` (Auswahlformen) |
| **RinQ-Definition** | Drei Spieler bilden durch ihre Positionen eine **ungefähr dreieckige Unterstützungsstruktur** mit mehreren spielbaren Verbindungen — **nicht** perfekte/statische Geometrie; **nicht** jede verbundene Dreiergruppe (A1_D5). |
| **Etablierte Terminologie** | DEB: Angriffsdreieck; EN: *Attack Triangle*. |
| **Abgrenzung** | Mehrere Anschlussoptionen ≠ Dreieck (Verbindungen ohne erkennbare dreieckige Struktur). Absicherungsstruktur = zusätzliche sichere Verbindung hinter/neben der Aktion. |
| **source_refs** | DEB Playbook · HR A1-C6 |
| **notes** | Umsetzung 2026-08-24 |

---

## Umschalten & Tempo (A3)

### Umschalten

| Feld | Wert |
|------|------|
| **Begriff** | Umschalten |
| **term_type** | `COACHING_CONVENTION` + `RINQ_MODEL` |
| **RinQ-Definition** | Wechsel zwischen **offensiven und defensiven Aufgaben**, häufig ausgelöst durch Puckgewinn oder Puckverlust. |
| **Etablierte Terminologie** | EN: *transition*. DEB: Umschalten von Abwehr auf Angriff / nach Puckverlust. |
| **Abgrenzung** | Nicht jede Strukturveränderung = Besitzwechsel. Besitzwechsel ≠ automatisch gutes/schlechtes Umschalten. |
| **source_refs** | DEB-RTK · HR A2-C7 |
| **notes** | Primärer DE-UI-Begriff; Transition = Synonym |

### Umschaltmoment

| Feld | Wert |
|------|------|
| **Begriff** | Umschaltmoment |
| **term_type** | `COACHING_CONVENTION` + `RINQ_MODEL` |
| **RinQ-Definition** | Beobachtbarer Moment, in dem sich die Spielsituation verändert und Spieler Aufgaben/Bewegungsrichtungen neu ausrichten (A3_D1). |
| **Etablierte Terminologie** | Früher: Transitionsmoment. |
| **Abgrenzung** | A2: „Ein Wechsel des Puckbesitzes ist häufig ein zentraler Auslöser für strukturelle Veränderungen.“ — noch ohne Bewertung. |
| **source_refs** | HR A2-C7 / A3 boundary |
| **notes** | sceneSlug `Transition-Moment` intern ok |

### Sofort fortsetzen / Kontrolliert neu aufbauen

| Feld | Wert |
|------|------|
| **Begriff** | Sofort fortsetzen · Kontrolliert neu aufbauen |
| **term_type** | `RINQ_OPERATIONAL_LABEL` + `COACHING_CONVENTION` |
| **RinQ-Definition** | A3_D3 Feld 1 – sichtbare Hauptrichtung: Sofort fortsetzen = unmittelbare Vorwärtsbewegung/Pass; Kontrolliert neu aufbauen = Tempo nehmen, Puck halten, neue Struktur/Optionen (Oberbegriff **Neuaufbau** aus A2). |
| **Etablierte Terminologie** | EN-Nähe: *counter-attack* / *fast break* vs. *regroup* / *controlled attack*. Nutzerseitig **kein** „Rush vs. Stop“. |
| **Abgrenzung** | **Absicherung sichtbar** (Ja/Nein/Unklar) ist paralleles Feld 2 — keine dritte Alternative zur Hauptrichtung. |
| **source_refs** | DEB Playbook · HR A3-C12 (Notizen lagen unter C17) |
| **notes** | Umsetzung 2026-08-24 |

### Absicherung nach Puckgewinn (A3)

| Feld | Wert |
|------|------|
| **Begriff** | Absicherung (nach Puckgewinn) |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Hinter oder neben dem ersten Impuls bleibt eine sichere weitere Verbindung erkennbar — parallel zu Sofort fortsetzen / Neuaufbau. |
| **Abgrenzung** | Ableitung von A1-Absichern; hier speziell in den ersten Sekunden des Umschaltens. ≠ Hauptrichtung. |
| **source_refs** | HR A3-C9 / A3-C12 |
| **notes** | — |

### Backchecking / Rückreaktion

| Feld | Wert |
|------|------|
| **Begriff** | Backchecking · Rückreaktion |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | A3_D4: Wie wird neue Gefahr begrenzt? Rückweg, Druck, Raum schließen — **Wirkung** = ändern sich Gegneroptionen? |
| **Etablierte Terminologie** | EN: *backchecking*, *tracking* (breiter); IIHF: *Pinning Backchecking*; USA Hockey: backcheck habits in transition. |
| **Abgrenzung** | Beobachtung, kein Einsatz-/Tempo-Urteil. Nicht volle Defensivsysteme (ignore-Liste). |
| **source_refs** | SRC-A3-01, SRC-A3-02 |
| **notes** | A3-C15; *Tracking* ist in mancher Lit. übergeordnet — RinQ nutzt Backchecking als Fachinhalt. |

### Gap Control

| Feld | Wert |
|------|------|
| **Begriff** | Gap Control · Abstand und Raumkontrolle |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | A3_D5: Abstand Verteidiger–Angreifer, Tempo matchen/reduzieren, gefährlichen Raum schließen — **bevor** Rush/Chance dominiert. |
| **Etablierte Terminologie** | EN: *gap control*, *closing the gap*; IIHF Level I: *Closing the Gap*; USA Hockey: gaps + angling in transition. |
| **Abgrenzung** | Curriculum führt EN-Fachbegriff ein, trainiert DE-Beobachtungssprache. Kein „tight gap immer besser“ (A3_D5 ignore). |
| **source_refs** | SRC-A3-01, SRC-A3-02, SRC-A3-03 |
| **notes** | A3-C17; Human Review REQUIRED. |

### Situative Funktionen nach Puckgewinn (A3_D2)

| Feld | Wert |
|------|------|
| **Begriff** | Puckführer · Erste Passoption · Tiefenläufer · Absicherung |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Situative Funktionen in den ersten Sekunden nach Puckgewinn — keine festen Spielerpositionen; Wechsel innerhalb weniger Sekunden möglich. |
| **Etablierte Terminologie** | DEB Trainingstag Rollen / Playbook Umschaltprinzipien — keine 1:1-Pflichttaxonomie. |
| **Abgrenzung** | Früher: Beschleuniger/Tiefengeber/Unterstützer. Unterstützer entfällt als eigene Kategorie (Oberbegriff). Absicherung nach Puckgewinn ≠ A1-Absichern nur im Timing-Kontext. |
| **source_refs** | HR A3-C9 |
| **notes** | Umsetzung 2026-08-24 |

---

## Centerrolle vertiefen (B1)

### Spielbare Unterstützung / Unterstützung unter dem Puck

| Feld | Wert |
|------|------|
| **Begriff** | Spielbare Unterstützung · spielbar · anspielbar |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Spielbare Unterstützung entsteht, wenn ein Mitspieler rechtzeitig eine tatsächlich erreichbare und nutzbare Passmöglichkeit herstellt. **Spielbar:** für den Puckführer über eine erkennbare Passbahn erreichbar und für eine unmittelbare Fortsetzung nutzbar. Nähe allein reicht nicht. |
| **Etablierte Terminologie** | DE: Unterstützung; EN: *Support* (Synonym im Hover). |
| **Abgrenzung** | Anspielbar = erreichbare direkte Passmöglichkeit; spielbar ergänzt Fortsetzungsmöglichkeit. Keine Formel „Winkel+Timing+Position“ als Universalgesetz. Nicht = „gute Unterstützung“. |
| **source_refs** | HR B1-C1 |
| **notes** | Umsetzung 2026-08-24 |

### Anspielstation (Outlet)

| Feld | Wert |
|------|------|
| **Begriff** | Anspielstation |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Ein Spieler, der für den Puckführer als unmittelbares und erreichbares Passziel verfügbar ist (B1_D4). |
| **Etablierte Terminologie** | EN: *Outlet* (Synonym). DEB: Anspielstation. |
| **Abgrenzung** | ≠ Anschlussoption (folgende Verbindung, nicht zwingend nächster Empfänger). Keine Breakout-Systemlehre; Center muss nicht immer die erste Anspielstation sein. |
| **source_refs** | HR B1-C4 |
| **notes** | UI: Anspielstation; interne IDs dürfen Outlet behalten |

### Center-Aufgaben (B1_D3) — offensiv

| Feld | Wert |
|------|------|
| **Begriff** | Anspielstation anbieten · Absichern · Verbinden · Angriff unterstützen |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Offensive Unterstützungsfunktionen bei **eigenem Puckbesitz** (B1_D3). Situative RinQ-Labels, keine DEB-Pflichttaxonomie. |
| **Etablierte Terminologie** | Baut auf A1-Triade + direkter Passoption auf. Mapping: Support geben→Anspielstation anbieten; Anschluss herstellen→Verbinden; Räume öffnen→Angriff unterstützen. |
| **Abgrenzung** | Defensive Centerfunktionen (Passwege schließen, Slot, Gegenspieler) → **B3_D3**. |
| **source_refs** | SRC-01, SRC-B1-03 |
| **notes** | Gespeicherte Samples können noch alte Labels enthalten; UI-Strings neu. |

### Anspielstation anbieten

| Feld | Wert |
|------|------|
| **Begriff** | Anspielstation anbieten |
| **term_type** | `RINQ_OPERATIONAL_LABEL` + Coaching-Nähe |
| **RinQ-Definition** | Der Center wird für den Puckführer als **unmittelbares und erreichbares Passziel** verfügbar (B1_D3). Vertiefung der direkten Passoption aus A1. |
| **Etablierte Terminologie** | DEB: Anspielstation; EN: *outlet* / *passing option*. Früher B1: „Support geben“. |
| **Abgrenzung** | ≠ Anschlussoption (folgende Verbindung, nicht zwingend nächster Empfänger). |
| **source_refs** | DEB-RTK · HR B1-C4 Kontext |
| **notes** | — |

---

## Defensive Center-Unterstützung (B3)

### Zentrum schützen

| Feld | Wert |
|------|------|
| **Begriff** | Zentrum schützen |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Center positioniert sich so, dass ein zentraler gefährlicher Raum / Slot schwerer bespielbar wird (B3_D3, gegnerischer Puckbesitz). |
| **Etablierte Terminologie** | Slot protect / middle lane denial (Coaching-Konvention). |
| **Abgrenzung** | ≠ B1-offensives Absichern. |
| **source_refs** | — (RinQ + Coaching-Konvention) |
| **notes** | Optional in B3_D3 `role_decision` |

### Passweg schließen

| Feld | Wert |
|------|------|
| **Begriff** | Passweg schließen |
| **term_type** | `COACHING_CONVENTION` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Position, Schläger oder Laufweg reduziert eine erkennbare gegnerische Passmöglichkeit (Team- und/oder Center-Ebene in B3_D3). |
| **Etablierte Terminologie** | EN: *deny the pass*, *stick in lane*. |
| **Abgrenzung** | Beobachtung ohne Qualitätsurteil über „richtigen“ Druck. |
| **source_refs** | — |
| **notes** | Auch Team-`supportFunction` |

### Mitspieler beim Zugriff unterstützen

| Feld | Wert |
|------|------|
| **Begriff** | Mitspieler beim Zugriff unterstützen |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Center sichert den ersten Druck ab, übernimmt eine folgende Aufgabe oder ermöglicht einen zweiten Zugriff (B3_D3). |
| **Etablierte Terminologie** | Zweiter Impuls / Staffelung (Coaching-Konvention). |
| **Abgrenzung** | ≠ offensives „Angriff unterstützen“ (B1). |
| **source_refs** | — |
| **notes** | — |

### Gegenspieler übernehmen

| Feld | Wert |
|------|------|
| **Begriff** | Gegenspieler übernehmen |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Center ordnet sich einem relevanten Gegenspieler zu bzw. übernimmt ihn sichtbar in der defensiven Situation (B3_D3). |
| **Etablierte Terminologie** | EN: *pick up*, *cover*. |
| **Abgrenzung** | Sichtbare Zuordnung — keine Absichtszuschreibung. |
| **source_refs** | — |
| **notes** | — |

### Timing / sichtbare Vorbereitung / Antizipation

| Feld | Wert |
|------|------|
| **Begriff** | Timing · sichtbare Vorbereitung · Antizipation |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Antizipation: auf Grundlage wahrgenommener Hinweise und Erfahrung eine mögliche nächste Spielsituation vorwegnehmen und sich darauf vorbereiten. RinQ beobachtet nur **sichtbare Vorbereitung** (Position, Bewegung, Körperausrichtung, Schulterblick) — keine innere Wahrnehmung (B1_D5). |
| **Etablierte Terminologie** | DEB-RTK Antizipation; EN: *timing*, *anticipation*. |
| **Abgrenzung** | Zustände: Vor dem Druck vorbereitet / Im nutzbaren Zeitfenster / Erst unter Druck / Nach Schließen des Zeitfensters / Unklar. B2 = Druckbedingungen. |
| **source_refs** | HR B1-C5 |
| **notes** | Umsetzung 2026-08-24 |

### Verbindungen erhalten

| Feld | Wert |
|------|------|
| **Begriff** | Verbindungen erhalten · Verbindungsstruktur |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Entwicklung spielbarer Verbindungen rund um den Center unter Bewegung (B1_D2) — Vertiefung von A1-Dreieck, keine Geometrieprüfung. |
| **Abgrenzung** | Verweist auf A1 **Dreieck**. |
| **source_refs** | HR B1-C2 |
| **notes** | — |

---

## Entscheidungen unter Druck (B2)

### Beobachtungsdimensionen unter Druck (B2)

| Feld | Wert |
|------|------|
| **Begriff** | Verfügbare Zeit · Verfügbarer Raum · Unmittelbarer Gegnerdruck · Verfügbare Handlungsoptionen |
| **term_type** | `RINQ_TAXONOMY` + `COACHING_CONVENTION` |
| **RinQ-Definition** | Am stärksten sichtbarer Einflussfaktor vor der Entscheidung (B2_D1) — getrennt vom Ergebnis. Dimensionen dürfen sich überschneiden. |
| **Etablierte Terminologie** | EN: *time/space*, *pressure*, *constraints*; keine IIHF-Viererliste. |
| **Abgrenzung** | Eingeschränkte Handlungsoptionen können Folge der anderen sein — nicht als alleinige Ursache behaupten. 0–3 = Vergleichshilfe, keine Messskala. |
| **source_refs** | HR B2-C1 |
| **notes** | Umsetzung 2026-08-24 |

### Lösungsarten unter Druck

| Feld | Wert |
|------|------|
| **Begriff** | Pass · Puck führen · Kontrolle halten · Befreiung |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Versuchte Lösung des Puckführers unter Druck (B2_D2) — sichtbare Lösung, nicht Gelingen. |
| **Etablierte Terminologie** | EN-Synonyme: Carry, Secure, Clear/Dump. **Kontrolle halten** ≠ A1-Absichern. **Befreiung** ≠ A2 Tief spielen. |
| **Abgrenzung** | Andere Taxonomie als A2 Pass/Puck führen/Tief spielen/Neuaufbau. |
| **source_refs** | HR B2-C2 |
| **notes** | Interne values: pass/carry/sichern/befreiung |

### Erste Lösung des Puckführers nach Gewinn

| Feld | Wert |
|------|------|
| **Begriff** | Pass · Puck führen · Kontrolle halten · Befreiung (nach Puckgewinn) |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Erste sichtbare Lösung des neuen Puckführers in den ersten 2–3 Sekunden (B2_D4). |
| **Abgrenzung** | A3 = kollektives Umschalten (Sofort fortsetzen / Kontrolliert neu aufbauen / Absicherung sichtbar). B2_D4 = individuelle Drucklösung. |
| **source_refs** | HR B2-C4 |
| **notes** | — |

---

## Defensive Stabilität & Zugriff (B3)

### Erster defensiver Zugriff

| Feld | Wert |
|------|------|
| **Begriff** | Erster defensiver Druck / Zugriff |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Sichtbarer Versuch, Zeit, Raum oder Handlungsoptionen des Puckführers einzuschränken (Distanz schließen, Lenken, Stockdruck, körperlicher Zugriff). Initiator (LW/C/RW/LD/RD/**Unklar**) + Ort (B3_D1). |
| **Etablierte Terminologie** | EN: *defensive pressure*, *closing the gap*, *first forecheck/backcheck engagement*. |
| **Abgrenzung** | Bloße Nähe/Mitlaufen ≠ aktiver Zugriff. Kein Systemname. Forecheck/Backcheck nur Kontext. |
| **source_refs** | HR B3-C1 |
| **notes** | Umsetzung 2026-08-24 |

### Druckwirkung (Zeit / Raum / Optionen)

| Feld | Wert |
|------|------|
| **Begriff** | Zeit eingeschränkt · Raum eingeschränkt · Handlungsoptionen eingeschränkt · kein klarer unmittelbarer Effekt · Unklar |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Am deutlichsten sichtbare unmittelbare Wirkung des Zugriffs — eine Kategorie pro Szene, getrennt vom späteren Outcome (B3_D2). |
| **Etablierte Terminologie** | Abgestimmt mit B2-Dimensionen; IIHF time and space. |
| **Abgrenzung** | Keine Mehrfachauswahl; kein rückwirkendes Klassifizieren durch Puckgewinn/Tor. |
| **source_refs** | HR B3-C2 |
| **notes** | — |

### Defensive Unterstützung (Timing / Funktion)

| Feld | Wert |
|------|------|
| **Begriff** | Sofortige / verzögerte / keine Unterstützung / Unklar · Zentrum schützen · Passweg schließen · Mitspieler beim Zugriff unterstützen · Gegenspieler übernehmen |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Art und Timing der Teamreaktion nach dem ersten Zugriff (B3_D3). Mitspieler unterstützen = zweiter defensiver Impuls; Gegenspieler übernehmen = Zuordnung zu anderem Angreifer. |
| **Etablierte Terminologie** | IIHF Pressure / Support / Contain — Label-Sets = RinQ. |
| **Abgrenzung** | Früher: Raum absichern / Druck aufrechterhalten. Staffelung = Prinzip, keine eigene Funktionsoption. Offensive Unterstützung (B1) ≠ defensive Unterstützung. |
| **source_refs** | HR B3-C3 |
| **notes** | — |

### Defensive Sequenz / Beobachtungstendenzen

| Feld | Wert |
|------|------|
| **Begriff** | Sequenzverlauf (B3_D4) · Beobachtungstendenzen (B3_D5) |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | B3_D4: Verlauf nach dem ersten Zugriff. B3_D5: getrennte Häufigkeiten über Dimensionen (früher Druck, Lenken nach außen, Zentrum schützen, Unterstützung, Sequenzstruktur) — **keine** Team-Identität. |
| **Etablierte Terminologie** | Keine IIHF-Äquivalente für die RinQ-Dimensionen. |
| **Abgrenzung** | Systeme und Zonenordnung → Track C. Legacy-Key `patternIdentity` (Einzelwahl) ersetzt durch `observedDefensiveTendencies`. |
| **source_refs** | SRC-B3-02 |
| **notes** | B3-C5 Umbau 2026-08-24 |

### Beobachtungstendenz

| Feld | Wert |
|------|------|
| **Begriff** | Beobachtungstendenz |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Eine vorsichtige Zusammenfassung der **aktuell ausgewählten Szenen**. Sie beschreibt keine dauerhafte Eigenschaft oder Identität eines Teams. |
| **Etablierte Terminologie** | — |
| **Abgrenzung** | ≠ Team-, Coach- oder Systemidentität. ≠ Qualitätsurteil. |
| **source_refs** | — |
| **notes** | B3_D5 |

### Stichprobe

| Feld | Wert |
|------|------|
| **Begriff** | Stichprobe |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Die in dieser Session ausgewählten / beobachteten Szenen oder Sequenzen, auf die sich die Tendenz-Einschätzung bezieht. |
| **Abgrenzung** | Nicht das ganze Spiel, nicht die Saison. |
| **notes** | B3_D5 |

### Aktiver Druck / Früher aktiver Druck

| Feld | Wert |
|------|------|
| **Begriff** | Früher aktiver Druck |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Erster aktiver defensiver Impuls entsteht früh, bevor der Gegner viel Zeit hat (B3_D1 → Tendenz in B3_D5). |
| **Abgrenzung** | Häufigkeit in der Stichprobe, kein „aggressives Team“. |
| **notes** | Dimension `early_pressure` |

### Lenken nach außen

| Feld | Wert |
|------|------|
| **Begriff** | Lenken nach außen |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Gegner wird sichtbar aus dem Zentrum bzw. nach außen gelenkt (Winkel, Position, Staffelung). |
| **notes** | Dimension `outside_guiding` |

### Defensive Struktur (Sequenz)

| Feld | Wert |
|------|------|
| **Begriff** | Defensive Struktur (über die Sequenz) |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Ob die defensive Ordnung nach dem ersten Zugriff lesbar bleibt oder erkennbar angepasst wird (B3_D4 → Tendenz in B3_D5). |
| **Abgrenzung** | ≠ Systemname / Formation (Track C). |
| **notes** | Dimension `sequence_structure` |

### Unterstützung des ersten Zugriffs

| Feld | Wert |
|------|------|
| **Begriff** | Unterstützung des ersten Zugriffs |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Nach dem ersten Druck folgt eine weitere defensive Aufgabe (zweiter Impuls, Absicherung, Staffelung, Anschluss) — Tendenz über die Stichprobe (B3_D3 → B3_D5). |
| **notes** | Dimension `pressure_support` |

---

## Defensive Zone Systeme (C1)

### Geschützter Raum

| Feld | Wert |
|------|------|
| **Begriff** | Geschützter Raum |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Ein Bereich, den die Defensive in der beobachteten Szene durch Positionierung, Abstand, Körper- oder Stockposition erkennbar kontrolliert (C1_D1). |
| **Abgrenzung** | Kann sich mit „Raum mit hoher Torgefahr“ überlagern. |
| **source_refs** | RINQ-SPACE-PRIORITY-MODEL · HR C1-C1 |
| **notes** | Paint-ID `protected_space` |

### Raum mit hoher Torgefahr

| Feld | Wert |
|------|------|
| **Begriff** | Raum mit hoher Torgefahr |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Ein Bereich, aus dem Abschluss, Pass oder direkte Anschlussaktion erhöhte unmittelbare Gefahr für das **verteidigte Tor** erzeugen kann (C1_D1). |
| **Etablierte Terminologie** | Früher UI: „Gefährlicher Raum“. |
| **Abgrenzung** | Gefahr immer bezogen auf das verteidigte Tor — keine perspektivlose Wertung. |
| **source_refs** | HR C1-C1 / MIN-003 |
| **notes** | Paint-ID `danger_space` |

### Weniger priorisierter Raum

| Feld | Wert |
|------|------|
| **Begriff** | Weniger priorisierter Raum |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Ein Bereich, der in der beobachteten Szene weniger stark geschützt wird. Behauptet keine feste taktische Absicht oder bewusste Freigabe (C1_D1). |
| **Etablierte Terminologie** | Früher UI: „Bewusst zugelassener Raum“. |
| **Abgrenzung** | ≠ „das Team will diesen Raum anbieten“. |
| **source_refs** | HR C1-C1 |
| **notes** | Paint-ID `accepted_space` |

### Abstände / Staffelung

| Feld | Wert |
|------|------|
| **Begriff** | Enge · mittlere · große Abstände · Staffelung |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | **Abstände:** räumliche Distanzen zwischen Defensivspielern bzw. Ebenen. **Staffelung:** räumlich versetzte Anordnung, sodass unterschiedliche Räume/Tiefen erreichbar bleiben (C1_D2). Kategorien sind keine Qualitätsnoten. |
| **Etablierte Terminologie** | Früher: Kompakt / Ausgewogen / Gestreckt. |
| **Abgrenzung** | Formation nur benennen ohne Raumzweck ≠ C1-Lernziel. Neutral Zone → C2. |
| **source_refs** | RINQ-STRUCTURE-OBSERVATION-MODEL · HR C1-C2 |
| **notes** | Interne IDs: compact/balanced/stretched/unclear |

### Auslöser (aktiver Zugriff)

| Feld | Wert |
|------|------|
| **Begriff** | Auslöser |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Unmittelbar vorausgehende sichtbare Veränderung, nach der ein aktiver Zugriff beginnt (C1_D3). Beweist keine innere Wahrnehmung oder taktische Vorgabe. |
| **Etablierte Terminologie** | EN-Synonym: *Trigger* (nur Glossar, nicht primäre UI). |
| **Abgrenzung** | Absicherung ist kein Auslöser (eigenes Feld). B3 = Zugriff lesen; C1 = Wechsel in der Zonenordnung. |
| **source_refs** | RINQ-PRESSURE-COVERAGE-MODEL · HR C1-C3 |
| **notes** | — |

### Absicherung (hinter Zugriff)

| Feld | Wert |
|------|------|
| **Begriff** | Absicherung |
| **term_type** | `COACHING_CONVENTION` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Sichtbare Positionierung von Mitspielern hinter oder neben einem Zugriff, durch die Räume, Passwege oder Gegenspieler weiter kontrolliert werden (C1_D3). |
| **Abgrenzung** | Nicht aus dem späteren Outcome ableiten. ≠ A1/A3 Absicherung nach Puckgewinn (anderer Kontext). |
| **source_refs** | HR C1-C3 |
| **notes** | — |

### Verantwortlichkeitswechsel

| Feld | Wert |
|------|------|
| **Begriff** | Verantwortlichkeitswechsel · Verbundenheit der Struktur |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Sichtbare Veränderung, welcher Spieler einen Raum, Passweg oder Gegenspieler kontrolliert (C1_D4). **Verbundenheit:** Abstände und Beziehungen erlauben weiterhin gegenseitige Unterstützung. |
| **Etablierte Terminologie** | EN: *switches*, *handoffs*, *collective shift*. |
| **Abgrenzung** | Sichtbare Übergabe ≠ „gezielt“. Keine gemeinsame Anpassung erkennbar ≠ unkoordiniert. |
| **source_refs** | RINQ-RESPONSIBILITY-SHIFT-MODEL · HR C1-C4 |
| **notes** | — |

### Stabilitätsbeobachtung

| Feld | Wert |
|------|------|
| **Begriff** | Heutige Stabilitätsbeobachtung |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Vorsichtige Zusammenfassung mehrerer beobachteter Szenen in der eigenen Zone (C1_D5). Keine dauerhafte Qualität, Identität oder feste Systemzuordnung. |
| **Etablierte Terminologie** | Früher: Defensivprofil. |
| **Abgrenzung** | Risikoprofil nicht mehr Pflicht. Satzstarter: „Im beobachteten Abschnitt war erkennbar, dass …“. |
| **source_refs** | RINQ-STABILITY-OBSERVATION-MODEL · HR C1-C5 |
| **notes** | — |

---

## Neutral Zone Systeme (C2)

### Neutraler-Zonen-Weg / Eintrittsweg

| Feld | Wert |
|------|------|
| **Begriff** | Neutraler-Zonen-Weg · Eintrittsweg |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Räumlicher Korridor, über den ein Angriff die neutrale Zone durchqueren und die offensive blaue Linie erreichen kann. |
| **Abgrenzung** | Formationszahlen / Systemnamen sind kein Pflichtlernziel. |
| **notes** | C2 · RinQ-Modell |

### Geschlossener / verbleibender Weg

| Feld | Wert |
|------|------|
| **Begriff** | Geschlossener Weg · Verbleibender Weg · Puck tief spielen |
| **term_type** | `RINQ_TAXONOMY` + `COACHING_CONVENTION` |
| **RinQ-Definition** | Geschlossen: Korridor durch Positionierung/Abstände/Stock sichtbar schwerer nutzbar. Verbleibend: Route, die in der Szene am ehesten nutzbar bleibt — ohne bewusste taktische Freigabe. Puck tief spielen: ohne kontrolliertes Hineinführen oder unmittelbare Passverbindung tief in die Angriffszone (EN: dump-in). |
| **Etablierte Terminologie** | EN: *protect the middle*, *force outside*, *deny the middle lane*, *dump-in*. |
| **Abgrenzung** | Kein 1-2-2-Label nötig. Eigene Zone / Slot → C1. Abgrenzung zu kontrolliertem Eintritt mit reduziertem Tempo. |
| **source_refs** | SRC-C2-01, SRC-C1-01 |
| **notes** | C2-C1 · HR · RINQ-NEUTRAL-ZONE-CORRIDOR-MODEL |

### Tiefenebene · Verbundenheit · Breite

| Feld | Wert |
|------|------|
| **Begriff** | Tiefenebene · Verbundenheit · Breite |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Tiefenebene: Defensivspieler auf ähnlicher Höhe. Verbundenheit: räumliche Beziehungen/Abstände zur Unterstützung oder Raumübernahme. Breite: zentrale Verdichtung bis Auffächerung (C2_D2). Abstandskategorien sind beobachtbar, keine Gut-/Schlecht-Wertung. |
| **Etablierte Terminologie** | Layers / connected five / spacing — keine IIHF-Zahlenskala. |
| **Abgrenzung** | Formation nur benennen ≠ Lernziel. C1-Struktur = eigene Zone. |
| **source_refs** | SRC-C2-01, SRC-C2-02 |
| **notes** | C2-C2 · HR · RINQ-DEPTH-STRUCTURE-MODEL |

### Lenkung (Steering)

| Feld | Wert |
|------|------|
| **Begriff** | Lenkung · pucknahe / puckferne Seite · sichtbarer Einflussfaktor |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Sichtbare Veränderung oder Begrenzung der möglichen Angriffsrichtung (Laufwinkel, geschlossene Wege, Staffelung, anschließende Route). Keine sichere Absicht oder Kausalität (C2_D3). Puckferne Seite = EN *weak side* (nicht „schwach“ als Qualitätsurteil). |
| **Etablierte Terminologie** | EN: *steering*, *angle*, *weak side*, *dump-in / slow entry*. |
| **Abgrenzung** | Kein gut/schlecht. Ergebnis (Turnover) ≠ Lenkungserfolg allein. Einflussfaktor ≠ Ursache. |
| **source_refs** | SRC-C2-03, SRC-C2-01 |
| **notes** | C2-C3 · HR · RINQ-STEERING-OBSERVATION-MODEL |

### Anpassung nach Überspielen der ersten Ebene

| Feld | Wert |
|------|------|
| **Begriff** | Überspielte erste Ebene · Ende der beobachteten Reaktion · Verbundenheit |
| **term_type** | `COACHING_CONVENTION` + `RINQ_MODEL` |
| **RinQ-Definition** | Systemreaktion, wenn der Angriff Puck/Puckführer an der vordersten erkennbaren defensiven Ebene vorbeibringt (C2_D4) — ohne Schuldzuweisung. Endpunkt = Ende der beobachteten Reaktion, nicht automatisch wiederhergestellte Kontrolle. |
| **Etablierte Terminologie** | EN: *reload*, *next layer*, *retreat with structure*. |
| **Abgrenzung** | B3 = Einzelzugriff/Support; C2_D4 = Struktur hinter der ersten Ebene. |
| **source_refs** | SRC-C2-02 |
| **notes** | C2-C4 · HR · RINQ-RECOVERY-AFTER-BREAKTHROUGH-MODEL |

### Neutral-Zone-Beobachtung

| Feld | Wert |
|------|------|
| **Begriff** | Heutige Neutral-Zone-Beobachtung · Beobachtungsabschnitt |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Vorsichtige Zusammenfassung wiederkehrender sichtbarer Prinzipien im ausgewählten Abschnitt — keine dauerhafte Team- oder Systemidentität (C2_D5). |
| **Abgrenzung** | Kein Risikoprofil als Pflicht. Kein „Dieses Team ist …“. |
| **notes** | C2-C5 · HR · RINQ-NEUTRAL-ZONE-OBSERVATION-MODEL |

### Kontrollierter Zoneneintritt / mit reduziertem Tempo

| Feld | Wert |
|------|------|
| **Begriff** | Kontrollierter Zoneneintritt · Kontrollierter Eintritt mit reduziertem Tempo |
| **term_type** | `RINQ_OPERATIONAL_LABEL` + `COACHING_CONVENTION` |
| **RinQ-Definition** | Kontrolliert: Puck beim Überqueren der offensiven blauen Linie geführt oder unmittelbar kontrolliert weitergespielt. Mit reduziertem Tempo: Puck bleibt kontrolliert, Geschwindigkeit oder Anschlussoptionen sind sichtbar reduziert. Abgrenzung zu Puck tief spielen. |
| **Etablierte Terminologie** | EN: *controlled entry*, *slow entry*. |
| **notes** | C2 · A2-Terminologie anschließen |

---

## Offensive Zone Systeme (C3)

### Offensive Raumverteilung

| Feld | Wert |
|------|------|
| **Begriff** | Direkt vor dem Tor · Slot · Seitenraum · Point · Hinter dem Tor |
| **term_type** | `RINQ_TAXONOMY` + `COACHING_CONVENTION` |
| **RinQ-Definition** | Welche OZ-Räume die Offensive hält bzw. unmittelbar spielbar macht vs. auffällig unbesetzt lässt (C3_D1) — Struktur vor Spielzugnamen. Breite ist keine Qualitätsnote. Slot und Point bleiben als etablierte Fachbegriffe primär sichtbar. |
| **Etablierte Terminologie** | EN: *net front*, *slot*, *half-wall*, *point* / *high*, *behind the net*. |
| **Abgrenzung** | Kein 2-3/Umbrella-Label nötig. Neutral Zone → C2. Freie Räume ≠ automatisch Fehler. |
| **source_refs** | SRC-C3-01, SRC-C3-02 |
| **notes** | C3-C1 · HR · RINQ-OFFENSIVE-SPACE-MODEL |

### Offensive Verbindungen

| Feld | Wert |
|------|------|
| **Begriff** | Spielbare Verbindung · Tief / Mitte / Point · puckferne Seite |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Ob besetzte Räume unter sichtbaren Bedingungen realistisch pass- und anschlussfähig verbunden sind (C3_D2). Keine Kategorie automatisch richtig/falsch. |
| **Etablierte Terminologie** | EN: *puck support*, *passing options*, *weak side* (nur Synonym). |
| **Abgrenzung** | B1 Support = Center-Anspielbarkeit; C3 = OZ-Strukturverbindungen. |
| **source_refs** | SRC-C3-01, SRC-01 |
| **notes** | C3-C2 · HR · RINQ-CONNECTION-OBSERVATION-MODEL |

### Bewegung und sichtbare Öffnung

| Feld | Wert |
|------|------|
| **Begriff** | Offensive Ausgangsbewegung · sichtbare defensive Reaktion · sichtbare Öffnung |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Sichtbare Abfolge Bewegung → Defensivreaktion → Öffnung (C3_D3). Zeitliche Reihenfolge ≠ sichere Kausalität. Öffnung ≠ bereits genutzter Vorteil (→ D4). |
| **Etablierte Terminologie** | EN: *drive*, *off-puck rotation*, *overload*, *seam* / *middle access*. |
| **Abgrenzung** | Keine Anschlussaktion in D3. Kein Spielzug richtig/falsch. |
| **source_refs** | SRC-C3-02 |
| **notes** | C3-C3 · HR · RINQ-MOVEMENT-OPENING-MODEL |

### Anschlussaktion nach Öffnung

| Feld | Wert |
|------|------|
| **Begriff** | Abschluss · Zusätzlicher Pass · Tiefes Zusammenspiel · Neuaufbau über den Point · Puckkontrolle halten |
| **term_type** | `RINQ_TAXONOMY` + `COACHING_TERM` |
| **RinQ-Definition** | Nächste Aktion nach sichtbarer Öffnung — getrennt vom Tor/Abschluss-Ergebnis (C3_D4). |
| **Etablierte Terminologie** | EN: *extra pass*, *cycle* / *low cycle*, *reset* / *reset high*. |
| **Abgrenzung** | Ergebnis ≠ Qualitätsurteil. Gameplan später. |
| **source_refs** | SRC-C3-01 |
| **notes** | C3-C4 · HR · RINQ-NEXT-ACTION-MODEL |

### Offensivstruktur-Beobachtung

| Feld | Wert |
|------|------|
| **Begriff** | Heutige Offensivstruktur-Beobachtung · Beobachtungsabschnitt |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Vorsichtige Zusammenfassung wiederkehrender sichtbarer Strukturprinzipien des ausgewählten Abschnitts (C3_D5) — keine dauerhafte Team-, Spielzug- oder Systemidentität. |
| **Abgrenzung** | Kein Risikoprofil als Pflicht. |
| **notes** | C3-C5 · HR · RINQ-OFFENSIVE-STRUCTURE-OBSERVATION-MODEL |

---

## Powerplay-Strukturen (D1)

### Lokaler Überzahlvorteil

| Feld | Wert |
|------|------|
| **Begriff** | Lokaler Überzahlvorteil · sichtbare Unterzahlanpassung |
| **term_type** | `RINQ_TAXONOMY` + `COACHING_CONVENTION` |
| **RinQ-Definition** | In einer Szene sichtbarer räumlicher Vorteil, bei dem mehr spielbare Optionen vorhanden sind, als die Unterzahl gleichzeitig kontrollieren kann (D1_D1). Keine Absicht oder Pflichtreaktion. |
| **Etablierte Terminologie** | EN: *create 2-on-1 / seams*, *outnumbered situations*. |
| **Abgrenzung** | Numerische Überzahl ≠ überall gleicher Vorteil. Entry/Clearing nicht D1-Kern. |
| **source_refs** | SRC-D1-01, SRC-D1-02 |
| **notes** | D1-C1 · HR · RINQ-LOCAL-POWERPLAY-ADVANTAGE-MODEL |

### Powerplay-Funktionen

| Feld | Wert |
|------|------|
| **Begriff** | Hohe Verbindung · Seitenraum · Zentrale Kurzoption · Präsenz vor dem Tor · Tiefe Option · Puckferne Option |
| **term_type** | `COACHING_TERM` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Gleichzeitig verfügbare Funktionen der Angreifer — nicht feste Positionsdogmen und kein Pflicht-Setup (D1_D2). |
| **Etablierte Terminologie** | EN: *High/Point*, *Halfwall*, *Bumper*, *Net Front*, *Goal Line*, *Weak Side*. |
| **Abgrenzung** | Funktionslesen ≠ Systemnamen (Umbrella, 1-3-1). |
| **source_refs** | SRC-D1-01 |
| **notes** | D1-C2 · HR · RINQ-POWERPLAY-FUNCTION-MODEL |

### Bewegung und Unterzahlstruktur

| Feld | Wert |
|------|------|
| **Begriff** | Powerplay-Bewegung · Unterzahlstruktur · Passlinie durch die Unterzahlstruktur |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Sichtbare Abfolge Bewegung → Unterzahlreaktion → Öffnung (D1_D3). Unterzahlstruktur setzt keine Box voraus. |
| **Etablierte Terminologie** | EN: *seam*, *downhill drive*, *box compress* nur als Synonym-Kontext. |
| **Abgrenzung** | Keine sichere Kausalität. Attacke → D1_D4. |
| **notes** | D1-C3 · HR · RINQ-PP-PK-MOVEMENT-MODEL |

### Angriffssignal (Puckkontrolle → direkter Angriff)

| Feld | Wert |
|------|------|
| **Begriff** | Angriffssignal · Anschlussaktion · Unmittelbare Folge |
| **term_type** | `RINQ_OPERATIONAL_LABEL` + `COACHING_CONVENTION` |
| **RinQ-Definition** | Sichtbare Veränderung unmittelbar vor einer Aktion; Aktion und unmittelbare Folge getrennt vom Tor (D1_D4). Kein separates „Warum jetzt?“. |
| **Etablierte Terminologie** | EN: *Trigger*, *one-timer*, *seam pass*, *reset*. |
| **Abgrenzung** | Tor/Save ≠ Qualitätsurteil. |
| **source_refs** | SRC-D1-02 |
| **notes** | D1-C4 · HR · RINQ-POWERPLAY-ATTACK-SIGNAL-MODEL |

### Powerplay-Beobachtung

| Feld | Wert |
|------|------|
| **Begriff** | Heutige Powerplay-Beobachtung |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Vorsichtige Zusammenfassung wiederkehrender sichtbarer Powerplay-Prinzipien des ausgewählten Abschnitts (D1_D5) — keine dauerhafte Team-/Setup-Identität. |
| **Abgrenzung** | Kein Entscheidungsprofil als Pflicht. |
| **notes** | D1-C5 · HR · RINQ-POWERPLAY-OBSERVATION-MODEL |

---

## Unterzahlspiel lesen (D2)

### Unterzahlspiel

| Feld | Wert |
|------|------|
| **Begriff** | Unterzahlspiel · Penalty Killing · PK |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Spielsituation, in der eine Mannschaft aufgrund einer Strafe mit weniger Feldspielern spielt. Englisch `Penalty Killing`, häufig `PK`. |
| **Etablierte Terminologie** | EN: *Penalty Killing*, *PK*. |
| **Abgrenzung** | D2 liest Unterzahl innerhalb einer PP-Sequenz; D1 = Powerplay; D3 = Entries/Clears. |
| **source_refs** | SRC-D2-01 |
| **notes** | Tracktitel DE-first |

### Raumpriorität

| Feld | Wert |
|------|------|
| **Begriff** | Raumpriorität · stärker / weniger stark kontrollierter Raum |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Der in einer beobachteten Szene sichtbar am stärksten geschützte Raum (D2_D1). Beweist keine feste taktische Vorgabe und keine bewusste Freigabe. |
| **Etablierte Terminologie** | Protect slot/net-front; sticks in lanes; perimeter less controlled. EN-Zonen nur als Synonyme (Bumper, Seam, Weak Side, Goal Line). |
| **Abgrenzung** | Kein Box/Diamond-Label nötig. Entry → D3. |
| **source_refs** | SRC-D2-01, SRC-D1-01 |
| **notes** | D2-C1 · HR REQUIRED · RinQ-Modell |

### Unterzahlorganisation / hohe und tiefe Ebene

| Feld | Wert |
|------|------|
| **Begriff** | Unterzahlorganisation · hohe Ebene · tiefe Ebene · Puckseite · puckferne Seite |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Räumliche Anordnung, Abstände und Beziehungen der Unterzahlspieler (D2_D2). Hohe Ebene = weiter vom eigenen Tor; tiefe Ebene = näher an Torlinie/Tor. Puckferne Seite = EN *Weak Side*. |
| **Etablierte Terminologie** | Spacing / layers; weak side as synonym only. |
| **Abgrenzung** | Keine Formationspflicht; keine Kompaktheits-Qualitätsnote. |
| **source_refs** | SRC-D2-01 |
| **notes** | D2-C2 · HR REQUIRED |

### Zugriffssignal und Schlägerdruck

| Feld | Wert |
|------|------|
| **Begriff** | Zugriffssignal · Zugriffsform · Strukturveränderung · Schlägerdruck |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Unmittelbar vor aktivem Zugriff sichtbare Veränderung (D2_D3); Englisch *Trigger*. Schlägerdruck = aktive Schlägerposition/-bewegung zur Begrenzung von Pass-/Schusslinie (*stick pressure*). Sequenzlösung → D2_D4. |
| **Etablierte Terminologie** | Trigger; stick pressure; collapse. |
| **Abgrenzung** | Keine sichere Ursache/innere Wahrnehmung. Kein `immediateEffect` mehr in D2_D3. |
| **source_refs** | SRC-D2-01, SRC-D2-02 |
| **notes** | D2-C3 · HR REQUIRED |

### Sequenzlösung (Befreiung / zweiter Puck)

| Feld | Wert |
|------|------|
| **Begriff** | Kontrollierte Befreiung · Befreiung unter starkem Druck · zweiter Puck · Neuaufbau |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Wie die Unterzahl nach Zugriff/Block/Torhüteraktion die Sequenz fortsetzt oder beendet (D2_D4) — mit beobachtbarer Kontrolle der nächsten Aktion, ohne gut/schlecht. Zweiter Puck = erneut frei spielbarer Puck nach Block/Abpraller/Kampf. |
| **Etablierte Terminologie** | Clear; second puck; freeze; reset — nur Glossarsynonyme. |
| **Abgrenzung** | Befreiung als Sequenzende ja; Entry-/Exit- und Befreiungsstrategie im Detail → D3. |
| **source_refs** | SRC-D2-02 |
| **notes** | D2-C4 · HR REQUIRED |

### Unterzahlbeobachtung

| Feld | Wert |
|------|------|
| **Begriff** | Heutige Unterzahlbeobachtung |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Vorsichtige Zusammenfassung wiederkehrender sichtbarer Unterzahlprinzipien des ausgewählten Abschnitts (D2_D5). Keine dauerhafte Team-, Formations- oder Systemidentität. |
| **Etablierte Terminologie** | — |
| **Abgrenzung** | Kein Risikoprofil als Pflicht; kein „Das PK ist …“. |
| **source_refs** | SRC-D2-01 |
| **notes** | D2-C5 · HR REQUIRED |

---

## Zoneneintritte und Befreiungen (D3)

### Zoneneintritt / Zonenaustritt

| Feld | Wert |
|------|------|
| **Begriff** | Zoneneintritt · Zonenaustritt |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Zoneneintritt: Überqueren der offensiven blauen Linie mit Puck oder unmittelbar spielbarer Puckverbindung (EN *entry*). Zonenaustritt: Verlassen der eigenen Zone mit Puck oder kontrollierbarer Anschlussaktion (EN *exit*). |
| **Etablierte Terminologie** | EN: *zone entry*, *zone exit*, *entry*, *exit*. |
| **Abgrenzung** | C2 = NZ-Kontrolle defensiv; C3 = etablierte OZ-Struktur; D2_D4 = Befreiung als PK-Sequenzende. |
| **source_refs** | SRC-D3-01 |
| **notes** | Tracktitel DE-first |

### Abstand zur blauen Linie

| Feld | Wert |
|------|------|
| **Begriff** | Abstand der Verteidigung zur blauen Linie |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Räumlicher Abstand der Verteidigung zum Puckführer beziehungsweise zur blauen Linie (D3_D1). Englisch häufig *gap*. Keine Abstandskategorie als Qualitätsnote. |
| **Etablierte Terminologie** | EN: *gap*, *defensive gap*. |
| **Abgrenzung** | Keine Carry-/Dump-Hierarchie. |
| **source_refs** | SRC-D3-01 |
| **notes** | D3-C1 · HR REQUIRED · RinQ-Modell |

### Puck führen / tiefes Spiel / vorbereitete Puckjagd

| Feld | Wert |
|------|------|
| **Begriff** | Puck führen · Puck gezielt hinter die Verteidigung legen · Puck tief spielen · vorbereitete Puckjagd · Neuaufbau |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Puck führen = mitführen unter Kontrolle (*carry*). Gezielt hinter die Verteidigung legen ≈ *chip*. Tiefes Spiel ≈ *dump*, mit vs. ohne vorbereitete Puckjagd operational abgegrenzt. Neuaufbau ≈ *reset*/*regroup*. |
| **Etablierte Terminologie** | Carry, chip, dump, dump-and-chase, reset — nur Glossarsynonyme. |
| **Abgrenzung** | Kein „kontrollierter Dump“ als Primärlabel. Keine automatische Qualitätsrangfolge. |
| **source_refs** | SRC-D3-01, SRC-D3-02 |
| **notes** | D3-C1 · HR REQUIRED |

### Unterstützung des Zoneneintritts

| Feld | Wert |
|------|------|
| **Begriff** | Unterstützung · Nachrückender Spieler · puckferne Option |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Sichtbare Positionierung/Bewegung eines Mitspielers beim oder unmittelbar vor dem Zoneneintritt (D3_D2). Nachrückender Spieler = EN *trailer*. Vorbereitete Puckjagd nur wenn schon vor/beim tiefen Spiel sichtbar. |
| **Etablierte Terminologie** | Support, trailer, weak side — nur Synonyme. |
| **Abgrenzung** | Keine Isolation-Skala. Späterer vollständiger Forecheck ≠ D3_D2. |
| **source_refs** | SRC-D3-01, SRC-C3-01 |
| **notes** | D3-C2 · HR REQUIRED |

### Unmittelbarer Zustand nach dem Zoneneintritt

| Feld | Wert |
|------|------|
| **Begriff** | Unmittelbarer Zustand · erste Anschlussoption · Fortsetzbarkeit |
| **term_type** | `RINQ_TAXONOMY` |
| **RinQ-Definition** | Beobachtungsfenster der ersten 2–4 Sekunden hinter der offensiven blauen Linie (D3_D3). Keine Pflichtursache. |
| **Etablierte Terminologie** | Post-entry state — nur Synonym. |
| **Abgrenzung** | Kein „erfolgreicher Entry“. Etablierte OZ → C3. |
| **source_refs** | SRC-D3-01 |
| **notes** | D3-C3 · HR REQUIRED |

### Befreiung / kontrollierter Zonenaustritt / Icing / unmittelbare Folge

| Feld | Wert |
|------|------|
| **Begriff** | Befreiung · kontrollierter Zonenaustritt · Icing · unmittelbare Folge |
| **term_type** | `COACHING_TERM` + `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Lösung unter Druck in der eigenen Zone (D3_D4). Befreiung = EN *clear*. Icing = Regelzustand, keine automatische Qualitätsnote. Unmittelbare Folge bewertet die Entscheidung nicht nachträglich. |
| **Etablierte Terminologie** | Clear, exit, icing — Glossarsynonyme. |
| **Abgrenzung** | D2_D4 = PK-Sequenzende; D3_D4 = Austrittsentscheidung. |
| **source_refs** | SRC-D3-01, SRC-D2-02, IIHF-RULES |
| **notes** | D3-C4 · HR REQUIRED |

### Beobachtung an den blauen Linien

| Feld | Wert |
|------|------|
| **Begriff** | Heutige Beobachtung an den blauen Linien |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Vorsichtige Zusammenfassung wiederkehrender sichtbarer Lösungen des ausgewählten Abschnitts (D3_D5). „Zu wenige Zoneneintritte/Zonenaustritte beobachtet“ bleibt gültig. |
| **Etablierte Terminologie** | — |
| **Abgrenzung** | Kein Risikoprofil als Pflicht; keine Team-/Übergangsidentität. |
| **source_refs** | SRC-D3-01 |
| **notes** | D3-C5 · HR REQUIRED |

---

## Zusätzlicher Feldspieler / Numerische Sondersituation (D4 Sidequest)

### Zusätzlicher Feldspieler

| Feld | Wert |
|------|------|
| **Begriff** | Zusätzlicher Feldspieler |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Ein Feldspieler, der anstelle des Torhüters eingesetzt wird. Dadurch kann eine Mannschaft mit einem zusätzlichen Angreifer spielen; das eigene Tor bleibt dabei unbesetzt. |
| **Etablierte Terminologie** | EN: *Extra Attacker*, *Goalie Pulled*. |
| **Abgrenzung** | Nicht mit Straf-Überzahl (Powerplay) gleichsetzen. D4 = Sidequest, kein Pflichttrack. |
| **source_refs** | SRC-IIHF-TERMINOLOGY-EXTRA-ATTACKER, SRC-IIHF-RULEBOOK-2025-26-R84.2 |
| **notes** | D4-C0 · HR REQUIRED |

### Leeres Tor

| Feld | Wert |
|------|------|
| **Begriff** | Leeres Tor |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Situation, in der der Torhüter das Eis verlassen hat und das eigene Tor nicht durch einen Torhüter besetzt ist. |
| **Etablierte Terminologie** | EN: *Empty Net*. |
| **Abgrenzung** | Ergebnis (Empty-Net-Tor/Gegentor) ≠ Qualitätsnote. |
| **source_refs** | SRC-IIHF-TERMINOLOGY-EXTRA-ATTACKER |
| **notes** | D4 Sidequest |

### 6-gegen-5

| Feld | Wert |
|------|------|
| **Begriff** | 6-gegen-5 |
| **term_type** | `COACHING_TERM` |
| **RinQ-Definition** | Numerische Spielsituation mit sechs Feldspielern gegen fünf Feldspieler, typischerweise nach einem Torhüterwechsel zugunsten eines zusätzlichen Feldspielers. |
| **Etablierte Terminologie** | EN: *6-on-5*, *6v5*. |
| **Abgrenzung** | Nicht mit regulärem Überzahlspiel nach einer Strafe gleichsetzen. Nicht mit 5-gegen-3 oder Empty-Net-Angriff gleichsetzen. |
| **source_refs** | SRC-DEB-RRL-2020-S23, SRC-IIHF-RULEBOOK-2025-26-R84.2 |
| **notes** | D4 Sidequest |

### Absicherung hinter dem Puck (D4)

| Feld | Wert |
|------|------|
| **Begriff** | Absicherung hinter dem Puck |
| **term_type** | `COACHING_CONVENTION` + `RINQ_TAXONOMY` |
| **RinQ-Definition** | Positionierung eines Spielers hinter dem Puck beziehungsweise hinter der aktuellen Angriffsaktion, um einen freien Puck, Puckverlust oder Befreiungsversuch aufnehmen zu können (D4_D3; Anschluss an A1 Absichern). Besonders relevant bei leerem eigenen Tor. |
| **Etablierte Terminologie** | Support behind the puck / defensive coverage — nur Synonyme. |
| **Abgrenzung** | Keine Garantie gegen Puckverlust oder Gegentor. „Keine Absicherung erkennbar“ ≠ automatischer Fehler. |
| **source_refs** | SRC-IIHF-COACHING-2V2-SHOOTING-BOARD, RINQ-MODEL-A1-ABSICHERN, RINQ-MODEL-D4-PUCK-SECURITY |
| **notes** | D4-C3 · HR REQUIRED |

### Anschlussoption (D4)

| Feld | Wert |
|------|------|
| **Begriff** | Anschlussoption |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Eine für den Puckführer sichtbar erreichbare nächste Aktion, zum Beispiel Pass, Schuss, Puckführung oder Rückpass (D4_D2 Vorbereitung der Aktion). |
| **Etablierte Terminologie** | Outlet / support option — Synonyme. |
| **Abgrenzung** | Keine Entscheidungsqualität; keine „bessere Alternative“ rückblickend. |
| **source_refs** | SRC-IIHF-COACHING-1V1-OUTLETS, RINQ-MODEL-D4-ACTION-PREPARATION |
| **notes** | D4-C2 · HR REQUIRED |

### D4 Sidequest (Produkt)

| Feld | Wert |
|------|------|
| **Begriff** | Numerische Sondersituation (Sidequest) |
| **term_type** | `RINQ_MODEL` (Produkt) |
| **RinQ-Definition** | Optionale, ereignisabhängige Erfassung seltener Zahlenverhältnisse. Legacy-Modul D4 ist `deprecated`/`active: false`. Beobachtungsraster (Struktur / Aktionsvorbereitung / Absicherung) ist RinQ — kein DEB-/IIHF-Standard. Teamruhe entfernt. |
| **Etablierte Terminologie** | EN-Synonyme situationsbezogen (Extra Attacker, Empty Net, 6v5). |
| **Abgrenzung** | **Kein** Pflicht-Track nach D3. Overtime ≠ D4-Kern. PP/PK In-Zone → D1/D2. |
| **source_refs** | RINQ-PRODUCT-DECISION-D4-SIDEQUEST, SRC-DEB-RRL-2020-S23 |
| **notes** | D4-C0…C4 · HR REQUIRED · Modul inactive |

---

## Tendenzen erkennen (E1)

### Tendenz

| Feld | Wert |
|------|------|
| **Begriff** | Tendenz |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Eine vorläufige Beschreibung wiederkehrenden sichtbaren Verhaltens in mehreren vergleichbaren Situationen. Eine Tendenz ist keine gesicherte Ursache und keine dauerhafte Eigenschaft eines Teams. |
| **Etablierte Terminologie** | EN: *tendency* (nicht als Teamdiagnostik). |
| **Abgrenzung** | Highlight-Häufung ≠ Tendenz. Anpassungen → E2. |
| **source_refs** | SRC-IIHF-CEF-2025, SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017, RINQ-MODEL-E1-SEGMENT-TENDENCIES |
| **notes** | E1-C5 · HR REQUIRED |

### Vergleichsmerkmale

| Feld | Wert |
|------|------|
| **Begriff** | Vergleichsmerkmale |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Sichtbare Eigenschaften, anhand derer Situationen miteinander verglichen werden, zum Beispiel Zone, Auslöser, Positionierung, Reaktion und Ablauf. |
| **Etablierte Terminologie** | EN-Synonym: *Pattern Fingerprint* (nur Synonym, nicht UI-Hauptbegriff). |
| **Abgrenzung** | Ergebnisähnlichkeit allein genügt nicht. Drei Fälle ≠ Nachweis. |
| **source_refs** | SRC-DEB-RRL-2020-S12, SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017, RINQ-MODEL-E1-COMPARISON-FEATURES |
| **notes** | E1-C1 · HR REQUIRED |

### Gegenfall

| Feld | Wert |
|------|------|
| **Begriff** | Gegenfall |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Eine ausreichend ähnliche Ausgangslage, in der das erwartete Verhalten nicht oder anders auftritt. Ein Gegenfall kann eine Tendenz einschränken oder schärfen, widerlegt sie aber nicht automatisch. |
| **Etablierte Terminologie** | Counterexample / counter-case. |
| **Abgrenzung** | Nicht jede andere Situation ist ein Gegenfall. Fehlender Gegenfall stärkt nicht automatisch. |
| **source_refs** | SRC-IIHF-CEF-2025, SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017, RINQ-MODEL-E1-COUNTERCASE |
| **notes** | E1-C2 · HR REQUIRED |

### Stabile Merkmale / Variable Merkmale

| Feld | Wert |
|------|------|
| **Begriff** | Stabile Merkmale · Variable Merkmale |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Stabile Merkmale: in den bisher verglichenen Situationen wiederholt ähnlich sichtbar — vorläufig, nicht als unveränderlich bewiesen. Variable Merkmale: können wechseln, ohne dass das beobachtete Grundverhalten zwingend ein anderes sein muss. |
| **Etablierte Terminologie** | — |
| **Abgrenzung** | Ersetzt den absoluten UI-Begriff „Invariante“. |
| **source_refs** | SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017, RINQ-MODEL-E1-STABLE-VARIABLE-FEATURES |
| **notes** | E1-C3 · HR REQUIRED |

### Funktionaler Kern

| Feld | Wert |
|------|------|
| **Begriff** | Funktionaler Kern |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | RinQ-Arbeitsbegriff für wenige sichtbare Merkmale, die in den bisher verglichenen Situationen trotz unterschiedlicher Ausführung ähnlich bleiben. |
| **Etablierte Terminologie** | Kein DEB-/IIHF-Raster. |
| **Abgrenzung** | Vorläufige Arbeitsbeschreibung, keine bewiesene Invariante. |
| **source_refs** | RINQ-MODEL-E1-STABLE-VARIABLE-FEATURES |
| **notes** | E1-C3 · Erklärungstext |

### Kontext / Beobachtungsgrundlage / Beobachtetes Segment / Hypothese

| Feld | Wert |
|------|------|
| **Begriff** | Kontext · Beobachtungsgrundlage · Beobachtetes Segment · Hypothese |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | **Kontext:** sichtbare Rahmenbedingungen (Zone, Gegnerdruck, Personal, Spielstand, Puckkontrolle, numerische Situation). **Beobachtungsgrundlage:** dokumentierte Menge und Vergleichbarkeit inkl. Gegenfällen und nicht beurteilbaren Fällen. **Beobachtetes Segment:** konkreter Spielausschnitt — Aussagen gelten nicht automatisch für andere Spiele. **Hypothese:** vorläufige, noch zu prüfende Erklärung — keine bestätigte Ursache. |
| **Etablierte Terminologie** | — |
| **Abgrenzung** | D4 prüft Kontextstabilität, keine kausale Attribution. |
| **source_refs** | SRC-IIHF-CDF-2025, SRC-SPORTS-ANALYTICS-METHODOLOGY-2024, RINQ-DECISION-E1-REMOVE-CAUSAL-ATTRIBUTION |
| **notes** | E1-C4 · HR REQUIRED |

---

## Spielanpassungen erkennen (E2)

### Spielanpassung

| Feld | Wert |
|------|------|
| **Begriff** | Spielanpassung · Anpassung |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Eine Veränderung im Spielverhalten, die als Reaktion auf eine Spielsituation oder wiederkehrende Interaktion gedacht sein kann. Aus der Beobachtung allein ist häufig nicht sicher erkennbar, ob sie vom Coach angeordnet, von Spielern selbst vorgenommen oder durch andere Kontextfaktoren ausgelöst wurde. |
| **Etablierte Terminologie** | EN-Synonym: *Adjustment*. |
| **Abgrenzung** | Keine behauptete Coachingabsicht; keine Erfolgsbewertung aus Toren. |
| **source_refs** | SRC-IIHF-CEF-2025, SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017, RINQ-MODEL-E2-SEGMENT-ADJUSTMENTS |
| **notes** | E2-C5 · HR REQUIRED |

### Anpassungshypothese

| Feld | Wert |
|------|------|
| **Begriff** | Anpassungshypothese |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Eine vorläufige Annahme, dass eine sichtbare Veränderung mit einer zuvor beobachteten Interaktion zusammenhängen könnte. Sie enthält mindestens eine alternative Erklärung und bleibt überprüfbar. |
| **Etablierte Terminologie** | EN: *adjustment hypothesis*. |
| **Abgrenzung** | Zeitliche Reihenfolge ≠ Ursache. Funktionale Passung ≠ Nachweis. |
| **source_refs** | SRC-IIHF-CDF-2025, SRC-SPORTS-ANALYTICS-METHODOLOGY-2024, RINQ-MODEL-E2-ADJUSTMENT-HYPOTHESIS |
| **notes** | E2-C3 · HR REQUIRED |

### Vergleichbare Situation

| Feld | Wert |
|------|------|
| **Begriff** | Vergleichbare Situation |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Eine Situation, deren für die Analyse wesentliche Ausgangsbedingungen ausreichend ähnlich sind. Dazu können Spielphase, Zone, numerische Situation, Puckbesitz, Gegnerdruck, Rollen und Spielkontext gehören. |
| **Etablierte Terminologie** | — |
| **Abgrenzung** | Nicht alle Dimensionen müssen identisch sein; Grenzen dokumentieren. |
| **source_refs** | SRC-OBSERVATIONAL-METHODOLOGY-SPORT-2017, RINQ-MODEL-E2-BEFORE-AFTER |
| **notes** | E2-C1 · HR REQUIRED |

### Ausgangsbeobachtungen

| Feld | Wert |
|------|------|
| **Begriff** | Ausgangsbeobachtungen |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Mehrere vergleichbare Beobachtungen vor einer möglichen Veränderung. Sie dienen als vorläufige Vergleichsbasis und sind keine unveränderliche Norm. |
| **Etablierte Terminologie** | EN-Synonym: *Baseline*. |
| **Abgrenzung** | Keine feste Team-Norm. |
| **source_refs** | RINQ-MODEL-E2-MANUAL-CHANGE-TIMELINE |
| **notes** | E2-C2 |

### Möglicher Veränderungszeitpunkt

| Feld | Wert |
|------|------|
| **Begriff** | Möglicher Veränderungszeitpunkt |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Der früheste beobachtete Zeitpunkt, ab dem ein verändertes Verhalten in weiteren vergleichbaren Situationen erneut sichtbar wird. In RinQ ist dies eine manuelle Beobachtungshilfe und kein statistisch berechneter Change Point. |
| **Etablierte Terminologie** | EN-Synonym: *Change Point* (nur Synonym; formale Zeitreihenverfahren ≠ E2). |
| **Abgrenzung** | SRC-CHANGEPOINT-TEAM-SPORT-2022 validiert E2 nicht. |
| **source_refs** | SRC-CHANGEPOINT-TEAM-SPORT-2022, RINQ-MODEL-E2-MANUAL-CHANGE-TIMELINE |
| **notes** | E2-C2 · HR REQUIRED |

### Funktionale Passung

| Feld | Wert |
|------|------|
| **Begriff** | Funktionale Passung |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Ein Hinweis darauf, dass die sichtbare Veränderung einen Raum, Weg, eine Rolle oder Anschlussoption betrifft, die mit der zuvor beobachteten Interaktion zusammenhängt. Funktionale Passung beweist keine Ursache. |
| **Etablierte Terminologie** | — |
| **Abgrenzung** | „Keine ausreichende funktionale Verbindung“ ist gültig. |
| **source_refs** | RINQ-MODEL-E2-ADJUSTMENT-HYPOTHESIS |
| **notes** | E2-C3 |

### Ergebnisverzerrung

| Feld | Wert |
|------|------|
| **Begriff** | Ergebnisverzerrung |
| **term_type** | `COACHING_CONVENTION` + Forschung |
| **RinQ-Definition** | Die Tendenz, eine Entscheidung oder Handlung aufgrund ihres späteren Ergebnisses zu beurteilen. Ein gutes Ergebnis beweist keine gute Entscheidung; ein schlechtes Ergebnis beweist keine schlechte Entscheidung. |
| **Etablierte Terminologie** | EN-Synonym: *Outcome Bias*. |
| **Abgrenzung** | Fußball-/Liga-Studien; nicht eishockeyspezifisch. |
| **source_refs** | SRC-OUTCOME-BIAS-SPORT-2019, SRC-OUTCOME-BIAS-COACHING-2023 |
| **notes** | E2-C4 · HR REQUIRED |

### Problemverlagerung · Beobachtungssignal

| Feld | Wert |
|------|------|
| **Begriff** | Problemverlagerung · Beobachtungssignal |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | **Problemverlagerung:** Eine bisherige Herausforderung wird weniger sichtbar, gleichzeitig kann an anderer Stelle eine neue Option oder ein Nachteil entstehen. **Beobachtungssignal:** Stärke der dokumentierten sichtbaren Veränderung über Wiederholung und Vergleichbarkeit — nicht dasselbe wie Interpretationssicherheit oder Wahrscheinlichkeit. |
| **Etablierte Terminologie** | EN: *trade-off* / *signal* (nur Synonyme). |
| **Abgrenzung** | Kein Erfolg/Misserfolg aus Scoreboard. |
| **source_refs** | SRC-MATCH-ANALYSIS-TEAM-SPORTS-2022, RINQ-MODEL-E2-INTERACTION-CHAIN, RINQ-MODEL-E2-SEGMENT-ADJUSTMENTS |
| **notes** | E2-C4, E2-C5 |

---

## Micro-Analytics & Evidenz (E3)

### Gültige Ausgangssituation

| Feld | Wert |
|------|------|
| **Begriff** | Gültige Ausgangssituation |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Eine Situation, die die vor der Erfassung festgelegten Einschlusskriterien erfüllt. Jede gültige Ausgangssituation wird unabhängig vom späteren Ergebnis dokumentiert. |
| **Etablierte Terminologie** | EN-Synonym: *Opportunity* |
| **Abgrenzung** | Ergebnis (Zielereignis / anderes / unklar) ist getrennt. |
| **source_refs** | SRC-STROBE-OBSERVATIONAL-REPORTING, RINQ-DECISION-E3-UNCLEAR-OUTCOMES |
| **notes** | E3-C1 · HR NEEDS_CHANGE |

### Zielereignis

| Feld | Wert |
|------|------|
| **Begriff** | Zielereignis |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Das vor der Erfassung definierte Ereignis, dessen Auftreten innerhalb einer gültigen Ausgangssituation gezählt wird. |
| **Etablierte Terminologie** | EN-Synonym: *Target Event* |
| **Abgrenzung** | Nicht automatisch „Erfolg“; nur die gewählte Messkategorie. |
| **source_refs** | RINQ-DECISION-E3-UNCLEAR-OUTCOMES |
| **notes** | E3-C1 |

### Auswertbares Ergebnis / Unklares Ergebnis / Stichprobenrate

| Feld | Wert |
|------|------|
| **Begriff** | Auswertbares Ergebnis · Unklares Ergebnis · Stichprobenrate |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Auswertbar: eindeutig als Zielereignis oder anderes Ergebnis einordenbar. Unklar: gültiger Fall, dessen Ergebnis nicht sicher klassifizierbar ist — separat, nicht als Misserfolg. Stichprobenrate: Zielereignisse / eindeutig auswertbare Fälle der konkret beobachteten Stichprobe; keine automatische allgemeine Teamrate. |
| **Etablierte Terminologie** | EN: *evaluable outcome*, *unclear outcome*, *sample rate* |
| **Abgrenzung** | Absolute Zahlen mindestens gleichrangig mit Prozenten. Mindestzahlen = Übungsumfang. |
| **source_refs** | SRC-STROBE-OBSERVATIONAL-REPORTING, RINQ-DECISION-E3-UNCLEAR-OUTCOMES |
| **notes** | E3-C1 |

### Vergleichsgruppe

| Feld | Wert |
|------|------|
| **Begriff** | Vergleichsgruppe · primäre Vergleichsdimension · Stichprobe |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Eine anhand einer vorher festgelegten Dimension gebildete Teilmenge derselben Messfrage. Weitere sichtbare Kontextunterschiede werden dokumentiert. |
| **Etablierte Terminologie** | EN-Synonym: *Cohort* (nur intern/Glossar) |
| **Abgrenzung** | Keine automatische Wertung besser/schlechter/effektiver. |
| **source_refs** | RINQ-MODEL-E3-COMPARISON-GROUPS |
| **notes** | E3-C2 |

### Bedingter Zusammenhang

| Feld | Wert |
|------|------|
| **Begriff** | Bedingter Zusammenhang · Gegenfall |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Gemeinsames Auftreten einer Bedingung und eines Ergebnisses innerhalb der beobachteten Stichprobe. Daraus folgt keine Ursache. Gegenfälle begrenzen oder schärfen, widerlegen nicht automatisch. |
| **Etablierte Terminologie** | Association ≠ causation (Methodenkonvention). |
| **Abgrenzung** | Keine Kausal- oder Qualitätsaussage aus E3 allein. |
| **source_refs** | RINQ-MODEL-E3-CONDITIONAL-ASSOCIATION |
| **notes** | E3-C3 |

### Tragfähigkeit der Beobachtungsgrundlage / Aussagestufe

| Feld | Wert |
|------|------|
| **Begriff** | Tragfähigkeit der Beobachtungsgrundlage · Aussagestufe · höchstens vertretbare Aussage |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Qualitative Einordnung von Definition, Vollständigkeit, Stichprobengröße, Vergleichbarkeit, unklaren Fällen, Gegenfällen und Stabilität — kein statistischer Evidenzscore. Aussagestufe: stärkste Formulierung, die anhand der dokumentierten Beobachtungsgrundlage noch vertretbar erscheint. |
| **Etablierte Terminologie** | EN-Synonyme (intern): *Evidence Strength*, *Claim Ladder*, *Claim Ceiling* |
| **Abgrenzung** | Keine p-Werte, kein automatischer Gesamtscore. Ursache/Teamwahrheit/Zukunfts-% nicht erreichbar in E3. |
| **source_refs** | RINQ-MODEL-E3-EVIDENCE-ASSESSMENT, RINQ-MODEL-E3-STATEMENT-LADDER |
| **notes** | E3-C4, E3-C5 · HR NEEDS_CHANGE |

---

## Prognose & Antizipation (E4)

### Antizipation

| Feld | Wert |
|------|------|
| **Begriff** | Antizipation |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Eine begründete Erwartung über eine mögliche nächste Aktion auf Grundlage aktuell sichtbarer und kontextbezogener Informationen. Sie ist keine sichere Vorhersage. |
| **Etablierte Terminologie** | EN: *anticipation* |
| **Abgrenzung** | Keine Prediction Accuracy / Hockey IQ. |
| **source_refs** | SRC-ANTICIPATION-SPORT-REVIEW-2019, RINQ-MODEL-E4-READ-OUTCOME-SEPARATION |
| **notes** | E4-C1 · HR NEEDS_CHANGE |

### Sichtbarer Hinweis / Haupthinweis

| Feld | Wert |
|------|------|
| **Begriff** | Sichtbarer Hinweis · Haupthinweis |
| **term_type** | `RINQ_OPERATIONAL_LABEL` / `RINQ_MODEL` |
| **RinQ-Definition** | Hinweis: vor oder während der Situation beobachtbare Information für die Erwartung (z. B. Körperausrichtung, Gegnerdruck, Passweg). Haupthinweis: der Hinweis, den der Beobachter für seine aktuelle Erwartung am stärksten heranzieht — Nutzungsrolle, keine objektive allgemeine Wichtigkeit. |
| **Etablierte Terminologie** | EN-Synonym: *Cue* |
| **Abgrenzung** | Keine Cue-Punkte oder Prozentwerte. |
| **source_refs** | RINQ-MODEL-E4-CUE-ROLES |
| **notes** | E4-C2 |

### Alternativszenario / Auslöser einer Aktualisierung

| Feld | Wert |
|------|------|
| **Begriff** | Alternativszenario · Auslöser einer Aktualisierung |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Alternativszenario: zweite realistische nächste Aktion, die durch neue/veränderte sichtbare Information plausibler werden kann. Auslöser: neue oder veränderte sichtbare Information, aufgrund derer eine Erwartung überprüft, beibehalten oder geändert wird. |
| **Etablierte Terminologie** | EN: *Branch*, *Update Trigger* |
| **Abgrenzung** | Didaktische Begrenzung auf eine Alternative ≠ objektive Zwei-Wege-Welt. |
| **source_refs** | RINQ-MODEL-E4-SCENARIO-BRANCH, RINQ-MODEL-E4-PREDICTION-UPDATE |
| **notes** | E4-C3, E4-C4 |

### Übereinstimmung / Sicherheit der ursprünglichen Erwartung

| Feld | Wert |
|------|------|
| **Begriff** | Übereinstimmung · Sicherheit der ursprünglichen Erwartung |
| **term_type** | `RINQ_OPERATIONAL_LABEL` |
| **RinQ-Definition** | Übereinstimmung: ob die tatsächlich beobachtete Aktion der zuvor gespeicherten Erwartung entsprach — keine automatische Qualitätsbewertung. Sicherheit: subjektive Einschätzung vor der Aktion — keine objektive Wahrscheinlichkeit und kein Kompetenzwert. |
| **Etablierte Terminologie** | EN: *Match*, *Confidence* |
| **Abgrenzung** | Nicht mit Begründungsgüte verrechnen. |
| **source_refs** | RINQ-MODEL-E4-READ-OUTCOME-SEPARATION, SRC-OUTCOME-BIAS-SPORT-2019 |
| **notes** | E4-C1 |

### Bisherige Antizipations-Beobachtungen

| Feld | Wert |
|------|------|
| **Begriff** | Meine bisherigen Antizipations-Beobachtungen |
| **term_type** | `RINQ_MODEL` |
| **RinQ-Definition** | Beschreibende Zusammenfassung der bisher dokumentierten Hinweise, Alternativszenarien und Aktualisierungen. Kein stabiles persönliches Profil und keine Bewertung des Hockey-IQ. |
| **Etablierte Terminologie** | EN-Synonym (intern): *Anticipation Profile* |
| **Abgrenzung** | Keine Trefferquote, kein Level, keine Validitätsschwelle „20 Reads“. |
| **source_refs** | RINQ-DECISION-E4-NO-SKILL-PROFILE |
| **notes** | E4-C5 · HR NEEDS_CHANGE |

### Kippmoment (Abgrenzung)

| Feld | Wert |
|------|------|
| **Begriff** | Kippmoment |
| **term_type** | `RINQ_OPERATIONAL_LABEL` (optional, breitere Spielverlaufsanalyse) |
| **RinQ-Definition** | Nicht mit einer einzelnen E4-Erwartungsaktualisierung gleichsetzen. E4 nutzt stattdessen: sichtbare Veränderungen, die eine andere nächste Aktion plausibler machen. |
| **Abgrenzung** | Kein E4-Lernziel mehr. |
| **source_refs** | RINQ-DECISION-E4-REMOVE-TIPPING-MOMENT |
| **notes** | E4-MIN-002 |

---

## Verwendung in QA

| term_type | In UI/Curriculum |
|-----------|------------------|
| `STANDARD_HOCKEY_TERM` | Darf neutral verwendet werden |
| `COACHING_TERM` | Als Konvention/Metapher, nicht als Regel |
| `RINQ_OPERATIONAL_LABEL` | Als RinQ-Beobachtungslabel kennzeichnen (Glossar, Metadaten) |
| `RINQ_TAXONOMY` | Als RinQ-Modell kennzeichnen; Einzelbegriffe separat |

---

*Scope: A1–E4 (2026-08-24; D4 Sidequest). Human Review offen. Nächster Track: M1 Meta-Scan.*

# D4 — Evidence Sources (Sidequest / Deprecated)

**Datum:** 2026-08-24  
**Scope:** D4-C0 … D4-C4 · **kein** Overtime-Kern  
**Status:** Quellen defensiv dokumentiert · RinQ-Beobachtungsmodell · Human-Abnahme offen

---

## Quellen-Katalog

| Ref-ID | Autor / Organisation | Titel | Jahr | URL / Pfad | Typ |
|--------|---------------------|-------|------|------------|-----|
| **SRC-DEB-RRL-2020-S23** | Deutscher Eishockey-Bund e.V. | Rahmenrichtlinien für die Traineraus-, -fort- und -weiterbildung, Fortschreibung 2020, S. 23 | 2020 | Lokale PDF (Downloads); DEB-Download-Portal | Primär (Ausbildung) |
| **SRC-IIHF-RULEBOOK-2025-26-R84.2** | IIHF | Official Rule Book 2025/26, Rule 84.2 Overtime Extra Attacker | 2025 | https://blob.iihf.com/iihf-media/iihfmvc/media/contentimages/3_the_iihf/2025-26_iihf_rulebook_22122025-v1.pdf | Primär (Regel) |
| **SRC-IIHF-TERMINOLOGY-EXTRA-ATTACKER** | IIHF | Ice Hockey Terminology (Extra Attacker / Empty-Net Goal) | — | https://www.iihf.com/en/events/2026/olympic-w/static/71794/ice_hockey_terminology | Primär (Terminologie) |
| **SRC-IIHF-COACHING-1V1-OUTLETS** | IIHF Coaching | 1vs1 plus outlets | — | https://www.iihf.com/en/coaching/18787/1vs1-plus-outlets | Sekundär (Coaching) |
| **SRC-IIHF-COACHING-5V5-OFFENCE** | IIHF Coaching | 5vs5 offence | — | https://www.iihf.com/en/coaching/18958/5vs5-offence | Sekundär (Coaching) |
| **SRC-IIHF-COACHING-2V2-SHOOTING-BOARD** | IIHF Coaching | 2vs2 shooting board | — | https://www.iihf.com/en/coaching/18952/2vs2-shooting-board | Sekundär (Coaching) |
| **SRC-D4-02** | Produkt / Curriculum | `deprecated` + `numerical_situation` Sidequest | 2026 | Curriculum + `sessionSidequests.ts` | Primär (Produkt) |

**Hinweis:** Pull-Timing-Analytics und Overtime-Systeme sind **nicht** Claim-Kern von D4.

---

## Beleggrenzen (offizielle Quellen)

### SRC-DEB-RRL-2020-S23

- **Relevanz:** Über-/Unterzahl als Ausbildungsinhalt; individual-/gruppentaktische Fähigkeiten; Kleingruppentaktik; Aufbau und Eindringen in die Angriffszone.
- **Beleggrenze:** Bestätigt fachliche Relevanz numerischer Sondersituationen, definiert **kein** konkretes 6-gegen-5-Beobachtungsraster und **nicht** die RinQ-Skalen.

### SRC-IIHF-RULEBOOK-2025-26-R84.2

- **Relevanz:** Torhüter kann zugunsten eines zusätzlichen Feldspielers ersetzt werden.
- **Beleggrenze:** Regelquelle — keine taktische Qualitäts- oder Beobachtungsklassifikation.

### SRC-IIHF-TERMINOLOGY-EXTRA-ATTACKER

- **Relevanz:** Offizielle Begriffe Extra Attacker / Empty-Net Goal.
- **Beleggrenze:** Terminologie — keine taktische Handlungsanweisung.

### SRC-IIHF-COACHING-1V1-OUTLETS / 5V5-OFFENCE / 2V2-SHOOTING-BOARD

- **Relevanz:** Freilaufen, Passoptionen, freie Räume, Position zwischen Gegner und Tor, freie Pucks aufnehmen.
- **Beleggrenze:** Allgemeine Prinzipien — **kein** spezielles 6-gegen-5- oder Empty-Net-Systemmodell.

---

## RinQ-interne Referenzen

| Ref-ID | Entscheidung | Warum kein externer Standard | Beobachtbare Merkmale | Grenzen |
|--------|--------------|------------------------------|----------------------|---------|
| **RINQ-PRODUCT-DECISION-D4-SIDEQUEST** | D4 inactive/deprecated; Sidequest `numerical_situation`; Track D endet mit D3 | Produkt-/Didaktikentscheidung | Ereignisse opportunistisch erfassen | Keine Hockey-Empirie |
| **RINQ-MODEL-D4-STRUCTURE** | Struktur durchgehend/teilweise/nicht stabil erkennbar + Unklar | DEB/IIHF liefern kein 6v5-Strukturraster | Raumaufteilung, Abstände, Ebenen, Anschlussoptionen | Keine Systemkenntnis unterstellen |
| **RINQ-MODEL-D4-ACTION-PREPARATION** | Vorbereitung der Aktion statt Entscheidungsqualität | „panisch/geduldig“ nicht standardisiert | Sichtbare Anschlussoptionen vor der Aktion | Keine Absicht, keine Emotion, kein Outcome |
| **RINQ-MODEL-D4-PUCK-SECURITY** | Absicherung hinter dem Puck erkennbar/teilweise/nicht | Kein Empty-Net-Absicherungsstandard | Position hinter Puck, Befreiungsweg, freier Puck | Kein „einkalkuliert“; kein Ergebnisurteil |
| **RINQ-METHODOLOGY-OBSERVABLE-BEHAVIOR** | Nur beobachtbares Verhalten | Methodik RinQ | Sichtbare Merkmale | Keine Psychologie |
| **RINQ-DECISION-D4-REMOVE-TEAM-COMPOSURE** | Teamruhe / ruhig/angespannt/chaotisch entfernt | Nicht zuverlässig aus Video ableitbar | — | D4_D4 inaktiv/Legacy |

---

## Claim-Evidence-Matrix (Kurz)

| Claim | Quellen | Fit |
|-------|---------|-----|
| D4-C0 Sidequest | SRC-D4-02, RINQ-PRODUCT-DECISION-D4-SIDEQUEST, SRC-DEB-RRL-2020-S23, SRC-IIHF-RULEBOOK | Produkt + Regelrahmen |
| D4-C1 Struktur | SRC-DEB-RRL-2020-S23, IIHF Coaching Outlets/Offence, RINQ-MODEL-D4-STRUCTURE | Prinzipien ja, Raster RinQ |
| D4-C2 Vorbereitung | IIHF Outlets/Offence, RINQ-MODEL-D4-ACTION-PREPARATION | Prinzipien ja, Skala RinQ |
| D4-C3 Absicherung | IIHF Shooting Board, A1 Absichern, RINQ-MODEL-D4-PUCK-SECURITY | Prinzipien ja |
| D4-C4 Teamruhe entfernt | RINQ-DECISION-D4-REMOVE-TEAM-COMPOSURE, RINQ-METHODOLOGY | Methodik |

---

## Zusammenfassung

Offizielle Quellen stützen **Relevanz** und **Regel-/Terminologiesprache** des zusätzlichen Feldspielers. Die konkreten Beobachtungsraster sind **RinQ-Modelle** und keine DEB-/IIHF-Klassifikationen.

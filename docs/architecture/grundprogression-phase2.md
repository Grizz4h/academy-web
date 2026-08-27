# Grundprogression — Phase 2 (fachlich)

> Stand: 2026-08-27 (Rev. 5). **EINGEFROREN — fachliche Grundprogression.**  
> Fachliches Regelwerk für Geschwindigkeit, Dramaturgie und Tunability. **Kein Rewire / keine Implementierung durch diesen Freeze freigegeben.**  
> Verweist auf [progression-architecture-audit.md](./progression-architecture-audit.md).  
> **Exakte Slot-Schwellen festgelegt:** `2 / 4 / 10 / 24 / 48` (Rev. 5). Konkrete Cosmetic-IDs: [cosmetic-inventory-phase3.md](./cosmetic-inventory-phase3.md).  
> Erlaubt trotz Freeze: Cap 8 vs. 10 Sessions/Level, Core-Journey-Ende 25/50, Prestige-/Evergreen-Zahlen, Cosmetic-IDs und PUX-Bundles weiter tunen.

## Zweck & Abgrenzung

Dieses Dokument legt fest **wie schnell** und **mit welcher Dramaturgie** die Grundprogression spürbar sein soll — nicht konkrete Cosmetics (Inventory) und nicht die Code-Pipeline.

**Grundprogression** umfasst:

- Basis-XP und Basis-PUX pro **validem Progression Unit**
- Lifetime-Level (endlos) mit **gedeckelter** Kurve
- Abschließbare, versionierte Kapitel + Core Journey / Prestige / Evergreen
- Frühe Reward-Slots (ohne Artwork)
- Track-0-Onboarding (einmalig, dosiert)
- Persona-Simulation (isoliert + realistischer Einstieg)

**Nicht** Teil dieser Phase:

- Mastery / Serien / Challenges (eigene Specs; Regeln unten nur abgegrenzt)
- Cosmetics-Zuordnung zu Slots (Inventory)
- Anti-Farm-Implementierung (Spec nach Inventory)
- Umbenennung `period_checkin` → `mechanic_family_id`

---

## Gesamtmodell (Zielbild)

Vier getrennte, aber parallele Achsen:

| Achse | Rolle |
|---|---|
| **Lifetime-Level** | Endloser Status; jede valide Einheit treibt XP; nie Reset |
| **Core Journey** | Sorgfältig kuratierte frühe Kapitel (z. B. bis Level 25 oder 50) |
| **Prestige / Overtime** | Nach Core: wiederholbare Abschnitte ohne Fortschrittsverlust |
| **Versionierte Kapitel / saisonale Linien** | Neu ergänzbar; eigener Fortschritt; kein Reward-Regen für Veteranen |

```text
Account-Level: technisch unbegrenzt
Aktuell gestaltete Core-Kapitel: z. B. bis Level 50
Danach: Prestige-Zyklen + Evergreen-Meilensteine
Neue große Reward-Linien: eigene versionierte Kapitel (alle starten bei 0)
Saisonale Linien: getrennt vom Lifetime-Level
```

**Fairness-Regel:** Neue Nutzer müssen numerisch nicht zu Langzeit-Leveln aufschließen. Sie dürfen **funktional** nicht abgehängt sein (aktuelle Lerninhalte, Challenges, neue Cosmetics erreichbar).

**Anti-Regen:** Neue umfangreiche Rewards nicht nachträglich in vergangene Account-Level legen. Stattdessen neues Kapitel / neue Linie mit eigenem Fortschritt.

---

## Was belohnt wird — und was nicht

### Valide Progressionseinheit

```text
1 Drittel eines konkreten Spiels + 1 konkreter Drill = 1 valide Progressionseinheit

progression_unit_key =
  user_id + game_id + observation_scope(P1|P2|P3) + drill_id
```

| Situation | Grund-XP / Grund-PUX |
|---|---|
| Erste Session zu dieser Kombination | Ja (einmal) |
| Gleicher Drill, gleiches Spiel, gleiches Drittel, neue `session_id` | Nein |
| Gleicher Drill, anderes Drittel oder anderes Spiel | Ja |
| Anderer Drill, gleiches Drittel | Ja |
| Track 0 abgeschlossen | Einmaliges Bundle — **kein** wiederholbares Basis-XP/PUX |
| Bloßes Öffnen / Navigieren / Abbrechen | Nein |
| Session erneut speichern / editieren | Nein (Key schon vergeben) |
| Session löschen | Bereits vergebene Rewards bleiben |

XP und PUX teilen dieselbe Idempotenz (derselbe Dedup-Key).

### Basisreward (Startwert)

```text
1 valide Einheit = 100 XP + 10 PUX
```

Verhältnis zentral konfigurierbar. **Kein Cosmetic** pro Einheit — Cosmetics nur über definierte Meilenstein-Regeln. Keine harte Tages-/Wochenobergrenze.

### First-Drill-Bonus (Phase-2-Definition)

> Einmaliger kleiner Bonus (`+25 XP` Ist-Referenz) für den **erstmaligen Abschluss einer konkreten `drill_id`**.

Nicht in diesem Bonus:

- erstmaliger `drill_type`
- erstmalige Mechanikfamilie
- zusätzlicher PUX
- Track 0

Discovery / Mechanik-Mastery sind **eigene** spätere Bereiche — kein zweites „First“ auf demselben Grant.

### Neben der Einheit

- `full_game_completed`: kleiner Bonus / Achievement — kein Ersatz für drei Einheiten; Event serverseitig aus P1+P2+P3; Client kann es nicht direkt beanspruchen; historisches `FULL_GAME` = eine Unit, nicht rückwirkend drei
- Track-Abschluss: separater `track_completed`-Grant
- **Challenges:** Der Basisreward enthält **keinen** Challenge-Reward. Das Session-Event darf aber **separat** von einer aktiven Challenge ausgewertet werden (Challenge-Fortschritt ≠ Basispaket).

### Mastery (Abgrenzung, Spec später)

Exakt derselbe Kontext (`gleiche game_id + scope + drill_id`) erzeugt **keinen** Mastery-Fortschritt.

Sinnvolle Mastery-Quellen (Richtung):

- derselbe Drill in anderen Spielen/Dritteln
- dieselbe Mechanik in unterschiedlichen Drills
- dieselbe Mechanik über getrennte Spieltage

---

## Frühe Reward-Slots (verbindliche Dramaturgie)

„Früh dicht“ ist **verbindlich** über kumulierte, einmalige Unit-Meilensteine — ohne Level-Zwang. Konkrete Artwork-IDs: [cosmetic-inventory-phase3.md](./cosmetic-inventory-phase3.md).

| Fortschritt | Reward-Klasse |
|---:|---|
| Track 0 | Onboarding-Geschenk (kleines sichtbares Cosmetic) |
| **2** valide Einheiten | Common, **sichtbar** |
| **4** valide Einheiten | weiteres sichtbares Common |
| **10** valide Einheiten | starkes Common / erstes Uncommon |
| **24** valide Einheiten | Rare möglich |
| **48** valide Einheiten | einfacheres Epic möglich |
| später | stärkere Epics, Legendary, Mystic |

**Exakte Schwellen (festgelegt 2026-08-27):** `2 / 4 / 10 / 24 / 48`. Kein Bereichs-Interpreter im Code.

Orientierung bei ~4 Sessions/Woche:

| Units | Ca. Standarddauer | Klasse |
|---:|---:|---|
| 2 | ½ Woche | Common |
| 4 | 1 Woche | Common |
| 10 | 2½ Wochen | Uncommon |
| 24 | 6 Wochen | Rare |
| 48 | 12 Wochen | einfaches Epic |

**Produktziel:** Nach 2–4 Sessions soll der Locker bereits sichtbar anders aussehen. Level-5-Cosmetic als *erster* Cosmetic-Meilenstein ist **zu spät**.

### Sichtbarkeit der frühen Rewards (Cluster 1)

Für aktuelle Grundprogression / frühe Slots nur:

- Avatar, Banner, Emblem, Sticker, Frame, Titel, Tagline

**Nicht** für aktuelle Slots / Visual-QA der Grundprogression (Cluster 2 / 3D — deferred):

- Masken, Pucks, Sticks, 3D-Skins

Die ersten zwei **verdienten** Rewards sollen **nicht beide Texttitel** sein:

```text
Track 0: Frame oder kleines Starterelement
2 Units: Sticker oder Emblem
4 Units: Avatar oder Banner
10 Units: stärkeres Common/Uncommon
Titel: eher später oder für konkrete Leistungen (Achievement/Mastery)
```

Bestehende Backend-Verdrahtung (Titel bei 2/4) ist **Ist**, nicht Soll — nicht zum neuen Design erklären.

### Level-Up ≠ Cosmetic

Jeder Level-Up erzeugt sichtbares Feedback (Levelstand, Balken, ggf. kleines Bundle-Feedback).

Aber:

- nicht jeder Level-Up vergibt ein Cosmetic
- Basis-PUX kommen bereits pro Einheit
- zusätzliche Micro-PUX pro Level zunächst **deaktiviert** (Config später)
- Cosmetics nur an definierten Meilenstein-Slots

---

## Lifetime-Level-Kurve (Form, nicht finale Zahlen)

### Verworfen

Die Ist-Kurve `100 × n^1.35` ist für endloses Level **ungeeignet** (mathematische Explosion: Level 50 ≈ 20 Jahre bei Standard). Nur `base_xp` hochdrehen löst das nicht.

Dark-Souls-Skalierung (Gegner geben mehr, Soft Caps) passt nicht: eine Session bleibt dieselbe Lernleistung — keine XP-Inflation pro „Endgame“.

### Empfohlene Form: ansteigend, dann gedeckelt

Kosten pro Level steigen am Anfang und erreichen ein **festes Maximum** (Sessions/Einheiten pro Level).

**Platzhalter-Tabelle** (Einheiten ≈ Sessions bei 1:1 Basis-XP):

| Levelbereich | Einheiten pro Level |
|---|---:|
| 1 → 2 | 1 |
| 2 → 3 | 3 |
| 3 → 5 | 4 |
| 5 → 10 | 6 |
| 10 → 25 | 8 |
| ab 25 | 10 (Cap) |

Orientierung bei 4 Sessions/Woche (nur Basis, isoliert):

| Ziel | Ca. Einheiten gesamt | Standarddauer |
|---:|---:|---:|
| Level 5 | ~12 | ~3 Wochen |
| Level 10 | ~42 | ~2,5 Monate |
| Level 25 | ~162 | ~9–10 Monate |
| Level 50 | ~412 | ~2 Jahre |
| Level 100 | ~912 | ~4,4 Jahre |

Zahlen noch nicht final. **Kurvenform ist verbindlich:** Einstieg schnell → dann langsamer → stabiler Rhythmus, keine Explosion.

Praktisch: **abschnittsweise Tabelle** in Config (leichter zu simulieren/tunen als Formel). Optional äquivalent als Sättigung `C(L) = C_max - (C_max - C_min)·e^(-L/k)` — Implementierung bevorzugt Tabelle.

### Tunable Parameter

| Parameter | Wirkung |
|---|---|
| Abschnitts-Tabelle / Cap | Langzeit-Rhythmus |
| `base_xp` pro Einheit | Skaliert alles linear |
| Frühe Slot-Schwellen (2 / 4 / 10 / 24 / 48) | Cosmetic-Dramaturgie |
| Core-Journey-Ende | z. B. Level 25 oder 50 |

---

## Kapitel: abschließbar und erweiterbar

Jedes Kapitel ist **abgeschlossen und versioniert**. Neue Kapitel werden **angehängt**, kein unendliches Schlusskapitel.

```text
Kapitel 1: Level 1–10     (Platzhalter)
Kapitel 2: Level 11–25
Kapitel 3: Level 26–50
Kapitel 4: Level 51–75
Kapitel 5+: später ergänzbar
```

Zwischen neuen Kapiteln: weiterhin Level-Ups + kleine Evergreen-Rewards.

### Core Journey vs. Prestige

```text
Level 1–50 (o.ä.): Core Journey — kuratierte Rewards Common→…→einfaches Epic
danach: Prestige / Overtime I, II, … (z. B. 25–50 Level je Zyklus)
```

**Kein Reset:** Lifetime-XP, Cosmetics, Achievements, Curriculum bleiben. Prestige ist Präsentation/Klammer (z. B. „Prestige II, Rang 37“), kein New-Game-Plus-Reset.

Nach aktuellem Content-Frontier (z. B. Level 50): Level-Ups, kleine PUX, Evergreen alle N Level, Prestige-Anzeige — bis neue Kapitel/Linien live gehen.

---

## Track 0 — dosiert

**Verworfen:** Track-0-XP ≈ 2–4 Sessions (überspringt frühe Meilensteine / erstes verdientes Common).

**Ziel-Dramaturgie:**

```text
Track 0
→ einmaliges Level-2-Erlebnis (z. B. genau 1× base_xp / 100 XP bei Ist-base)
→ Starter-Reward (Onboarding-Geschenk)
→ kleiner PUX-Betrag
→ kein wiederholbares Basis-XP/PUX
```

Danach:

1. Onboarding — kleines Geschenk  
2. Erste reale Sessions — erstes **erarbeitetes** Common (Slot bei 2 Einheiten)  
3. Weitere Nutzung — Locker wächst sichtbar  

---

## Dramaturgie: früh dicht, später stabil

1. Track 0: spürbar, aber nicht spoilernd  
2. 2–4 Sessions: Locker sichtbar anders (verbindliche Slots)  
3. Core Journey: häufigere Highlights  
4. Ab Cap: planbarer Zeitwert pro Level; seltene Prestige-/Evergreen-Highlights  
5. Keine Tageslimits — Anti-Farm über Dedup  

---

## Persona-Simulation (zwei Läufe)

| Persona | Sessions/Woche |
|---|---:|
| Locker | 2 |
| Standard | 4 |
| Intensiv | 8–10 |

**Pflicht vor größeren Releases — zwei Simulationen:**

1. **Isolierte Grundprogression** — nur `base_xp` pro valider Einheit  
2. **Realistischer neuer Nutzer** — plus Track-0, First-`drill_id`-Boni, frühe Unit-Meilensteine, erwartbare Curriculum-Boni; später optional Achievements/Challenges  

Horizonte für beide: 2 / 4 / 8–10 Einheiten pro Woche × 4, 8, 16, 32, 52, 104, 208 Wochen.

Sonst: Kurve „4 Wochen“ kalibriert, Nutzer erreicht Meilenstein in 5 Tagen durch Boni.

---

## Anti-Farm-Invarianten (fachlich, Phase 2)

Technische Umsetzung folgt in Phase 4/5 — die Invarianten sind hier schon verbindlich:

- serverseitiger Dedup anhand `progression_unit_key`
- Reward-Regel zusätzlich idempotent (`user + unit_key + reward_rule_id`)
- Track 0 nur einmal pro Account
- strukturelle Validierung vor jedem Grant (siehe unten)
- kein erneuter Grant nach Editieren oder Neuanlegen derselben Einheit
- Session-Löschen entzieht keine bereits vergebenen Rewards
- keine clientseitig frei wählbaren XP-/PUX-Beträge
- auffällige Nutzung protokollieren
- **keine** Tageslimits und **keine** künstliche Mindestdauer

### Strukturelle Validierung der Progressionseinheit

Vor einem Grant muss **serverseitig** gelten:

```text
game_id vorhanden und zulässig
observation_scope exakt P1, P2 oder P3
  (FULL_GAME ist kein neuer Scope für Basis-Units;
   LESSON/Track 0 geht über track0_completed, nicht über Basis-Unit)
drill_id existiert im aktiven Curriculum
drill_id gehört zum angegebenen Modul/Track
Session besitzt die erforderlichen Abgaben
Session-Status ist COMPLETED
```

Sonst: **kein** Grant.

> Der Client meldet nur den Abschluss beziehungsweise das Event.  
> Die Höhe von XP und PUX wird aus einer **serverseitig erlaubten Reward-Regel** abgeleitet und **nicht** vom Client vorgegeben.

---

## Rückwirkungsregeln

Jede Reward-Regel besitzt explizit:

```text
retroactive: true | false
```

Fachlich verbindlich:

| Regel | |
|---|---|
| Bestehendes XP bleibt erhalten | immer |
| Bestehendes Account-Level bleibt erhalten | immer |
| Bestehender Cosmetic-Besitz bleibt erhalten | immer |
| Bestehende PUX bleiben erhalten | immer |
| Quantitative Erweiterung einer zuverlässig gemessenen **permanenten** Linie | darf `retroactive: true` sein |
| Neu eingeführtes Verhalten **ohne** historische Messdaten | `retroactive: false` |
| Saisonale / Event-Rewards | **niemals** rückwirkend |
| Neue Cosmetics an bereits durchlaufene Level hängen | **nein** (Anti-Regen; neue Linie / neues Kapitel) |

---

## UI-Abnahmekriterien

Nach Umsetzung muss sichtbar sein:

- Account-Level
- Lifetime-XP bzw. Levelbalken
- aktuelles Core-/Prestige-Kapitel
- Fortschritt zum nächsten Level
- nächster relevanter Reward-Slot
- nach jeder validen Session: XP und PUX
- gesonderte Anzeige von First-Drill- oder anderen Boni
- Level-up-Feedback
- Cosmetic-Unlock-Feedback
- Herkunft eines Cosmetics
- **progressive Offenlegung:** nur relevante nächste Ziele — nicht 300 gesperrte Rewards

---

## Automatisierte Abnahmetests (Pflicht)

Mindestens automatisiert prüfen (Phase 5 / CI):

- identischer Unit-Key zahlt nur einmal
- neue `session_id` umgeht Dedup nicht
- Editieren zahlt nicht erneut
- Löschen und Neuanlegen zahlt nicht erneut
- anderer Drill im selben Drittel zählt
- gleicher Drill in anderem Drittel zählt
- gleicher Drill in anderem Spiel zählt
- Track 0 zahlt einmal
- First-Drill-Bonus zahlt einmal pro `drill_id`
- ungültige `drill_id` erzeugt keinen Grant
- unvollständige Session erzeugt keinen Grant
- `full_game_completed` entsteht nur aus P1+P2+P3 desselben Spiels
- Levelkosten steigen nur bis zum definierten Cap
- jedes Kapitel besitzt ein Ende
- Prestige setzt nichts zurück
- bestehender Nutzerbesitz bleibt bei Migration erhalten
- Challenge-Fortschritt dupliziert das Basispaket nicht

---

## Tunability — Schrauben ohne Umbau

```text
progression.config
├── unit_rewards (base_xp, base_pux, first_drill_id_bonus_xp)
├── level_curve (piecewise table + cap)
├── unit_milestones[] (required_units → reward_slot_id)
├── early_reward_slots (2, 4, 10, 24, 48, …)
├── chapters[] (id, level_min, level_max, version, closed, milestone_slots)
├── core_journey_end_level
├── prestige (cycle_length, evergreen_every_n)
├── track0_bundle (xp ≈ 1 unit, starter_slot, pux)
├── level_up_micro_pux (default: off)
└── retroactivity_rules
```

Keine Werte in UI-Komponenten hardcoden.

---

## Abgrenzung zu anderen Bereichen

| Bereich | Beziehung |
|---|---|
| Legacy Medals / Drill-Tiers | Migration; kein paralleles Basis-XP |
| Achievements | Events — kein Ersatz für Einheiten-XP |
| Mastery | Nicht bei exakt gleichem Kontext; eigene Spec |
| Challenges | Session-Event kann Challenge voranbringen; Basispaket enthält keinen Challenge-Reward |
| Shop / Locker | Verbraucht PUX |
| Versionierte Kapitel / Saison | Eigener Fortschritt; parallel zu Lifetime-Level |
| Curriculum Tracks | `track_completed` separat; Units liefern Basis-XP |

---

## Review-Korrekturen

**Rev. 2 — erledigt im Text:** frühe Slots, gedeckelte Kurve, Kapitel mit Ende, Track 0 dosiert, zwei Sims, First-Drill=`drill_id`, Mastery-/Challenge-Abgrenzung, Gesamtmodell.

**Rev. 3 (2026-08-26):** Sichtbarkeit Cluster 1/2, erweiterte Slots, Level≠Cosmetic, Anti-Farm-Kern, Unit-Key/`user_id`.

**Rev. 4 (2026-08-26):** strukturelle Validierung; Rückwirkungsregeln; UI-Abnahme; automatisierte Pflichttests; Slot-Korridor-Hinweis vor Phase 5. **Formal eingefroren** (Christoph).

**Rev. 5 (2026-08-27):** Exakte Slot-Schwellen `2 / 4 / 10 / 24 / 48`. Konkrete Cosmetic-IDs in [cosmetic-inventory-phase3.md](./cosmetic-inventory-phase3.md) (Soll, kein Rewire).

## Noch offen zum Tuning (erlaubt trotz Freeze — keine Architekturänderung)

- Exakte Cap-Zahl (8 vs. 10 Einheiten/Level) und Abschnittsgrenzen  
- Core Journey endet bei 25 oder 50?  
- Prestige-Zykluslänge und Evergreen-Abstand  
- Konkrete Artwork-IDs pro Slot (Cosmetic-Phase — Visual-QA, dann Rewire)  

---

## Nächste Schritte

| Phase | Inhalt | Status |
|---|---|---|
| 1 | Architektur-Freeze | Erledigt — [Audit](./progression-architecture-audit.md) |
| **2** | **Fachliche Grundprogression** | **Rev. 5 — EINGEFROREN** (Schwellen exakt) |
| 3 | Inventory Legacy + Tank | Erledigt — [progression-inventory-phase3.md](./progression-inventory-phase3.md) |
| 4 | Migration + Anti-Farm Spec | Erledigt — [progression-migration-phase4.md](./progression-migration-phase4.md) |
| 5 | Implement + Tune | Offen — explizite Freigabe |
| 6 | Mastery / Serien / Challenges | Offen |
| 7 | Cosmetics-Zuordnung | Offen — [cosmetic-inventory-phase3.md](./cosmetic-inventory-phase3.md) |

---

## Referenzen

| Thema | Datei |
|---|---|
| Level-Kurve Ist (zu ersetzen) | [`frontend/src/features/progression/levelSystem.ts`](../../frontend/src/features/progression/levelSystem.ts) |
| XP-Regeln Ist | [`frontend/src/features/progression/xpRules.ts`](../../frontend/src/features/progression/xpRules.ts) |
| Architektur-Freeze | [`docs/architecture/progression-architecture-audit.md`](./progression-architecture-audit.md) |

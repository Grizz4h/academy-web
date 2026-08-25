# Grundprogression — Phase 2 (fachlich)

> Stand: 2026-08-25 (Rev. 2). **EINGEFROREN** (Christoph).  
> Fachliches Regelwerk für Geschwindigkeit, Dramaturgie und Tunability. **Keine Implementierung in dieser Phase.**  
> Verweist auf [progression-architecture-audit.md](./progression-architecture-audit.md).  
> Zahlen/Abschnitte bleiben Platzhalter zum Tuning — **Kurvenform, frühe Slots, Kapitelmodell, Track-0-Dosierung, Gesamtmodell** sind verbindlich.

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
progression_unit_key = game_id + observation_scope(P1|P2|P3) + drill_id
```

| Situation | Grund-XP / Grund-PUX |
|---|---|
| Erste Session zu dieser Kombination | Ja (einmal) |
| Gleicher Drill, gleiches Spiel, gleiches Drittel, neue session_id | Nein |
| Gleicher Drill, anderes Drittel oder anderes Spiel | Ja |
| Anderer Drill, gleiches Drittel | Ja |
| Track 0 abgeschlossen | Einmaliges Bundle — **kein** wiederholbares Basis-XP/PUX |
| Bloßes Öffnen / Navigieren | Nein |

XP und PUX teilen dieselbe Idempotenz.

### First-Drill-Bonus (Phase-2-Definition)

> Einmaliger kleiner Bonus (`+25 XP` Ist-Referenz) für den **erstmaligen Abschluss einer konkreten `drill_id`**.

Nicht in diesem Bonus:

- erstmaliger `drill_type`
- erstmalige Mechanikfamilie

Discovery / Mechanik-Mastery sind **eigene** spätere Bereiche — kein zweites „First“ auf demselben Grant.

### Neben der Einheit

- `full_game_completed`: kleiner Bonus / Achievement — kein Ersatz für drei Einheiten
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

„Früh dicht“ ist **verbindlich** über Slots — ohne konkretes Artwork:

| Fortschritt | Reward-Slot |
|---:|---|
| Track 0 | Starter-/Onboarding-Reward (kleines Geschenk) |
| **2** valide Einheiten | erstes **verdientes** Common-Cosmetic |
| **4** valide Einheiten | weiterer Common-Slot |
| **8–12** valide Einheiten | stärkerer Common oder erstes Uncommon |
| später | Rare, einfaches Epic, … |

Grenzen dürfen noch ± verschoben werden. Die Slot-Dramaturgie selbst ist Phase-2-Pflicht — nicht nur Absicht.

**Produktziel:** Nach 2–4 Sessions soll der Locker bereits sichtbar anders aussehen. Level-5-Cosmetic als *erster* Cosmetic-Meilenstein ist **zu spät** (~14 Einheiten / ~4 Wochen Standard).

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
| Frühe Slot-Schwellen (2 / 4 / 8–12) | Cosmetic-Dramaturgie |
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
2. **Realistischer neuer Nutzer** — plus Track-0, First-`drill_id`-Boni, Track-Abschluss; später optional Achievements/Challenges  

Sonst: Kurve „4 Wochen“ kalibriert, Nutzer erreicht Meilenstein in 5 Tagen durch Boni.

---

## Tunability — Schrauben ohne Umbau

```text
progression.config
├── unit_rewards (base_xp, base_pux, first_drill_id_bonus_xp)
├── level_curve (piecewise table + cap)
├── early_reward_slots (2, 4, 8–12, …)
├── chapters[] (id, level_min, level_max, version, closed)
├── core_journey_end_level
├── prestige (cycle_length, evergreen_every_n)
└── track0_bundle (xp ≈ 1 unit, starter_slot, pux)
```

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

## Review-Korrekturen (Rev. 2) — erledigt im Text

1. Frühe Common-Slots nach 2–4 Sessions verbindlich  
2. Levelkurve: gedeckelt / abschnittsweise — `n^1.35` verworfen  
3. Kapitel immer abschließbar; kein `51+`-Endloskapitel  
4. Track 0 dosiert (~Level 2), nicht 2–4 Session-Äquivalent  
5. Zwei Simulationsläufe  
6. First Drill = konkrete `drill_id`  
7. Mastery nicht bei exakt gleichem Kontext  
8. Challenge-Formulierung geklärt  
9. Gesamtmodell Lifetime + Core + Prestige + versionierte Kapitel + Saison  

## Noch offen zum Tuning (nicht Freeze-Blocker)

- Exakte Cap-Zahl (8 vs. 10 Einheiten/Level) und Abschnittsgrenzen  
- Core Journey endet bei 25 oder 50?  
- Exakte Slot-Schwellen 2 / 4 / 8–12 finalisieren nach Inventory  
- Prestige-Zykluslänge und Evergreen-Abstand  

---

## Nächste Schritte

| Phase | Inhalt | Status |
|---|---|---|
| 1 | Architektur-Freeze | Erledigt — [Audit](./progression-architecture-audit.md) |
| **2** | **Fachliche Grundprogression** | **Rev. 2 — EINGEFROREN** |
| 3 | Inventory Legacy + Tank | Erledigt — [progression-inventory-phase3.md](./progression-inventory-phase3.md) |
| 4 | Migration + Anti-Farm Spec | Erledigt — [progression-migration-phase4.md](./progression-migration-phase4.md) |
| 5 | Implement + Tune | Offen — explizite Freigabe |
| 6 | Mastery / Serien / Challenges | Offen |
| 7 | Cosmetics-Zuordnung | Offen |

---

## Referenzen

| Thema | Datei |
|---|---|
| Level-Kurve Ist (zu ersetzen) | [`frontend/src/features/progression/levelSystem.ts`](../../frontend/src/features/progression/levelSystem.ts) |
| XP-Regeln Ist | [`frontend/src/features/progression/xpRules.ts`](../../frontend/src/features/progression/xpRules.ts) |
| Architektur-Freeze | [`docs/architecture/progression-architecture-audit.md`](./progression-architecture-audit.md) |

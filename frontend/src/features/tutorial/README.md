# Tutorial-System

Geführtes Produkt-Onboarding für RINK Tank. **Tutorial = Wie benutze ich die App.** Hockey-Grundlagen bleiben Track 0 / Academy.

Wenn kein Tutorial aktiv ist, ändert sich das App-Verhalten nicht. Targets sind nur Attribute.

## Audit (Stand der App)

1. **Hauptbereiche:** Start `/`, Akademie `/curriculum`, Session Setup `/setup/:moduleId`, Session `/session/:id`, Verlauf `/history`, Locker `/locker`, Account `/account`, Stats `/progress`, Szenenpool `/ringabout`.
2. **Echter First-User-Flow:** Login auf Start → optional Hockey-Erfahrung → Nächster-Schritt-Karte → Akademie → Modul Starten → Setup → Session.
3. **Hängenbleiber:** Akademie heißt im Nav „Akademie“, Route ist `/curriculum`. Session Setup für Live-Drills verlangt Liga/Spiel. Foundation Track 0 braucht das nicht.
4. **Tutorial-notwendig:** Start, Akademie, ein Einsteiger-Setup, aktive Session, Verlauf, Locker. Nicht: Lab, Observation, Stats-Filter, Scene-Editorial, KI-Reflexion.
5. **Wiederverwenden:** `UiButton`, bestehendes Profil (`dashboardPreferences`), Foundation-Empfehlung, Nav-Tabs.
6. **Architektur:** Eigene kleine Engine. Keine Joyride-Library. `@floating-ui/react` nur für Desktop-Coachmark-Position.

## So teste ich schnell

Dev-Modus (`isDevNavEnabled`): unten rechts erscheint das **Tutorial-Dev-Panel**.

| Button | Wirkung |
|--------|---------|
| **Neues Profil** | Tutorial zurück auf `not_started`, öffnet den **Willkommens-Screen** (auch wenn schon Sessions existieren) |
| Restart | Tutorial-Flow ab Step 1 aktiv |
| Reset | Progress leeren, kein erzwungenes Welcome |
| Prev / Next | Steps springen |

Ohne Dev-Button wäre Welcome nur bei wirklich neuem Account (0 Sessions + `not_started`) sichtbar.

## So füge ich ein Feature ins Tutorial ein

1. Stabile `data-tutorial-id` am echten UI-Element setzen (`TUTORIAL_TARGET` in `ids.ts`).
2. Step in `config/mainOnboarding.ts` ergänzen (eine Aussage, eine Aktion).
3. `route` festlegen (`/path` oder `/path/*`).
4. Optional `action` (`acknowledge` / `click` / `route`) und `when.feature`.
5. Mobile prüfen (Coachmark ist unter 769px ein Bottom-Sheet).
6. `version` nur erhöhen, wenn der Flow fachlich neu ist — alte Completions bleiben gültig.

Neue Tutorials später: Definition in `registry.ts` registrieren (`academy_tutorial`, `locker_tutorial`, …). MVP nutzt nur `main_onboarding`.

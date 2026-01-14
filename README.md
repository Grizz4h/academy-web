# PORT-KONFIGURATION (bitte IMMER beachten!)
# Backend (uvicorn/FastAPI): Port 8000
# Frontend (Dev/Build): Port 5174
# Produktiv-Frontend: dist/ über nginx/Caddy, Subdomain (z.B. https://academy.highspeed-novadelta.de)
# API-URL im Build: https://academy.highspeed-novadelta.de/api
# Niemals Ports im Code ändern, außer explizit gewünscht!

# Academy Web (separate repo scaffold)

## Zweck
Eigenständige Academy-App (React/HTML) als Subdomain, getrennt von MatchHub/Streamlit. Dieses Verzeichnis kannst du nach /opt/academy-web kopieren und als eigenes Git-Repo initialisieren.

## Inhalt aus MatchHub übernommen
- Vollständige Curriculum-Definition: `data/academy/curriculum.json` (Tracks A–F, 30 Module, zwei Drills A1_D1 period_checkin & A1_Q1 micro_quiz als Beispiele)

## Empfohlene Architektur
- Frontend: Vite + React + React Query (oder Next.js falls SSR/SEO gewünscht)
- UI: Tailwind oder MUI, frei wählbar
- Backend/API (leichtgewichtig): FastAPI (Python) oder Express (Node), JSON-API
- Storage (Phase 1): weiter JSON-Files nutzen (`data/academy/sessions`, `data/academy/curriculum.json`) per API gekapselt
- Storage (Phase 2): SQLite/Postgres migrieren, API bleibt gleich
- Auth: einfacher JWT/Cookie, entkoppelt von Streamlit

## Ziel-Routen (Frontend)
- Dashboard (Übersicht & Progress)
- Session (Phasen/Drills/Checkins)
- History (Sessions filtern, Details je Session)
- Progress (Module/Tracks Fortschritt)
- Glossary (Wiki/Terms)

## API-Skizze (JSON)
- GET /api/curriculum
- GET /api/sessions?user=…&module=…&state=…
- POST /api/sessions (neue Session anlegen)
- GET /api/sessions/{id}
- POST /api/sessions/{id}/checkins (Phase/Answers/Feedback/Nächste Aufgabe)
- POST /api/sessions/{id}/post (Summary/Unklar/Next Module/Helpfulness; state=done)

## Deployment-Idee (self-host)
- Docker-Compose: frontend (Vite build → static), backend (FastAPI), reverse proxy (Nginx/Traefik)
- Subdomain academy.<deinedomain> → Proxy → frontend (und /api → backend)
- Let’s Encrypt via Proxy

## Nutzung als eigenes Repo
1) Kopiere diesen Ordner aus /opt/matchhub nach /opt/academy-web
2) `cd /opt/academy-web`
3) `git init`
4) `git add . && git commit -m "init academy web"`
5) Remote setzen: `git remote add origin <dein-remote>`
6) `git push -u origin main`

## Häufige Probleme und Lösungen

### Backend startet nicht: NameError: name 'app' is not defined
**Symptom:** Beim Start von uvicorn/backend.main:app kommt sofort ein NameError, obwohl die Imports korrekt aussehen.

**Ursache:** FastAPI-Dekoratoren (@app.post, @app.get, etc.) werden verwendet, bevor `app = FastAPI()` definiert ist. Das passiert, wenn Routen-Dekoratoren vor der app-Definition stehen.

**Lösung:**
1. Stelle sicher, dass in `backend/main.py` ganz oben (nach Imports, vor allen @app...-Dekoratoren) steht:
   ```python
   from fastapi import FastAPI
   app = FastAPI()
   ```
2. Alle Routen-Dekoratoren (@app.post, @app.get, etc.) müssen NACH dieser Definition stehen.
3. Wenn du APIRouter verwendest: Routen mit @router.post dekorieren und am Ende `app.include_router(router)` aufrufen.

**Prüfung:** Schaue die ersten 40 Zeilen von `backend/main.py` an. Wenn @app... vor `app = FastAPI()` steht, ist das der Fehler.

### Frontend starten: Immer build verwenden, nicht dev
Für Produktion oder Tests: Immer `npm run build` im frontend-Ordner ausführen, dann `npm run preview` oder das gebaute dist/ über Server servieren. Dev-Modus (`npm run dev`) nur für Entwicklung.

## Nächste Schritte (wenn du startest)
- `npm create vite@latest` (oder `npx create-next-app`) im Frontend-Ordner anlegen
- API-Ordner mit FastAPI/Express erstellen, Endpunkte gemäß Skizze
- Datenpfad `data/academy` als Volume in den API-Container mounten (für JSON-Phase)
- CI/Build-Skript (npm run build) und docker-compose ergänzen

Viel Erfolg! Dies ist nur das Grundgerüst + Curriculum, damit du direkt loslegen und ein eigenes Repo daraus machen kannst.

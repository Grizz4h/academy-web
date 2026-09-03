# Frontend build & typecheck (ops)

## Ist-Stand (2026-09-04)

| Absicherung | Status |
|-------------|--------|
| GitHub Actions Typecheck | ja — [`.github/workflows/frontend-ci.yml`](../../.github/workflows/frontend-ci.yml) |
| GitHub Actions Vite-Build | ja — nach erfolgreichem Typecheck |
| Deploy auf dem Hetzner-Host | **manuell** (`npm run build` → `dist/` → Nginx) |
| Automatischer Deploy aus CI | nein |

Es gibt **kein** anderes CI (kein GitLab, kein lokaler pre-push-Hook Pflicht).

## Deine Regel

**Deploy nur, wenn Typecheck grün war** (CI auf `main` / PR, oder lokal einmal `npm run typecheck`).

Vite allein (`build:app`) prüft keine Typen. Deshalb: CI Typecheck = Sicherheitsnetz.

## Befehle

```bash
# Typen (schwer, braucht RAM — auf dem kleinen Server besser einzeln / in CI)
cd frontend && npm run typecheck

# Nur Bundle (leichter; gut auf dem 4‑GB-Host)
cd frontend && npm run build:app

# Klassisch: Typecheck + Bundle hintereinander (kann den Host knicken, wenn Cursor parallel läuft)
cd frontend && npm run build
```

## Deploy-Checkliste (Host)

1. CI auf dem Merge/Push grün? (Typecheck + Build)  
2. Auf dem Server: `cd /opt/academy-web/frontend && npm run build:app`  
   - Wenn du sicher sein willst und RAM frei ist: stattdessen `npm run build`  
3. `dist/` wie gewohnt ausliefern (Nginx)  
4. Smoke: Seite laden, Login, eine Session-Route

## Warum CI und Host getrennt?

Der Hetzner-Kasten hat ~3,7 GB RAM und **keinen Swap**. Cursor hält schon ~1,5 GB (`tsserver` + Extension Host). Ein zweites `tsc` + Vite parallel kann den Host umwerfen. GitHub Runner haben genug RAM — Typecheck gehört dorthin.

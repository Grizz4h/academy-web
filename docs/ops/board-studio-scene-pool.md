# rInQ Board Studio → Scene Pool

Desktop-Client (Tauri) liest denselben Scene Pool wie die Tank-SPA.

```text
Board Studio
  → CORS-authorized client (explicit Origin allow-list)
  → Bearer-authenticated FastAPI
  → GET /api/scenes
  → server-side ownership filter (scene.user == rinq_user_id)
```

**CORS authorization ≠ user authentication.** An allowed Origin may send the request; without a valid Bearer token the API still returns 401.

## Origins

| Client | Origin | Status |
|--------|--------|--------|
| Tank SPA (production) | same-origin `https://rinq-tank.de` | no CORS needed (Nginx) |
| Tank Vite | `http://localhost:5173` / `5174` / `5175` | listed |
| Board Studio Tauri **dev** | `http://localhost:1420` | listed (observed) |
| Board Studio Tauri **packaged** | unknown | `TAURI_PRODUCTION_ORIGIN_REQUIRES_VERIFICATION` |

This repo has no Tauri/`tauri.conf` for Board Studio. Do not guess a production custom-protocol origin.

## Auth (unchanged)

`GET /api/scenes` uses `Depends(get_current_user)`. Header: `Authorization: Bearer …` (Supabase access token or legacy academy JWT). Ownership is still `_owners_match`.

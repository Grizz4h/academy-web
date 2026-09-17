# Nginx: serve avatar uploads from FastAPI

The Academy SPA vhost currently proxies only `/api/` to the backend.
Avatar files are stored under FastAPI's `/uploads/...` mount, so Nginx must
forward that path as well — otherwise `try_files` serves `index.html`.

Add this **before** the SPA `location /` block in the Academy server config
(e.g. `/etc/nginx/sites-enabled/academy.conf`):

```nginx
    # Avatar / account uploads (FastAPI StaticFiles mount)
    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

This change is **outside the repository** (server Nginx config).
Do the same when adding the future `rinq-tank.de` vhost.

## Club logos (`/teams/`)

Vereinswappen liegen **nicht** in `frontend/dist`. Nginx must not serve leftover `/teams/*.png`.

Add **before** the SPA `location /` and before any `js|css|svg|png` cache regex:

```nginx
    # Club marks — 404. Files: GET /api/team-logos/{league}?file= (cleared IDs public, else creator)
    location ^~ /teams/ {
        return 404;
    }
```

If `/api/` is a normal prefix (not `^~`), the `js|css|svg|png` cache regex steals URLs that end in those extensions. Keep club-logo fetches as query `?file=` or change the API location to `location ^~ /api/`.

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

# Phase 2 — Parallel domain `rinq-tank.de`

**Status:** prepared only. No root apply, no Certbot, no 301 redirect.

## Goal

| Host | Role |
|------|------|
| `academy.highspeed-novadelta.de` | keep fully working |
| `rinq-tank.de` | same app, parallel |
| `www.rinq-tank.de` | same app, parallel |

No OAuth / Payment / Paywall in this step.

## Architecture (unchanged)

```text
Internet → Nginx → frontend/dist
                 → /api/     → 127.0.0.1:8000
                 → /uploads/ → 127.0.0.1:8000
```

## 1. Current Nginx structure

Active sites include `academy.conf`, `matchhub`, `pitch-tank`, `mogi`, `default`.

`academy.conf` today:

- `server_name academy.highspeed-novadelta.de`
- `root /opt/academy-web/frontend/dist`
- SPA: `try_files $uri $uri/ /index.html`
- `location ^~ /uploads/` → `http://127.0.0.1:8000/uploads/`
- `location /api/` → `http://127.0.0.1:8000/api/`
- Asset cache regex for js/css/images
- HTTPS via Certbot (`/etc/letsencrypt/live/academy.highspeed-novadelta.de/`)
- Port 80 Certbot redirect block for academy only

## 2. Proposed change

**New separate vhost** (does not edit `academy.conf`):

- Template: `docs/ops/rinq-tank.de.nginx.conf`
- Install script: `docs/ops/apply-rinq-domain.sh`
- Target: `/etc/nginx/sites-available/rinq-tank.de` + enable symlink
- Same `root`, `/api/`, `/uploads/`, SPA fallback
- Initially **HTTP only** so Certbot can issue certs without touching the academy certificate

## 3. IONOS DNS (set manually — not by Cursor)

Server public IPv4 (this host): **`188.34.196.189`**

Current resolution (as of prep):

| Name | Current |
|------|---------|
| `academy.highspeed-novadelta.de` | `188.34.196.189` (correct) |
| `rinq-tank.de` | `217.160.0.93` (IONOS parking — must change) |
| `www.rinq-tank.de` | (no A/CNAME) |

Set at IONOS:

| Typ | Hostname | Ziel |
|-----|----------|------|
| **A** | `@` (rinq-tank.de) | `188.34.196.189` |
| **A** | `www` | `188.34.196.189` |

Alternative for www (also fine):

| Typ | Hostname | Ziel |
|-----|----------|------|
| **CNAME** | `www` | `rinq-tank.de` |

Wait until:

```bash
dig +short rinq-tank.de A
dig +short www.rinq-tank.de A
# both should show 188.34.196.189
```

## 4. Root steps / script

After DNS is correct:

```bash
sudo bash /opt/academy-web/docs/ops/apply-rinq-domain.sh
```

Script behavior:

- Backs up `academy.conf` + previous rinq file under `/root/nginx-backups/…`
- Installs new vhost from repo template
- Enables site symlink
- Runs `nginx -t`; **no reload on failure**; rolls back enable link
- Reloads nginx only on success
- Does **not** call Certbot

Then HTTPS:

```bash
sudo certbot --nginx -d rinq-tank.de -d www.rinq-tank.de
```

This must use a **new** certificate line under `/etc/letsencrypt/live/rinq-tank.de/` (or similar). Do not replace the academy live directory.

## 5. HTTPS / Certbot procedure

1. DNS → `188.34.196.189` for `@` and `www`
2. Apply HTTP vhost (`apply-rinq-domain.sh`)
3. `curl -I http://rinq-tank.de/` should hit this Nginx (not IONOS parking)
4. `sudo certbot --nginx -d rinq-tank.de -d www.rinq-tank.de`
5. Verify HTTPS on both hosts; re-check academy HTTPS still works

Certbot version on server: `2.9.0` (`/usr/bin/certbot`).

## 6. Domain hardcodings in repo

| Location | Action |
|----------|--------|
| `frontend/src/api.ts` `resolveApiBase()` → `${origin}/api` | **No change** — works for any host |
| `backend/main.py` CORS | Dev localhost/IP only; **not required** for same-origin SPA via Nginx |
| README / A1–A3 guides / comments | Docs only — optional later |
| `docs/ops/*` academy URLs | Ops examples — fine |

**Planned production origin for future OAuth (not implemented now):**

```text
https://rinq-tank.de
```

Also allow `https://www.rinq-tank.de` as redirect/alias origin when configuring Google/Apple later. Prefer primary canonical `https://rinq-tank.de`.

## 7. Tests after cutover

```bash
# Academy still OK
curl -sI https://academy.highspeed-novadelta.de/ | head -5
curl -s http://127.0.0.1:8000/api/health
curl -sI https://academy.highspeed-novadelta.de/uploads/avatars/christoph_f270ea7f.jpg | head -5

# New domain HTTP (pre-cert) / HTTPS (post-cert)
curl -sI http://rinq-tank.de/ | head -5
curl -sI http://www.rinq-tank.de/ | head -5
curl -sI https://rinq-tank.de/ | head -5
curl -sI https://www.rinq-tank.de/ | head -5
curl -s https://rinq-tank.de/api/health
curl -sI https://rinq-tank.de/uploads/avatars/christoph_f270ea7f.jpg | head -5

# Browser: login on rinq-tank.de, confirm sessions load (same backend/user store)
# Confirm NO 301 from academy → rinq
curl -sI https://academy.highspeed-novadelta.de/ | rg -i 'HTTP/|location'
```

## Explicitly not in this phase

- No `301` academy → rinq
- No OAuth / Apple / Stripe / Paywall
- No firewall changes
- No second backend or second `dist/` tree

# Security headers + dependency audit (C8)

**Goal:** Baseline HTTPS response headers on `rinq-tank.de` + recorded dependency audit.

**Status (2026-08-27):** Snippet prepared in repo. Live nginx still only sends `Cache-Control` — root apply pending.  
`npm audit` (prod): react-router high → fix later with `npm audit fix` + smoke test.  
`pip-audit` (requirements.txt): no known vulns.

## What Cursor prepared

- Snippet: [`snippets/academy-security-headers.conf`](snippets/academy-security-headers.conf)
- Headers: HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- **Not yet:** Content-Security-Policy (would break Stripe/Supabase/Google without careful allowlist)

## What you do as root (≈5 Min)

### 1. Snippet installieren

```bash
sudo mkdir -p /etc/nginx/snippets
sudo cp /opt/academy-web/docs/ops/snippets/academy-security-headers.conf \
  /etc/nginx/snippets/academy-security-headers.conf
```

### 2. Vhost anpassen

Datei: `/etc/nginx/sites-available/rinq-tank.de`

Im **HTTPS-`server`-Block** (dem mit `listen 443 ssl`):

1. Direkt nach den Certbot-SSL-Zeilen:

```nginx
    include /etc/nginx/snippets/academy-security-headers.conf;
```

2. In **jedem** `location`, das schon `add_header` hat (`/` und Assets), **vor** dem vorhandenen `add_header` dieselbe Include-Zeile wiederholen — sonst überschreibt nginx die Server-Header.

Beispiel `location /`:

```nginx
    location / {
        try_files $uri $uri/ /index.html;
        include /etc/nginx/snippets/academy-security-headers.conf;
        add_header Cache-Control "no-cache" always;
    }
```

Beispiel Assets (nur **content-hashed** `/assets/` — nicht `/profile/*.svg`):

```nginx
    location ^~ /assets/ {
        try_files $uri =404;
        expires 7d;
        include /etc/nginx/snippets/academy-security-headers.conf;
        add_header Cache-Control "public, max-age=604800, immutable" always;
    }

    location ^~ /profile/ {
        try_files $uri =404;
        include /etc/nginx/snippets/academy-security-headers.conf;
        add_header Cache-Control "public, max-age=0, must-revalidate" always;
    }
```

Referenz-Vhost: [`rinq-tank.de.nginx.conf`](rinq-tank.de.nginx.conf). **Nicht** alle `.svg` unter `immutable` legen — fehlende Profile-Assets wurden sonst 7 Tage als 404 gecacht.

Optional dasselbe für `academy.conf` (academy.highspeed-novadelta.de).

### 3. Testen & laden

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Verifizieren

```bash
curl -sI https://rinq-tank.de/ | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy'
```

Erwartung: alle fünf Header sichtbar.

### 5. Kurz-Smoke

Browser: Login (Google/OTP), Premium-Checkout-Sheet öffnen, `/api/me` lädt — nichts kaputt.

## Dependency audit (bereits gelaufen)

| Stack | Ergebnis | Next |
|-------|----------|------|
| Frontend `npm audit --omit=dev` | **2 high** (`react-router` / `react-router-dom`) | Später: `cd frontend && npm audit fix`, Build + Smoke |
| Backend `pip-audit -r requirements.txt` | **clean** | — |

CSP und `npm audit fix` sind Follow-ups, nicht Blocker für „Headers live“.

## Done-Kriterium für Board C8 → PARTIAL/GO

- [ ] Headers auf `https://rinq-tank.de/` sichtbar
- [ ] Smoke Login/Checkout OK
- [ ] Audit-Ergebnis notiert (dieses Doc reicht)

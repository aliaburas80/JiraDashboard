# Delivery Clarity — Deployment Guide

**Version:** 4.1  
**Author:** Ali Abu Ras  
**Date:** 2026-06-04  
**Status:** Current

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Option A — Docker (Recommended for Production)](#4-option-a--docker-recommended-for-production)
5. [Option B — VPS / Bare Metal (Manual)](#5-option-b--vps--bare-metal-manual)
6. [Option C — Vercel (Preview / Demo only)](#6-option-c--vercel-preview--demo-only)
7. [Reverse Proxy with nginx](#7-reverse-proxy-with-nginx)
8. [SSL / HTTPS with Let's Encrypt](#8-ssl--https-with-lets-encrypt)
9. [First Login & Post-Deploy Checklist](#9-first-login--post-deploy-checklist)
10. [Updating the App](#10-updating-the-app)
11. [Backup & Restore](#11-backup--restore)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Overview

Delivery Clarity is a **Next.js 14** application using:
- **SQLite** via Prisma for authentication and import logs
- **iron-session** for encrypted cookie sessions
- **localStorage** for dashboard data (no cloud sync)
- **bcryptjs** for password hashing

### Deployment targets

| Target | Use case | Auth persistence | Recommended |
|--------|----------|-----------------|-------------|
| **Docker** | Self-hosted production | ✅ Yes (volume mount) | ✅ Yes |
| **VPS / bare metal** | Self-hosted production | ✅ Yes | ✅ Yes |
| **Vercel** | Demo / preview / staging | ⚠️ Ephemeral (no SQLite) | ❌ Not for production auth |

> **Why not Vercel for production?** Vercel's serverless functions have no persistent filesystem. SQLite data is lost between cold starts. Vercel works for the CSV upload → dashboard flow (localStorage-only) but auth sessions and import logs will not persist.

---

## 2. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | LTS recommended |
| npm | 10+ | Bundled with Node 20 |
| Git | Any | For cloning |
| Docker + Docker Compose | 24+ / v2+ | Option A only |
| Ubuntu/Debian or compatible | 20.04+ | Option B only |

---

## 3. Environment Variables Reference

Copy `.env.example` to `.env` (local) or `.env.local` (Next.js convention). All variables below must be set for production.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_SECRET` | **Yes** | `change-me` | Cookie signing key — **must be ≥ 32 random characters**. Generate with: `openssl rand -hex 32` |
| `SESSION_TTL_HOURS` | No | `8` | Session lifetime in hours |
| `DATABASE_URL` | **Yes** | `file:./data/delivery_clarity.db` | SQLite file path. Use an absolute path in production |
| `ALLOW_OPEN_REGISTRATION` | No | `false` | `true` = anyone can register. `false` = admin creates users only |
| `NEXT_PUBLIC_ALLOW_REGISTER` | No | `false` | Must match `ALLOW_OPEN_REGISTRATION` — controls the UI link on the login page |
| `ADMIN_EMAIL` | Yes (first run) | `admin@deliveryclarity.com` | Email for the seed admin account |
| `ADMIN_PASSWORD` | Yes (first run) | `Admin@DC2025` | Seed admin password — **change immediately after first login** |
| `ADMIN_NAME` | No | `Administrator` | Display name for seed admin |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public URL — used in generated links |
| `PORT` | No | `3000` | HTTP port the app listens on |

### Generate a strong SESSION_SECRET

```bash
openssl rand -hex 32
# Example output: a3f8c2e1d4b7a9f0e2c5d8a1b4e7f0c3a6d9b2e5f8c1a4d7b0e3f6c9a2d5b8
```

---

## 4. Option A — Docker (Recommended for Production)

The repository includes a production-ready multi-stage `Dockerfile` and `docker-compose.yml`.

### 4.1 Quick start

```bash
# 1. Clone the repo
git clone https://github.com/aliaburas80/JiraDashboard.git delivery-clarity
cd delivery-clarity

# 2. Create your environment file
cp .env.example .env

# 3. Edit .env — set SESSION_SECRET and ADMIN_PASSWORD at minimum
nano .env

# 4. Build and start
docker compose up -d --build

# 5. Verify it's running
docker compose logs -f delivery-clarity
```

The app will be available at `http://localhost:3000` (or `http://your-server-ip:3000`).

### 4.2 What the Dockerfile does

The multi-stage build produces a minimal production image:

| Stage | Base image | Purpose |
|-------|-----------|---------|
| `deps` | `node:20-alpine` | Install production dependencies only |
| `builder` | `node:20-alpine` | Generate Prisma client + `npm run build` |
| `runner` | `node:20-alpine` | Minimal runtime — only Next.js standalone output |

- Runs as a **non-root user** (`nextjs`, uid 1001) for security
- Exposes port `3000`
- On startup: runs `prisma migrate deploy` then starts `node server.js`

### 4.3 Data persistence

The `docker-compose.yml` mounts a named Docker volume (`delivery_data`) to `/app/data` inside the container. The SQLite database file lives at `/app/data/delivery_clarity.db`.

```yaml
volumes:
  - delivery_data:/app/data
```

**Do not remove this volume** — it contains all user accounts and import logs.

### 4.4 Healthcheck

The compose file includes a healthcheck at `GET /api/health` every 30 seconds with a 60-second startup grace period. View status:

```bash
docker compose ps
```

### 4.5 Useful Docker commands

```bash
# Stop
docker compose down

# Restart (pick up .env changes)
docker compose down && docker compose up -d

# View logs
docker compose logs -f

# Shell into the container
docker compose exec delivery-clarity sh

# Check database
docker compose exec delivery-clarity sh -c "ls -lh /app/data/"

# Pull latest image and rebuild
git pull && docker compose up -d --build
```

---

## 5. Option B — VPS / Bare Metal (Manual)

Use this when you want full control over the server, or when Docker is not available.

### 5.1 Prepare the server (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v20.x.x
npm --version    # 10.x.x

# Install PM2 (process manager)
sudo npm install -g pm2

# Install git
sudo apt install -y git
```

### 5.2 Clone and configure

```bash
# Clone
git clone https://github.com/aliaburas80/JiraDashboard.git /opt/delivery-clarity
cd /opt/delivery-clarity

# Create env file
cp .env.example .env.local
nano .env.local
# → Set SESSION_SECRET (openssl rand -hex 32)
# → Set DATABASE_URL=file:/opt/delivery-clarity/data/delivery_clarity.db
# → Set ADMIN_EMAIL and ADMIN_PASSWORD
```

### 5.3 Install, migrate, and build

```bash
cd /opt/delivery-clarity

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run database migrations (creates schema + seeds admin user)
npx prisma migrate deploy

# Build the app
npm run build
```

### 5.4 Start with PM2

```bash
# Start
pm2 start npm --name "delivery-clarity" -- start

# Save PM2 config so it survives reboots
pm2 save
pm2 startup   # follow the printed command to enable autostart

# Check status
pm2 status
pm2 logs delivery-clarity
```

### 5.5 Update

```bash
cd /opt/delivery-clarity
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart delivery-clarity
```

---

## 6. Option C — Vercel (Preview / Demo Only)

⚠️ **Not recommended for production.** Auth sessions and import logs will not persist between serverless cold starts because SQLite requires a persistent filesystem.

Use Vercel only for:
- Public demo / staging builds
- Testing the CSV-upload → dashboard flow (which uses localStorage only)

### 6.1 Steps

1. Push your repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Set environment variables in the Vercel dashboard:
   - `SESSION_SECRET` — any 32-char string
   - `DATABASE_URL` — `file:./data/delivery_clarity.db` (ephemeral on Vercel)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
4. Deploy

### 6.2 Limitations on Vercel

| Feature | Status on Vercel |
|---------|-----------------|
| CSV upload → dashboard | ✅ Works (localStorage) |
| User registration / login | ⚠️ Works during session, lost on cold start |
| Import logs / audit trail | ❌ Lost on cold start |
| Admin user management | ❌ Ephemeral |
| Trend data (requires DB) | ❌ Not persisted |

---

## 7. Reverse Proxy with nginx

Run nginx in front of the app so you can:
- Serve on port 80/443 instead of 3000
- Terminate SSL
- Add rate limiting, gzip compression, security headers

### 7.1 Install nginx

```bash
sudo apt install -y nginx
```

### 7.2 Create a site config

```bash
sudo nano /etc/nginx/sites-available/delivery-clarity
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS (after SSL is set up — see section 8)
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # File upload limit (default 1MB is too small for Jira exports)
        client_max_body_size 25M;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/delivery-clarity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL / HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot automatically updates the nginx config and sets up auto-renewal
# Verify renewal works
sudo certbot renew --dry-run
```

After SSL is active, uncomment the `return 301` redirect line in the nginx config and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 9. First Login & Post-Deploy Checklist

After deploying for the first time:

- [ ] **Log in** at `https://your-domain.com/login` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- [ ] **Change admin password** — go to Profile → Change Password
- [ ] **Run the security checklist** — visit `/admin/security` — target score ≥ 80
- [ ] **Verify SESSION_SECRET** is set and is at least 32 characters (check `/admin/security`)
- [ ] **Test file upload** — upload a Jira CSV and confirm dashboard loads
- [ ] **Create a test user** (optional) — visit `/register` if `ALLOW_OPEN_REGISTRATION=true`, or create via admin
- [ ] **Check import logs** — visit `/backend` and confirm your upload appears
- [ ] **Set up backups** — see Section 11

---

## 10. Updating the App

### Docker

```bash
cd /path/to/delivery-clarity
git pull
docker compose down
docker compose up -d --build
```

Migrations run automatically on container start (`prisma migrate deploy` in the CMD).

### VPS / PM2

```bash
cd /opt/delivery-clarity
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart delivery-clarity
```

---

## 11. Backup & Restore

The SQLite database at `data/delivery_clarity.db` contains all users, sessions, and import logs.

### Docker — backup

```bash
# Copy database out of the Docker volume
docker compose exec delivery-clarity sh -c "cp /app/data/delivery_clarity.db /app/data/backup-$(date +%Y%m%d).db"
docker cp delivery-clarity:/app/data/backup-$(date +%Y%m%d).db ./backup.db
```

### VPS — backup

```bash
# Simple cron backup (add to crontab with `crontab -e`)
# Runs every day at 2 AM
0 2 * * * cp /opt/delivery-clarity/data/delivery_clarity.db /opt/backups/dc-$(date +\%Y\%m\%d).db

# Restore from backup
cp /opt/backups/dc-20260601.db /opt/delivery-clarity/data/delivery_clarity.db
pm2 restart delivery-clarity
```

### In-app backup

The app also includes a built-in backup feature at `/admin/settings` (Backup & Restore tab) — generates a `.bak` file for manual download.

---

## 12. Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| `SESSION_SECRET` warning on security page | Secret not set or too short | Set to 32+ random chars (`openssl rand -hex 32`) |
| Login fails after deploy | `DATABASE_URL` wrong, or DB not migrated | Run `npx prisma migrate deploy`, check `DATABASE_URL` |
| Upload fails with 413 error | nginx `client_max_body_size` too small | Set to `25M` in nginx config (see Section 7) |
| Container won't start | Port 3000 already in use | Change `PORT` in `.env` or stop the conflicting process |
| Import logs disappear after restart (Docker) | Volume not mounted | Check `docker compose ps` and `docker volume ls` |
| "No data loaded" after login | localStorage is browser-specific | Dashboard data is in localStorage — re-upload your Jira file |
| App slow on first request | Next.js cold start | Normal on first request; subsequent requests are fast |
| DB locked error | Multiple processes writing to SQLite | Ensure only one process accesses the DB (single Docker container) |

---

*Delivery Clarity v4.1 — © 2026 Ali Abu Ras — aburasali80@gmail.com*  
*From messy boards to measurable delivery confidence*

# Free Stack Deployment: Render, Neon, Cloudflare R2

This is the recommended low-cost deployment path for Delivery Clarity.

## Stack

- App hosting: Render Free Web Service
- Database: Neon Free PostgreSQL
- Object storage: Cloudflare R2 Free

Render local disk is ephemeral. Do not use local app storage for production data.

## 1. Neon PostgreSQL

1. Create a Neon project.
2. Create or select the production database.
3. Copy the pooled PostgreSQL connection string.
4. Use it as `DATABASE_URL`.
5. Keep `sslmode=require` in the URL.
6. Never commit the URL.

Example shape:

```text
postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require
```

## 2. Cloudflare R2

1. Create an R2 bucket.
2. Create an R2 API token with object read/write access for that bucket.
3. Copy the Account ID.
4. Use this endpoint:

```text
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Set:

```text
STORAGE_DRIVER=s3
STORAGE_BUCKET=<r2 bucket name>
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=<r2 access key id>
STORAGE_SECRET_ACCESS_KEY=<r2 secret access key>
STORAGE_PREFIX=delivery-clarity
```

## 3. Render Web Service

The repo includes `render.yaml`.

Manual setup:

1. Open Render.
2. Create a new Blueprint or Web Service from this GitHub repository.
3. Select branch `main`.
4. Use the free instance type.
5. Build command: `npm ci && npm run build`.
6. Start command: `npm run start`.
7. Health check path: `/api/health`.
8. Add the environment variables below.
9. Deploy.

Important: Render gives the final public URL after the service exists. After the first service is created, set `APP_URL` and `NEXT_PUBLIC_APP_URL` to that URL, then redeploy.

## Required Render Environment Variables

```text
DATABASE_URL=<Neon pooled PostgreSQL URL>
NODE_ENV=production
APP_URL=https://<your-render-service>.onrender.com
NEXT_PUBLIC_APP_URL=https://<your-render-service>.onrender.com
SESSION_SECRET=<32+ random characters>
CONFIG_ENCRYPTION_KEY=<32+ random characters>
STORAGE_DRIVER=s3
STORAGE_BUCKET=<Cloudflare R2 bucket>
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<Cloudflare account id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=<Cloudflare R2 access key id>
STORAGE_SECRET_ACCESS_KEY=<Cloudflare R2 secret>
STORAGE_PREFIX=delivery-clarity
MAX_UPLOAD_MB=20
LOG_LEVEL=info
```

Optional:

```text
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
GATEWAY_JIRA_API_TOKEN=
```

## Startup Behavior

`npm run start` runs:

1. Production environment validation.
2. `prisma migrate deploy`.
3. `next start --hostname 0.0.0.0 --port $PORT`.

Startup migrations are acceptable for one free Render instance. Move migrations to a controlled release step before scaling horizontally.

## Verification

After deploy:

```text
https://<your-render-service>.onrender.com/api/health
https://<your-render-service>.onrender.com/api/ready
```

Expected:

- `/api/health`: HTTP 200.
- `/api/ready`: HTTP 200 only when Neon is reachable.

Then test:

- Login
- Logout
- Jira file upload with a small file
- Dashboard loading
- Admin pages
- R2-backed storage actions

## Free-Tier Limitations

- Render Free services may sleep when idle, so the first request after sleep can be slow.
- Render local files do not persist.
- Neon Free has storage and compute limits.
- Cloudflare R2 Free has storage and operation limits.
- Keep `MAX_UPLOAD_MB` conservative on free instances.

# Koyeb Deployment With Neon PostgreSQL

This guide deploys Delivery Clarity from GitHub to one small Koyeb web service with Neon PostgreSQL.

## Neon Setup

1. Create a Neon project.
2. Create or select the production database.
3. Copy the pooled PostgreSQL connection string.
4. Store it as `DATABASE_URL` in Koyeb.
5. Never commit the connection string to Git.
6. Verify locally against a non-production branch with `npm run db:migrate:deploy`.
7. Seed only when creating the first admin account: `npm run db:seed`.

## GitHub Setup

1. Confirm the deployment branch, usually `main`.
2. Push the deployment changes.
3. Confirm `.env`, `.env.*`, SQLite files, `data/`, `uploads/`, `tmp/`, and `backups/` are ignored.
4. Add GitHub CI secrets only if future workflow steps require live services.

## Koyeb Setup

1. Create a Koyeb Web Service.
2. Choose GitHub deployment.
3. Select this repository and deployment branch.
4. Use the Node.js build process.
5. Build command: `npm ci && npm run build`.
6. Run command: `npm run start`.
7. Expose the app port through Koyeb's `PORT` environment variable.
8. Set `NODE_ENV=production`.
9. Configure the HTTP health check path as `/api/health`.
10. Add all required environment variables.
11. Deploy the service.
12. Inspect build logs and runtime logs.
13. Test the generated `koyeb.app` domain.

`npm run start` runs `prisma migrate deploy` before starting Next.js with `--hostname 0.0.0.0 --port $PORT`.

Startup migrations are acceptable for the first single-instance deployment. Reconsider this before running multiple replicas.

## Required Environment Variables

```text
DATABASE_URL=postgresql://...neon.tech/...?...sslmode=require
NODE_ENV=production
PORT=3000
APP_URL=https://your-service.koyeb.app
NEXT_PUBLIC_APP_URL=https://your-service.koyeb.app
SESSION_SECRET=<32+ random chars>
CONFIG_ENCRYPTION_KEY=<32+ random chars>
STORAGE_DRIVER=s3
STORAGE_BUCKET=<bucket name>
STORAGE_REGION=<region>
STORAGE_ENDPOINT=<optional S3-compatible endpoint>
STORAGE_ACCESS_KEY_ID=<object storage access key>
STORAGE_SECRET_ACCESS_KEY=<object storage secret>
MAX_UPLOAD_MB=20
LOG_LEVEL=info
```

Optional:

```text
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
GATEWAY_JIRA_API_TOKEN=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Object Storage

Do not rely on Koyeb local filesystem persistence. Use `STORAGE_DRIVER=s3` with Amazon S3, Cloudflare R2, Backblaze B2, MinIO, or another S3-compatible provider.

## Post-Deployment Verification

Test:

- Landing page
- Login
- Logout
- `/api/health`
- `/api/ready`
- Database-backed pages
- Jira file upload with a small file
- Dashboard loading
- Export generation
- Admin pages
- Audit/import logs
- Application restart
- Deployment after a new GitHub push
- Failure behavior when `DATABASE_URL` is unavailable

## Rollback

- Roll back to the previous Koyeb deployment from the Koyeb service history.
- Roll back application code by redeploying the previous Git commit.
- Database migrations may not be automatically reversible. Back up Neon before high-risk schema migrations.
- If a startup migration fails, the production start script exits before serving traffic.

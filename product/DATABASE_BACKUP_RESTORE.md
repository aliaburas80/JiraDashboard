# Delivery Clarity — Database Backup & Restore Runbook

**Author:** Ali Abu Ras
**Date:** 2026-07-31
**Version:** 1.0
**Status:** Current
**Related:** `TODO-List.md` §29.1 `P0A-06`; CLAUDE.md §53 (High Risk — production data-recovery path); `product/DEPLOYMENT_GUIDE.md` §11 (pointer only, full procedure lives here).

---

## Why this document exists

Earlier versions of `product/DEPLOYMENT_GUIDE.md` §11 documented backing up `data/delivery_clarity.db` — a SQLite file that hasn't existed since the project moved to Postgres/Neon. That meant every documented backup procedure, and the in-app "Backup & Restore" admin feature (`src/services/settings/backup.service.ts`), silently protected **nothing** of the real production database — only a handful of local JSON config files. This document replaces that with a real, Postgres-native procedure.

**The application database is external PostgreSQL (Neon in production).** It is not a local file, is not inside any Docker volume, and does not need `cp`/`docker cp`-style file backups. The two mechanisms below are the actual recovery path.

---

## 1. Primary recovery mechanism — Neon Point-in-Time Restore (PITR)

Neon provides automatic, continuous backups on all plans via write-ahead-log (WAL) point-in-time restore — no configuration or scheduled job required on our side. This is the **authoritative, first-choice** recovery mechanism for almost any real incident (accidental deletion, bad migration, corrupted data from a bug).

### 1.1 What it covers

- Continuous WAL-based restore to any point within the plan's retention window (check the current plan's retention window in the Neon dashboard — it varies by plan tier and can change; do not hardcode a number here that will go stale).
- Restore is performed by creating a new branch at the desired point in time, or restoring the existing branch in place.
- No data leaves Neon's infrastructure — this is the lowest-risk restore path available.

### 1.2 Honest RPO/RTO

- **RPO (Recovery Point Objective):** effectively continuous — Neon's PITR is WAL-based, not snapshot-based, so recovery point granularity is much finer than "last nightly backup."
- **RTO (Recovery Time Objective):** manual and dashboard-driven, not an automated failover. Expect the time to: notice the incident, decide on a restore point, perform the restore via the Neon dashboard, verify the restored data, and re-point `DATABASE_URL` if restoring to a new branch. This is not a zero-downtime, automatic mechanism — treat it as "fast manual recovery," not "high availability."

### 1.3 Procedure

1. Go to the Neon dashboard → your project → **Branches**.
2. Confirm at least one recent backup/restore point exists (Neon dashboard → **Backups**, per `product/MANUAL_TESTS.md` §7.4).
3. To restore:
   - Select the branch (usually `main`) → **Restore**.
   - Choose the point-in-time to restore to.
   - Neon restores the branch without requiring a new connection string in most cases (in-place restore). If you instead create a **new branch** at that point in time, its connection string will differ from production's — see §3 below before pointing anything at it.
4. Verify: `GET /api/ready` should return `{"status":"ready"}`, and spot-check a few known records (e.g. the admin user, a recent `ImportLog` row) before considering the incident resolved.

This procedure is also documented as a manual QA check in `product/MANUAL_TESTS.md` §7.4–7.5 — this runbook is the canonical version; that file should stay a pointer to here for anything beyond the quick checklist.

---

## 2. Supplementary copy — scheduled `pg_dump` to S3

Neon PITR is the primary mechanism, but a single provider is still a single point of failure (account lockout, billing issue, provider-side incident). `.github/workflows/db-backup.yml` runs an independent daily `pg_dump`, uploaded directly to S3 — a second, provider-independent copy.

### 2.1 Why GitHub Actions, not a Render cron job or the app's own Docker image

- Render's production service (`render.yaml`) is a single free-tier `type: web` service on Render's native Node buildpack — it does not preinstall `postgresql-client`/`pg_dump`, and a scheduled Render cron job is a separate, paid service type we don't currently use anywhere in this repo. Adding one is new production infrastructure for a need GitHub Actions already satisfies for free.
- The `Dockerfile` (an optional self-host path — not what Render actually runs) also has no `postgresql-client` installed, only `libc6-compat`.
- GitHub Actions `ubuntu-latest` runners ship `pg_dump` preinstalled — this repo's own `.github/workflows/e2e.yml` already depends on this for its ephemeral `postgres:16` test service. No new runtime dependency is introduced.

### 2.2 Why S3, not a plain GitHub Actions artifact

A `pg_dump` of this database contains password hashes and other PII. A plain `actions/upload-artifact` is downloadable by **any collaborator with read access to this repo** — broader than production-DB access should be, even in a private repo (confirmed private via `gh repo view`, but that alone isn't sufficient isolation for a full data dump). Instead, the dump is piped directly to a private S3 prefix, encrypted at rest via S3 server-side encryption, using a **new IAM credential scoped only to that prefix** — separate from the app's own existing image-upload credentials (`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY` in `render.yaml`), so a compromise of one doesn't expose the other.

### 2.3 Required manual setup (not done by this change — you must do this)

The workflow file is committed and ready, but **cannot succeed until these are provisioned manually**:

1. **Neon direct (unpooled) connection string.** `.env.example`'s `DATABASE_URL` is Neon's **pooled** (PgBouncer) URL — `pg_dump` needs session-level behavior that transaction pooling doesn't support reliably. In the Neon dashboard, get the **unpooled/direct** connection string (same project, different connection string) and add it as a new GitHub Actions secret:
   - `NEON_DIRECT_DATABASE_URL`
2. **A new, narrowly-scoped S3 IAM credential**, limited to `s3:PutObject`/`s3:GetObject`/`s3:ListBucket` on a new `db-backups/` prefix inside the existing `jira-data-logs` bucket (or a separate bucket, if preferred — a separate bucket gives stronger isolation at the cost of one more thing to provision). Example minimal IAM policy (adjust bucket/prefix if you choose a separate bucket):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
       "Resource": [
         "arn:aws:s3:::jira-data-logs/db-backups/*",
         "arn:aws:s3:::jira-data-logs"
       ],
       "Condition": { "StringLike": { "s3:prefix": ["db-backups/*"] } }
     }]
   }
   ```
   Add as GitHub Actions secrets:
   - `DB_BACKUP_AWS_ACCESS_KEY_ID`
   - `DB_BACKUP_AWS_SECRET_ACCESS_KEY`
   - `DB_BACKUP_S3_BUCKET` (e.g. `jira-data-logs`)
   - `DB_BACKUP_S3_REGION` (e.g. `us-west-2`, matching `STORAGE_REGION` in `render.yaml`)
3. **An S3 lifecycle rule** on the `db-backups/` prefix to bound retention (e.g. expire objects after 35 days) — set this in the S3 console/bucket policy, not in the workflow itself, since lifecycle rules are a bucket-level concept.
4. Repo secrets access: confirm the secrets above are scoped appropriately (repo-level or environment-level secrets with restricted access), and consider adding a GitHub **environment protection rule** gating this workflow's `workflow_dispatch` if broader write access to the repo exists than should have production-adjacent trigger rights.

Until step 1–3 are done, `db-backup.yml` will fail at the `pg_dump`/upload step — this is expected and does not affect the app itself (the workflow is fully decoupled from the running application).

### 2.4 What the workflow does

See `.github/workflows/db-backup.yml` for the authoritative definition. Summary: on a daily schedule (and via manual `workflow_dispatch`), it runs `pg_dump --format=custom` against `NEON_DIRECT_DATABASE_URL` (passed via environment variable, never as a command-line argument, and never printed to logs), and uploads the resulting file directly to `s3://<bucket>/db-backups/<timestamp>.dump` using the scoped credentials above.

---

## 3. Restore decision tree

**Always prefer Neon PITR (§1) when the incident is within its retention window** — zero data movement, built into the platform, lowest risk. Only fall back to the `pg_dump` copy (§2) when PITR is insufficient:

- The needed point in time is older than Neon's current retention window, **or**
- The Neon project/account itself is unavailable (billing lockout, account issue, provider outage), **or**
- You specifically need an offline copy independent of Neon (e.g. migrating providers).

### 3.1 Restoring from the `pg_dump` copy

**Never restore directly into the production database.** Always restore into a scratch target first, verify, and only then decide whether/how to promote it.

```bash
# 1. Download the dump you need from S3 (list objects under db-backups/ to find the right timestamp)
aws s3 cp s3://jira-data-logs/db-backups/<timestamp>.dump ./restore-check.dump

# 2. Create a fresh scratch database to restore into — NEVER point this at production.
#    Easiest: create a new Neon branch (empty, from any point) and get its connection string
#    from the Neon dashboard, or spin up a throwaway local/Docker Postgres instance.

# 3. Restore into the scratch target — paste the scratch connection string explicitly.
#    Do NOT default this to any environment variable named DATABASE_URL or similar —
#    that is exactly the mistake that turns a drill into an incident.
pg_restore --clean --if-exists --no-owner \
  --dbname="<PASTE THE SCRATCH CONNECTION STRING HERE — NOT PRODUCTION>" \
  ./restore-check.dump

# 4. Verify: connect to the scratch database and spot-check row counts, a few known records,
#    and that the schema matches what `prisma migrate deploy` would produce (compare migration
#    history if in doubt).

# 5. Only after verification, decide how to promote: for most cases this means using the
#    verified data to inform a targeted fix against production (e.g. re-inserting specific
#    rows) rather than a wholesale swap of DATABASE_URL — a full swap should go through the
#    same High-Risk review this runbook itself required (CLAUDE.md §53).
```

A wrapper script was deliberately **not** built for this procedure. The real risk in a restore is operator error around the *target* (restoring into or promoting the wrong database), not a mistyped flag — a confirmation flag doesn't address that risk, and this repo's only comparable existing runbook (`product/DEVELOPER_GUIDE.md` §12 "Rollback procedure") is prose/commands only, no tooling. Pasting the target connection string explicitly, every time, is the actual safeguard.

---

## 4. What this document does not cover — named follow-ups

- **Full in-app Postgres-table export/import** (i.e., extending `backup.service.ts` itself to include real table data in the browser-downloadable bundle) is explicitly out of scope here. Production data includes password hashes and PII; a safe version needs field-level redaction and restore-time referential-integrity handling — a separate, larger, High-Risk project, not folded into this pass.
- **Render-specific deployment documentation** — `product/DEPLOYMENT_GUIDE.md` still doesn't have a dedicated Render walkthrough despite `render.yaml` being the real production config; this is a pre-existing, separate documentation gap, not something this pass resolves.
- **A paid Render cron job** as an alternative/addition to the GitHub Actions workflow — not pursued since GH Actions already satisfies the need at zero additional cost; revisit only if there's a specific reason GH Actions becomes insufficient.

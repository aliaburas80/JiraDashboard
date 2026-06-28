# Koyeb and Neon Deployment Audit

Date: 2026-06-29

## Architecture Discovered

- Framework: Next.js 14.2.5 using the App Router under `app/`.
- Runtime: Node.js, pinned to Node 20 in `.nvmrc` and `package.json`.
- Package manager: npm with `package-lock.json`.
- ORM: Prisma 5.22.0.
- Original database: SQLite via `DATABASE_URL=file:...`.
- Target database: Neon PostgreSQL through Prisma.
- Authentication: custom credential auth with `iron-session`; `SESSION_SECRET` signs/encrypts cookies.
- API surface: App Router route handlers under `app/api/**`.
- File processing: Jira CSV/XLS/XLSX upload is parsed in-process with `xlsx`.
- Storage: existing local, S3, Azure, and GCP provider adapters. Production must use object storage, not Koyeb local disk.

## Deployment-Relevant Findings

- The app was already a Next.js App Router app; no framework migration was required.
- Prisma used SQLite and the active migration files were SQLite-specific. They were archived under `prisma/migrations-sqlite-archive/`.
- The checked SQLite database at `prisma/data/delivery_clarity.db` was preserved. It was approximately 60 KB and contained zero rows in the legacy tables present in that file.
- Jira uploads are currently parsed from multipart form data into memory. The upload limit is now environment-configurable with `MAX_UPLOAD_MB`, but the parser is still request-bound and should be revisited before very large imports.
- Local files under `data/` are used for latest metrics, import-log JSON, storage settings, encrypted app config, and local backups. Koyeb must treat those files as ephemeral.
- Existing S3-compatible object storage support is available and can be selected with `STORAGE_DRIVER=s3`.
- The previous production start path did not run Prisma migrations and did not force binding to `0.0.0.0`.
- No GitHub Actions workflow existed for the root Next.js app before this change.
- A committed `.env` file exists locally. It is ignored by Git, but any real credentials in it must be treated as local secrets and never copied into documentation or commits.

## Operational Risks

- Startup migrations are acceptable for the initial single Koyeb instance. Before adding concurrent replicas, move migrations to a controlled release step to avoid multiple instances attempting the same migration at once.
- The app still has known inline-style ESLint debt documented in `CLAUDE.md`; direct ESLint validation will expose those existing warnings.
- The upload parser uses `xlsx`, which can be memory-heavy. Keep `MAX_UPLOAD_MB` conservative on free/small Koyeb instances.
- SQLite-to-PostgreSQL data import is not needed for the current checked database because it has no rows, but teams with existing local data must follow `DATABASE_MIGRATION.md`.

## Hard-Coded Configuration Notes

- Historical docs still mention Docker/SQLite deployment. New Koyeb/Neon docs are canonical for this deployment target.
- App URLs must be configured with `APP_URL` and `NEXT_PUBLIC_APP_URL`.
- Do not hard-code Koyeb-generated domains, callback URLs, or database URLs in source.

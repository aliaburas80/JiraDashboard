# Delivery Clarity — Application Error Catalog

This catalog covers every structured error code the application can produce.
Each entry includes: what triggers it, root cause, and the exact fix.

**Last updated:** 2026-07-01
**Version:** 1.1
**Applies to:** v4.16.0+

---

## How to read this catalog

| Field | Meaning |
|---|---|
| **Code** | Unique error identifier — reference in tickets and log searches |
| **Event name** | The structured log `event` field value (for server-side errors) |
| **HTTP status** | Response status for API-surface errors |
| **Severity** | critical (process exits or data loss risk) / error / warning / info |
| **Where** | Where this error appears: startup log, API response, admin dashboard, client boundary |

---

## Startup and Configuration Errors

### ERR-001 — DATABASE_URL missing in production

| Field | Value |
|---|---|
| **Code** | ERR-001 |
| **Event name** | `startup.env_invalid` |
| **HTTP status** | N/A (process exits with code 1) |
| **Severity** | critical |
| **Where** | Server startup log |

**Description:** The application cannot start because DATABASE_URL is not set in the process environment.

**Cause:** NODE_ENV=production but DATABASE_URL env var is absent or blank. In local dev, this can happen when running `npm run start` (which calls `scripts/start-production.mjs`) instead of `npm run dev` — the production script does NOT read `.env` files; env vars must be injected into the process by the host platform.

**Fix:**
1. On Render: go to Service → Environment → add `DATABASE_URL` = your Neon pooled PostgreSQL URL (shape: `postgresql://user:pass@host-pooler.region.aws.neon.tech/db?sslmode=require`).
2. Local test: run `node --env-file=.env scripts/start-production.mjs`.
3. Ensure value does NOT start with `file:` (SQLite — rejected in production, see ERR-006).

**Related:** ERR-002, ERR-003, ERR-004, ERR-006

---

### ERR-002 — SESSION_SECRET missing or too short in production

| Field | Value |
|---|---|
| **Code** | ERR-002 |
| **Event name** | `startup.env_invalid` |
| **HTTP status** | N/A (process exits with code 1) |
| **Severity** | critical |
| **Where** | Server startup log |

**Description:** SESSION_SECRET is absent or shorter than 32 characters. Iron-session uses this to sign and encrypt session cookies. Without it, all user sessions are insecure.

**Cause:** Not set on hosting platform, or set to a short placeholder string.

**Fix:** Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set on hosting platform. Minimum 32 characters. Never reuse between production and development.

**Related:** ERR-001, ERR-043

---

### ERR-003 — CONFIG_ENCRYPTION_KEY missing or too short in production

| Field | Value |
|---|---|
| **Code** | ERR-003 |
| **Event name** | `startup.env_invalid` |
| **HTTP status** | N/A (process exits with code 1) |
| **Severity** | critical |
| **Where** | Server startup log |

**Description:** CONFIG_ENCRYPTION_KEY is absent or shorter than 32 characters. Used to encrypt runtime application configuration stored in the database.

**Cause:** Not set on hosting platform, or set to a placeholder.

**Fix:** Generate same way as SESSION_SECRET. Changing this key will make previously encrypted config unreadable — rotate carefully with a migration step if config data already exists.

**Related:** ERR-001, ERR-009

---

### ERR-004 — STORAGE_DRIVER invalid or not persistent in production

| Field | Value |
|---|---|
| **Code** | ERR-004 |
| **Event name** | `startup.env_invalid` |
| **HTTP status** | N/A (process exits with code 1) |
| **Severity** | critical |
| **Where** | Server startup log |

**Description:** In production, STORAGE_DRIVER must be `s3`, `azure`, or `gcp`. The value `temporary` is rejected because Render's local disk is ephemeral — uploaded Jira files would be lost on every restart.

**Cause:** STORAGE_DRIVER not set (defaults to `temporary`) or set to an unrecognised value.

**Fix:** Set `STORAGE_DRIVER=s3` and configure all required S3/R2 vars: `STORAGE_BUCKET`, `STORAGE_REGION` (use `auto` for Cloudflare R2), `STORAGE_ENDPOINT` (R2 endpoint), `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`.

**Related:** ERR-005, ERR-072

---

### ERR-005 — S3 storage credentials missing

| Field | Value |
|---|---|
| **Code** | ERR-005 |
| **Event name** | `startup.env_invalid` |
| **HTTP status** | N/A (process exits with code 1) |
| **Severity** | critical |
| **Where** | Server startup log |

**Description:** STORAGE_DRIVER=s3 but neither STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY nor AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY are set.

**Cause:** R2/S3 credentials not configured on the host.

**Fix:** In Render dashboard, set `STORAGE_ACCESS_KEY_ID` and `STORAGE_SECRET_ACCESS_KEY` to your Cloudflare R2 API token credentials (create under R2 → Manage R2 API tokens → allow Object Read & Write for your bucket).

**Related:** ERR-004, ERR-072

---

### ERR-006 — DATABASE_URL uses SQLite in production

| Field | Value |
|---|---|
| **Code** | ERR-006 |
| **Event name** | `startup.env_invalid` |
| **HTTP status** | N/A (process exits with code 1) |
| **Severity** | critical |
| **Where** | Server startup log |

**Description:** DATABASE_URL starts with `file:` which means SQLite. Production requires PostgreSQL.

**Cause:** Local dev `.env` was accidentally used, or DATABASE_URL was not overridden for production.

**Fix:** Replace with a PostgreSQL connection string from Neon (or another hosted Postgres). Local dev intentionally uses SQLite — ensure production env vars override this.

**Related:** ERR-001, ERR-071

---

### ERR-007 — Prisma migration failed at startup

| Field | Value |
|---|---|
| **Code** | ERR-007 |
| **Event name** | `startup.migration_failed` |
| **HTTP status** | N/A (process exits before Next.js starts) |
| **Severity** | critical |
| **Where** | Server startup log |

**Description:** `prisma migrate deploy` failed during production startup. The process exits before Next.js starts.

**Cause:** (a) DATABASE_URL is wrong or unreachable; (b) migration SQL is invalid; (c) database user lacks DDL privileges; (d) Neon is in a cold-start state (first connection attempt timed out).

**Fix:** Check startup logs for the specific Prisma error. For Neon cold-starts, retry once — the second attempt usually succeeds after the database wakes. For permission errors, ensure the database role has CREATE/ALTER TABLE privileges.

**Related:** ERR-001, ERR-071

---

### ERR-008 — SMTP not configured — email skipped

| Field | Value |
|---|---|
| **Code** | ERR-008 |
| **Event name** | `[email] SMTP not configured — skipping email to {address}` |
| **HTTP status** | N/A (warning only; operation continues) |
| **Severity** | warning |
| **Where** | Server log |

**Description:** An email send was attempted but SMTP_HOST, SMTP_USER, or SMTP_PASS is not set. The operation continues without sending.

**Cause:** Email env vars not configured. In development and test environments this is expected (tests mock email paths).

**Fix:** For production: set `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in environment. For Gmail: use an App Password (not your login password). For demo/dev: leaving unset is fine — email operations just silently no-op.

**Related:** ERR-091

---

### ERR-009 — CONFIG_ENCRYPTION_KEY not set — cloud config unreadable

| Field | Value |
|---|---|
| **Code** | ERR-009 |
| **Event name** | `[app-config] CONFIG_ENCRYPTION_KEY not set — cannot decrypt cloud config` |
| **HTTP status** | N/A (warning; falls back to defaults) |
| **Severity** | warning |
| **Where** | Server log |

**Description:** The application tried to load a cloud-stored encrypted configuration but CONFIG_ENCRYPTION_KEY is absent. Falls back to defaults.

**Cause:** Key not set (common in test environments running without full env). Seen in Jest tests that invoke API routes using app-config.

**Fix:** In production, ensure CONFIG_ENCRYPTION_KEY is set (see ERR-003). In tests, this is a known pre-existing warning — the test passes because the code falls back gracefully to defaults. It does NOT indicate a test failure.

**Related:** ERR-003

---

### ERR-010 — PORT env var not set (uses default 3000)

| Field | Value |
|---|---|
| **Code** | ERR-010 |
| **Event name** | N/A |
| **HTTP status** | N/A |
| **Severity** | info |
| **Where** | Server startup log |

**Description:** PORT is not set; the application will listen on 3000. On Render, PORT is injected automatically by the platform.

**Cause:** Running locally without explicit PORT export.

**Fix:** Set `PORT` env var if you need a specific port. On Render, this is handled automatically.

**Related:** None

---

### ERR-011 — SMTP test returns 500 on Render (works locally)

| Field | Value |
|---|---|
| **Code** | ERR-011 |
| **Event name** | N/A (HTTP 500 from `POST /api/admin/app-config?action=test`) |
| **HTTP status** | 500 |
| **Severity** | error |
| **Where** | Admin → App Config → Send test email button (red "Failed — retry" state) |

**Description:** The "Send test email" test returns a 500 on the live Render deployment but works in local dev. The red error banner shows the specific SMTP error and a "Show solution" expander with the fix.

**Cause:** `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` are not declared in `render.yaml`, so Render has no SMTP credentials unless they were manually set in the dashboard. When they are absent, `getAppConfig()` returns empty SMTP fields. The form pre-fills from those empty values. If the password field is blank and no cloud config was saved, `sendEmailWith` returns `false` (skipped, not a 500). If credentials were typed and the connection still fails, the underlying SMTP error is the cause — see sub-cases below.

**Sub-cases and fixes:**

1. **Form fields are blank on Render** — SMTP vars were never set on Render. The form loads empty because `getSafeConfig()` falls back to env vars, and no SMTP env vars exist.
   - Fix: In the Render dashboard → Service → Environment, add: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=aliaburas80@gmail.com`, `SMTP_PASS=<16-char App Password>`, `SMTP_FROM=Delivery Clarity <aliaburas80@gmail.com>`. These are now declared as `sync: false` in `render.yaml` (added 2026-07-01).

2. **Gmail 535 — App Password rejected** — The App Password was revoked, contains spaces, or the Google account "Less secure app access" was changed.
   - Fix: Go to Google Account → Security → App Passwords → generate a new 16-character password. Paste it without spaces into `SMTP_PASS` in Render dashboard. Save. Test again.

3. **ETIMEDOUT — Render cannot reach smtp.gmail.com:587** — Network-level block from Render's outbound ports (unusual; Render does not block 587 on paid plans, but verify). Also possible on Render free tier with cold-start first-connection delays.
   - Fix: Retry once (cold-start timeout). If persistent, check Render's status page or upgrade from free tier.

4. **SMTP credentials work but "to" address is wrong** — The test email is sent to the logged-in admin's session email. Confirm that the session email matches a real inbox.

**After fix:** In Admin → App Config, fill in SMTP fields and click **Encrypt & Save to Cloud** first, then **Send test email**. Once the cloud config is saved, credentials persist across Render restarts without needing env vars.

**Related:** ERR-008, ERR-003

---

## Upload and Processing Errors

### ERR-021 — File type not supported

| Field | Value |
|---|---|
| **Code** | ERR-021 |
| **Event name** | `upload.validation_failed` |
| **HTTP status** | 400 |
| **Severity** | error |
| **Where** | API response, upload UI |

**Description:** The uploaded file extension or MIME type is not in the accepted list (.csv, .xlsx, .xls).

**Cause:** User uploaded a wrong file type (PDF, Word doc, zip, etc.) or changed the extension.

**Fix (user):** Upload a CSV or Excel export from Jira. From Jira: Backlog/Board → three-dot menu → Export Issues → Export Excel or CSV.

**Fix (operator):** Check `app/api/upload/route.ts` for the accepted-type list.

**Related:** ERR-022, ERR-023

---

### ERR-022 — File too large

| Field | Value |
|---|---|
| **Code** | ERR-022 |
| **Event name** | `upload.validation_failed` |
| **HTTP status** | 413 |
| **Severity** | error |
| **Where** | API response, upload UI |

**Description:** Uploaded file exceeds MAX_UPLOAD_MB (default 20 MB).

**Cause:** Very large Jira export (tens of thousands of issues). File size limit is controlled by the `MAX_UPLOAD_MB` env var.

**Fix (user):** Export a smaller date range or project scope from Jira. Split by project if needed.

**Fix (operator):** Increase `MAX_UPLOAD_MB` env var (max 100). On Render Free, stay conservative to avoid OOM.

**Related:** ERR-021

---

### ERR-023 — CSV/Excel parse failed — no recognisable columns

| Field | Value |
|---|---|
| **Code** | ERR-023 |
| **Event name** | `upload.validation_failed` |
| **HTTP status** | 422 |
| **Severity** | error |
| **Where** | API response, upload UI |

**Description:** The file was parsed but no Jira-standard columns were found (e.g. Issue Key, Summary, Issue Type, Status).

**Cause:** (a) Wrong file exported from Jira — not a full Jira issue export; (b) file is empty; (c) encoding issues in multi-byte filenames.

**Fix (user):** Re-export from Jira using the standard issue export, not a board/sprint/custom export. Ensure the export includes the Issue Key column.

**Related:** ERR-021, ERR-025

---

### ERR-024 — Duplicate file upload detected

| Field | Value |
|---|---|
| **Code** | ERR-024 |
| **Event name** | `upload.validation_failed` |
| **HTTP status** | 409 |
| **Severity** | warning |
| **Where** | API response, upload UI |

**Description:** An identical file (same content hash) was already uploaded for this account.

**Cause:** User re-uploaded the same file without refreshing data first.

**Fix (user):** Export a fresh copy from Jira. If intentional re-upload, wait for the 24-hour replacement window.

**Related:** ERR-026

---

### ERR-025 — Analysis failed — calculation error

| Field | Value |
|---|---|
| **Code** | ERR-025 |
| **Event name** | `analysis_failed` |
| **HTTP status** | 500 |
| **Severity** | error |
| **Where** | API response, admin dashboard error log |

**Description:** The Jira data was uploaded and parsed but metric calculation failed. The uploaded file is preserved; the entitlement is NOT consumed.

**Cause:** (a) Unexpected data format edge case in metric calculations; (b) missing required fields; (c) empty sprint data.

**Fix (operator):** Check error logs for the specific calculation function that threw. Common causes: sprints with no issues, issues with negative story points, custom hierarchy mismatches.

**Related:** ERR-023, ERR-073

---

### ERR-026 — Upload session expired

| Field | Value |
|---|---|
| **Code** | ERR-026 |
| **Event name** | `upload.validation_failed` |
| **HTTP status** | 410 |
| **Severity** | warning |
| **Where** | API response, upload UI |

**Description:** The upload session reference is no longer valid. The user's trial workspace has expired.

**Cause:** 30-day workspace expiry reached.

**Fix (user):** Re-register or contact support for an extension.

**Related:** ERR-024

---

## Authentication and Session Errors

### ERR-041 — Invalid credentials

| Field | Value |
|---|---|
| **Code** | ERR-041 |
| **Event name** | `auth.login_failed` |
| **HTTP status** | 401 |
| **Severity** | warning |
| **Where** | API response, login UI |

**Description:** Login failed — email/password combination does not match any account.

**Cause:** Wrong password, wrong email, or account does not exist.

**Fix (user):** Check email spelling. Use "Forgot password" to reset. If using Gmail SMTP, ensure App Password is set correctly for password-reset emails.

**Related:** ERR-042, ERR-045

---

### ERR-042 — Email not verified

| Field | Value |
|---|---|
| **Code** | ERR-042 |
| **Event name** | `auth.login_failed` |
| **HTTP status** | 403 |
| **Severity** | warning |
| **Where** | API response, login UI |

**Description:** Login attempted before completing email verification.

**Cause:** User signed up but did not click the verification link.

**Fix (user):** Check email inbox (and spam) for the verification email. Use "Resend verification" on the login page.

**Related:** ERR-041, ERR-008

---

### ERR-043 — Session expired or invalid

| Field | Value |
|---|---|
| **Code** | ERR-043 |
| **Event name** | `auth.session_invalid` |
| **HTTP status** | 401 |
| **Severity** | info |
| **Where** | API response (middleware redirect to login) |

**Description:** The session cookie has expired, was tampered with, or was invalidated (e.g. after SESSION_SECRET rotation).

**Cause:** (a) Session TTL exceeded (SESSION_TTL_HOURS, default 8h); (b) SESSION_SECRET was changed (all sessions become invalid); (c) manual session revocation by admin.

**Fix (user):** Log in again. If it happens immediately after a deployment, the SESSION_SECRET was rotated — expected.

**Related:** ERR-002, ERR-044

---

### ERR-044 — Account suspended

| Field | Value |
|---|---|
| **Code** | ERR-044 |
| **Event name** | `auth.login_failed` |
| **HTTP status** | 403 |
| **Severity** | warning |
| **Where** | API response, login UI |

**Description:** This account has been suspended by an administrator.

**Cause:** Admin used the Suspend account action in the admin console.

**Fix (user):** Contact support.

**Fix (admin):** Review the suspension reason in the admin audit log. Unsuspend if appropriate.

**Related:** ERR-043

---

### ERR-045 — Rate limit exceeded — too many login attempts

| Field | Value |
|---|---|
| **Code** | ERR-045 |
| **Event name** | `auth.rate_limited` |
| **HTTP status** | 429 |
| **Severity** | warning |
| **Where** | API response, login UI |

**Description:** Too many failed login attempts from this source. Temporary lockout applied.

**Cause:** Brute-force protection triggered (repeated wrong passwords).

**Fix (user):** Wait for the lockout window (typically 15 minutes), then try again with the correct credentials or use password reset.

**Related:** ERR-041

---

## Authorization Errors

### ERR-061 — Workspace not found or access denied

| Field | Value |
|---|---|
| **Code** | ERR-061 |
| **Event name** | `api_error` |
| **HTTP status** | 404 |
| **Severity** | warning |
| **Where** | API response, client error boundary |

**Description:** The requested workspace ID does not exist or belongs to a different user.

**Cause:** (a) Incorrect/expired workspace ID; (b) attempt to access another user's workspace (cross-tenant access attempt, risk R-03).

**Fix (user):** Navigate from your dashboard — do not manually construct workspace URLs.

**Fix (operator):** Investigate any 404 for workspace access as a potential cross-tenant access attempt. Check audit logs.

**Related:** ERR-062

---

### ERR-062 — Admin access required

| Field | Value |
|---|---|
| **Code** | ERR-062 |
| **Event name** | `api_error` |
| **HTTP status** | 403 |
| **Severity** | error |
| **Where** | API response |

**Description:** The requested admin API endpoint requires admin authentication. Public user tokens are rejected.

**Cause:** Attempt to access `/admin-api` with a public user session.

**Fix:** Log in to the admin application separately. Admin and public applications have separate authentication.

**Related:** ERR-043, ERR-061

---

## Database and Storage Errors

### ERR-071 — Database connection failed

| Field | Value |
|---|---|
| **Code** | ERR-071 |
| **Event name** | `db.connection_failed` |
| **HTTP status** | 503 |
| **Severity** | critical |
| **Where** | Server log, API response, `/api/ready` health endpoint |

**Description:** The application cannot connect to PostgreSQL.

**Cause:** (a) DATABASE_URL is wrong; (b) Neon database is in an extended cold-start; (c) network connectivity issue between Render and Neon; (d) database credentials rotated without updating env.

**Fix:** Check Render logs for the Prisma connection error message. Verify DATABASE_URL in Render env. Try the `/api/ready` health endpoint — it specifically checks database connectivity. On Neon free tier, the first connection after a period of inactivity may take 5–10 seconds.

**Related:** ERR-001, ERR-007

---

### ERR-072 — File storage write failed

| Field | Value |
|---|---|
| **Code** | ERR-072 |
| **Event name** | `storage.write_failed` |
| **HTTP status** | 500 |
| **Severity** | error |
| **Where** | Server log, API response |

**Description:** Uploaded file could not be written to S3/R2 object storage.

**Cause:** (a) Invalid storage credentials; (b) bucket name wrong; (c) R2 endpoint URL wrong; (d) bucket permissions insufficient.

**Fix:** Check `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`. Verify the R2 API token has Object Write permission for the specified bucket. Test with `aws s3 ls s3://BUCKET --endpoint-url ENDPOINT`.

**Related:** ERR-004, ERR-005

---

### ERR-073 — System error log write failed

| Field | Value |
|---|---|
| **Code** | ERR-073 |
| **Event name** | `[system-error-logger] Failed to write error log` |
| **HTTP status** | N/A (warning only; original error still handled) |
| **Severity** | warning |
| **Where** | Server log |

**Description:** The error logging service itself failed to persist an error record. The original error was still handled; only the audit record was lost.

**Cause:** Database connection issue, or in tests: Prisma client is not mocked (seen in `adminUsers.test.ts`).

**Fix:** This is a known pre-existing warning in some Jest tests (Prisma `createMany` undefined in test context). In production, if this appears, check database connectivity (ERR-071).

**Related:** ERR-071

---

## API and Client Errors

### ERR-091 — Demo request relay failed — SMTP unconfigured

| Field | Value |
|---|---|
| **Code** | ERR-091 |
| **Event name** | `api_error` |
| **HTTP status** | 503 |
| **Severity** | warning |
| **Where** | API response (`POST /api/demo-request`) |

**Description:** A demo request form submission was received but could not be sent by email because SMTP is unconfigured. Returns a 503 with a direct-email fallback address.

**Cause:** SMTP_HOST, SMTP_USER, or SMTP_PASS not set on the server.

**Fix:** Configure SMTP env vars (see ERR-008). Until then, the 503 response includes `aliaburas80@gmail.com` as the direct contact fallback.

**Related:** ERR-008

---

### ERR-092 — API route not found

| Field | Value |
|---|---|
| **Code** | ERR-092 |
| **Event name** | `api_error` |
| **HTTP status** | 404 |
| **Severity** | info |
| **Where** | API response |

**Description:** No API route matches the requested URL.

**Cause:** Typo in client-side fetch URL, or deprecated API endpoint.

**Fix (developer):** Check the SRS §8.1 API route inventory for the correct endpoint.

**Related:** None

---

### ERR-093 — Request body validation failed

| Field | Value |
|---|---|
| **Code** | ERR-093 |
| **Event name** | `api_error` |
| **HTTP status** | 400 |
| **Severity** | warning |
| **Where** | API response |

**Description:** The request body does not match the expected schema (validated with Zod).

**Cause:** Client sent malformed JSON, missing required fields, or invalid field types.

**Fix (developer):** Check the Zod schema for the API route. The response body includes `error.issues` from Zod for debugging.

**Related:** None

---

## Analytics and Event Errors

### ERR-111 — Event batch rejected — schema invalid

| Field | Value |
|---|---|
| **Code** | ERR-111 |
| **Event name** | `analytics.batch_rejected` |
| **HTTP status** | 400 (partial: accepted/rejected response) |
| **Severity** | warning |
| **Where** | API response (`POST /api/events`) |

**Description:** One or more events in a batch failed server-side schema validation.

**Cause:** Client sent an event without required fields (`event_id`, `schema_version`, `event_name`, `occurred_at`).

**Fix:** The server returns `{ "accepted": [...], "rejected": [{"event_id": "...", "reason": "invalid_schema"}] }`. Client must delete only accepted event IDs from the IndexedDB queue; rejected IDs should be corrected or discarded.

**Related:** ERR-112

---

### ERR-112 — Event batch too large

| Field | Value |
|---|---|
| **Code** | ERR-112 |
| **Event name** | `analytics.batch_rejected` |
| **HTTP status** | 413 |
| **Severity** | warning |
| **Where** | API response (`POST /api/events`) |

**Description:** The event batch payload exceeds the server-side size limit.

**Cause:** Client queued too many events before flushing, or individual event payloads are too large.

**Fix:** Reduce batch size (flush at 20–50 events per §4.7 of the Master Plan). Never include raw Jira content or large attachment blobs in event properties.

**Related:** ERR-111

---

## AI Service Errors

### ERR-121 — AI service unavailable

| Field | Value |
|---|---|
| **Code** | ERR-121 |
| **Event name** | `ai.service_unavailable` |
| **HTTP status** | 503 |
| **Severity** | error |
| **Where** | Server log, admin dashboard |

**Description:** The internal AI worker (port 4100) or Ollama (port 11434) is not reachable.

**Cause:** Ollama process not running, AI service worker crashed, or port conflict.

**Fix:** Check AI service process logs. Restart Ollama. Ensure port 11434 is NOT publicly exposed — Ollama should only be reachable from the AI service on the private network.

**Related:** ERR-122, ERR-123

---

### ERR-122 — AI output failed schema validation

| Field | Value |
|---|---|
| **Code** | ERR-122 |
| **Event name** | `ai.output_invalid` |
| **HTTP status** | N/A (internal; run marked failed) |
| **Severity** | error |
| **Where** | Server log, `ai_analysis_runs` table (`status: failed`) |

**Description:** The model returned a response that does not match the required JSON schema. The response is discarded rather than stored.

**Cause:** Model generated invalid JSON, truncated output, or hallucinated field names.

**Fix:** The AI service retries once. If it fails again, the run is logged with `status: failed` in `ai_analysis_runs`. Improve the prompt or increase `max_tokens` if truncation is the cause.

**Related:** ERR-121, ERR-123

---

### ERR-123 — AI evidence package empty — insufficient data

| Field | Value |
|---|---|
| **Code** | ERR-123 |
| **Event name** | `ai.insufficient_evidence` |
| **HTTP status** | N/A (safe non-answer returned) |
| **Severity** | warning |
| **Where** | Server log, admin AI report panel |

**Description:** The AI analysis was triggered but the evidence aggregates are empty (no events, errors or feedback yet).

**Cause:** Analytics collection has not started, or the time window requested has no data.

**Fix:** Expected early in the soft launch. The AI returns `{ "classification": "insufficient_evidence" }` — this is the correct safe non-answer per the AI guardrails. Do not override with default content.

**Related:** ERR-121, ERR-122

---

## Payment Errors (P1 — not yet implemented)

### ERR-131 — Payment webhook signature invalid

| Field | Value |
|---|---|
| **Code** | ERR-131 |
| **Event name** | `payment.webhook_invalid` |
| **HTTP status** | 400 |
| **Severity** | critical |
| **Where** | Server log, admin payments dashboard |

**Description:** A webhook from Lemon Squeezy or PayPal failed signature verification. The event is rejected and not processed.

**Cause:** (a) Wrong webhook signing secret configured; (b) payload was tampered; (c) replay attack with an expired token.

**Fix:** Verify the webhook signing secret in the payment provider dashboard matches the env var. Log the raw payload and signature for investigation. Never process a webhook that fails verification.

**Related:** ERR-132, ERR-133, Risk R-15

---

### ERR-132 — Duplicate payment webhook received

| Field | Value |
|---|---|
| **Code** | ERR-132 |
| **Event name** | `payment.webhook_duplicate` |
| **HTTP status** | 200 (idempotent — acknowledged but not reprocessed) |
| **Severity** | info |
| **Where** | Server log |

**Description:** A webhook event_id already exists in `payment_webhook_events`. The event is acknowledged without reprocessing.

**Cause:** Provider retried a webhook that was already processed successfully.

**Fix:** Expected behaviour — idempotent processing is by design. Confirm the original event was processed correctly by checking the entitlement state.

**Related:** ERR-131

---

### ERR-133 — Entitlement not activated — payment not verified

| Field | Value |
|---|---|
| **Code** | ERR-133 |
| **Event name** | `payment.entitlement_failed` |
| **HTTP status** | N/A (user sees "payment pending" state) |
| **Severity** | critical |
| **Where** | Server log, admin entitlements view |

**Description:** A user completed a checkout browser redirect but the entitlement was not granted because the payment was not server-side verified.

**Cause:** (a) Webhook not yet received; (b) webhook processing failed; (c) client-redirect-only activation attempted (prohibited).

**Fix:** Entitlements are granted ONLY after server-side webhook verification (never on browser redirect). Check `payment_webhook_events` for the order. If the webhook was not received, check provider dashboard webhook delivery logs.

**Related:** ERR-131, Risk R-15, Risk R-16

---

## How to report a new error

1. Add a new `ERR-XXX` entry in the correct category block.
2. Fill all fields (code, event name, HTTP status if applicable, severity, where, description, cause, fix, related).
3. If the error is surfaced to end users, add a user-facing message to `src/lib/error-messages.ts` (create if not exists).
4. Update `Last updated` and `Version` in the header.
5. Reference the error code in the relevant TODO-List.md item.

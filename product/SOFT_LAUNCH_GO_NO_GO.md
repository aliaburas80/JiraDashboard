# Delivery Clarity — Soft Launch Go/No-Go

**Status:** Current production checklist  
**Production:** `https://deliveryclarity.app` on Hostinger Managed Node/Web Apps  
**Purpose:** Final evidence required before inviting external soft-launch testers.

> `product/MANUAL_TESTS.md` contains useful historical detail but still references the former Render deployment in several commands and log instructions. For the soft launch, this file is the canonical production checklist. Use `deliveryclarity.app` and Hostinger/Neon operations unless a test explicitly says otherwise.

## Go/No-Go rule

Do not invite external testers until every **RED gate** below is green or has a documented owner-approved exception.

| Gate | Required evidence | Pass condition |
|---|---|---|
| RED-01 AI runtime | Production Intelligence response | Executive/Forecast return AI mode on `qwen3.5:9b`; Flow/Risk return AI mode on `qwen3.5:4b`; stopping runtime falls back to Evidence mode without page failure |
| RED-02 Email links | Fresh production emails | New verification and password-reset emails use `https://deliveryclarity.app/...`; both links open and complete successfully before expiry |
| RED-03 Production journey | Fresh external-style account | Register → verify → login → sample/upload → dashboard → Intelligence → export → feedback → logout/login completes on desktop and phone |
| RED-04 Metric sanity | Known datasets | Headline counts and key formulas agree with source data; no contradictory blocked/risk signals |
| RED-05 Recovery | Neon + independent backup | Neon PITR is available; one independent `pg_dump` reaches private S3; one restore/check is completed against a scratch database, never production |

---

## RED-01 — Self-hosted AI runtime

Canonical runbooks:
- `product/AI_RUNTIME_DEPLOYMENT.md`
- `ops/ollama/README.md`

Production variables:

```text
OLLAMA_BASE_URL=https://ai.deliveryclarity.app
OLLAMA_AUTH_TOKEN=<server-side-secret>
OLLAMA_FAST_MODEL=qwen3.5:4b
OLLAMA_DEEP_MODEL=qwen3.5:9b
```

Required runtime checks:

1. Ollama listens only on localhost/private interface; public TCP `11434` is closed.
2. `qwen3.5:4b` and `qwen3.5:9b` are installed.
3. Protected HTTPS gateway rejects a request without its bearer token.
4. Flow & Risk show AI mode with `qwen3.5:4b`.
5. Executive & Forecast show AI mode with `qwen3.5:9b` (4b retry is acceptable only as a documented degradation test, not normal steady state).
6. Stop/block the runtime and confirm the page returns Evidence mode instead of an error.

**Do not mark this gate green while the production response says `Self-hosted AI runtime unavailable`.**

---

## RED-02 — Email verification and password reset

Use a brand-new soft-launch test account. Never reuse an old token because verification/reset tokens expire.

### Verification

1. Register from `https://deliveryclarity.app/register`.
2. Confirm a new `Verify your email — Delivery Clarity` email arrives.
3. Inspect the button destination without sharing the token. It must start with:
   `https://deliveryclarity.app/verify-email?token=`
4. It must **not** start with `www.deliveryclarity.app` or any old Render hostname.
5. Click it before expiry and confirm verification completes.
6. Sign in and confirm upload access is no longer blocked by email verification.

### Password reset

1. From `https://deliveryclarity.app/forgot-password`, request a reset for the same test account.
2. Confirm a fresh reset email arrives.
3. Button must start with:
   `https://deliveryclarity.app/reset-password?token=`
4. Set a new valid password before the 1-hour token expiry.
5. Confirm the old password fails and the new password succeeds.

---

## RED-03 — Production user journey

Run once on desktop Chrome and once at phone width / a real phone.

1. Public landing loads over HTTPS with no certificate warning.
2. Register a fresh account and complete RED-02 verification.
3. Login succeeds and the session survives a normal page refresh.
4. Try the sample-data path.
5. Upload a valid Jira CSV/XLS/XLSX export.
6. Confirm the dashboard populates and no loading/error state is stuck.
7. Open Delivery Intelligence and ask at least:
   - one suggested question;
   - one free-form metric question;
   - one named Jira-key/person/epic question supported by the data.
8. Export at least one report/data file and open the downloaded output.
9. Submit in-app feedback and confirm the success acknowledgement.
10. Logout; browser Back must not restore an authenticated page.
11. Login again and confirm the user's current analysis remains available according to the configured storage mode/trial rules.

Existing CI exercises the core login → forced password change → upload → populated dashboard path. This production pass is still required because it validates Hostinger, email delivery, browser cookies, real redirects, and production configuration.

---

## RED-04 — Metric sanity

Use three datasets where expected results are independently knowable:

- **Small:** 10–50 issues, manually countable.
- **Medium:** representative team/project export.
- **Large:** 3,000–7,000 issues for scale/performance and aggregate sanity.

For each dataset record expected vs displayed values for:

- total issues;
- Done issues and completion rate;
- active issues;
- blocked issues;
- open defects;
- average lead time and sample size;
- average cycle time and sample size;
- committed/completed story points where present;
- sprint count/commitment where present;
- forecast state/date only when sufficient data exists.

### Blocked-work rule

For upload-based soft launch data, workflow `Status = Blocked` is authoritative even if the optional `Blocked Flag` custom field is missing or false. Headline `blockedIssues`, risk metrics, Flow items, and Intelligence evidence must agree.

Do not accept `Status: Blocked` together with `blocked: false` in an Intelligence snapshot.

---

## RED-05 — Backup and restore

Canonical runbook: `product/DATABASE_BACKUP_RESTORE.md`.

### Neon primary recovery

1. In Neon, confirm the production project/branch has point-in-time recovery capability for the current plan.
2. Record the available retention window at test time rather than hardcoding it in product documentation.
3. Perform recovery validation using a new/scratch branch or another non-production target.
4. Confirm the restored scratch data is readable and structurally valid.
5. Never run a destructive restore command against production as a launch test.

### Independent S3 backup

The scheduled `.github/workflows/db-backup.yml` requires:

```text
NEON_DIRECT_DATABASE_URL
DB_BACKUP_AWS_ACCESS_KEY_ID
DB_BACKUP_AWS_SECRET_ACCESS_KEY
DB_BACKUP_S3_BUCKET
DB_BACKUP_S3_REGION
```

Before marking green:

1. Secrets above are configured with least privilege.
2. S3 `db-backups/` retention/lifecycle is configured.
3. Trigger one manual Database Backup workflow.
4. Confirm the job succeeds.
5. Confirm a new encrypted object exists under `db-backups/`.
6. Validate the dump with `pg_restore --list` or restore it to a scratch database.
7. Query several known tables/rows in the scratch restore.

---

## Launch decision record

Fill this only after executing the checks above.

| Gate | Status | Date | Evidence / notes |
|---|---|---|---|
| RED-01 AI runtime | ⬜ | | |
| RED-02 Email links | ⬜ | | |
| RED-03 Production journey | ⬜ | | |
| RED-04 Metric sanity | ⬜ | | |
| RED-05 Backup/restore | ⬜ | | |

**Decision:** ⬜ GO / ⬜ NO-GO  
**Approved by:**  
**Date:**

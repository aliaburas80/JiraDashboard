# EP-028 — Staging Deployment

**Status:** In progress  
**Depends on:** EP-025 CI/CD Production Gates  
**Next:** EP-029 Controlled Pilot

## Goal

Deploy and verify an isolated, production-shaped staging environment for both Delivery Clarity runtimes before any controlled pilot begins.

EP-028 is not complete merely because the repository builds. It is complete only when a remote staging user app and a remote separate Admin app are deployed from the same tested commit and the staging smoke evidence is green.

## Required staging topology

| Component | Requirement |
|---|---|
| User app | Dedicated non-production HTTPS origin |
| Admin app | Separate dedicated non-production HTTPS origin |
| Database | Dedicated staging PostgreSQL/Neon database; never production data |
| Object storage | Dedicated staging bucket or isolated staging prefix |
| User session | Dedicated staging `SESSION_SECRET` |
| Admin session | Dedicated staging `ADMIN_SESSION_SECRET`, different from `SESSION_SECRET` |
| Config encryption | Dedicated staging `CONFIG_ENCRYPTION_KEY` |
| Admin cutover | User app `ADMIN_APP_URL` points to the staging Admin origin |
| Registration | Keep disabled unless a specific pilot test requires it |

Suggested naming only (actual DNS may differ):

- user: `https://staging.deliveryclarity.app`
- admin: `https://admin-staging.deliveryclarity.app`

The production user origin `https://deliveryclarity.app` must not be used as the EP-028 staging target.

## Deployment model

Deploy **two managed Node applications from the same Git commit**.

### User staging service

Build command:

```bash
npm ci && npm run build
```

Start command:

```bash
npm start
```

`scripts/start-production.mjs` validates the production environment, applies Prisma migrations, honors the platform `PORT`, and starts the user runtime.

### Admin staging service

Build command:

```bash
npm ci && npm run admin:build
```

Start command:

```bash
node scripts/start-admin-production.mjs
```

The Admin entrypoint applies Prisma migrations, honors the managed platform `PORT`, and validates that the Admin session secret is not the user session secret.

Both services use the **same staging database**, but they remain separate HTTP/session boundaries.

## Minimum environment contract

### User staging service

Required or explicitly configured:

- `NODE_ENV=production`
- `DATABASE_URL=<staging PostgreSQL pooled URL>`
- `SESSION_SECRET=<staging-only 32+ char secret>`
- `CONFIG_ENCRYPTION_KEY=<staging-only 32+ char key>`
- `APP_URL=<staging user origin>`
- `NEXT_PUBLIC_APP_URL=<staging user origin>`
- `ADMIN_APP_URL=<staging Admin origin>`
- `STORAGE_DRIVER=s3|azure|gcp`
- matching storage credentials/bucket/prefix
- `ALLOW_OPEN_REGISTRATION=false`
- `NEXT_PUBLIC_ALLOW_REGISTER=false`

### Admin staging service

Required or explicitly configured:

- `NODE_ENV=production`
- `DATABASE_URL=<same staging PostgreSQL URL>`
- `ADMIN_SESSION_SECRET=<different staging-only 32+ char secret>`
- `CONFIG_ENCRYPTION_KEY=<same staging config-encryption key>`
- `ADMIN_APP_URL=<staging Admin origin>`
- `SESSION_SECRET=<user staging secret>` only when available so startup can prove the two secrets differ

Never copy production database credentials, production session secrets, production MFA secrets, or production object-storage data into staging.

## Owner Admin bootstrap

After the staging database is reachable and before the first manual Admin test:

1. Set staging-only `OWNER_ADMIN_EMAIL`, `OWNER_ADMIN_NAME`, and a strong temporary `OWNER_ADMIN_PASSWORD` outside source control.
2. Run `npm run owner:admin:bootstrap` against the staging database.
3. Sign in to the staging Admin app.
4. Enroll MFA and save the staging recovery codes securely.
5. Do not reuse the production Owner Admin password or MFA seed.

## Automated remote verification

Run GitHub Actions → **Staging Smoke** → **Run workflow** and provide:

- `user_app_url`
- `admin_app_url`
- optional `expected_version`

The workflow runs `scripts/verify-staging.mjs` and uploads `ep-028-staging-verification` evidence.

The verifier proves:

- user `/api/health` is healthy;
- user `/api/ready` confirms PostgreSQL readiness;
- user `/login` is reachable;
- retired user-app `/api/admin/users` returns `410`;
- old user-app `/admin/settings` redirects to the separate staging Admin origin;
- Admin `/api/health` is healthy;
- Admin `/login` is reachable;
- unauthenticated Admin `/api/auth/me` returns `401`;
- user and Admin are on different origins;
- remote staging uses HTTPS;
- the production user origin is rejected as a staging target.

The remote smoke workflow intentionally accepts **no Admin password, MFA token, recovery code, or user password**. Authenticated adversarial coverage remains in EP-027 E2E; EP-028 checks the deployed staging boundary without leaking credentials into workflow inputs or artifacts.

## Manual staging acceptance

After the automated smoke is green:

- [ ] User login succeeds with a staging test account.
- [ ] Owner Admin password + MFA login succeeds on the separate Admin origin.
- [ ] User-app `/admin/*` visibly hands off to the separate Admin login/runtime.
- [ ] A representative Jira export uploads successfully and opens the dashboard.
- [ ] Excel export succeeds.
- [ ] A share link behaves as expected for the staging configuration.
- [ ] Users/Audit/Feedback remain organization-scoped in Admin.
- [ ] Owner-only Diagnostics/System Errors/Settings deny a normal org Admin.
- [ ] No production users, imports, audit rows, storage objects, or credentials appear in staging.
- [ ] Staging deployment commit SHA is recorded.
- [ ] `ep-028-staging-verification` artifact is retained with the pilot record.

## Acceptance criteria

EP-028 is complete when all of the following are true:

- [x] Staging deployment contract is documented.
- [x] Separate Admin managed-host start command supports injected `PORT`.
- [x] Remote staging verifier exists and is credential-free.
- [x] Manual `Staging Smoke` workflow exists and stores evidence.
- [x] Regression test prevents silent removal of the staging/security contract.
- [ ] Dedicated staging user origin is deployed.
- [ ] Dedicated staging Admin origin is deployed from the same commit.
- [ ] Dedicated staging database and object-storage boundary are confirmed.
- [ ] Automated remote staging smoke is green against those origins.
- [ ] Manual authenticated staging acceptance is complete.

## External deployment boundary

The repository changes can prepare and verify staging, but provisioning DNS/managed Hostinger applications and setting their environment secrets must occur in the hosting account. Until those remote origins exist, EP-028 remains **In progress** and EP-029 must not start.

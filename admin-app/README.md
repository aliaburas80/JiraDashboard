# Delivery Clarity — Separate Admin Application

EP-022 establishes the administration console as a separate Next.js runtime and authentication boundary. EP-023 adds the protected Owner Admin bootstrap and mandatory TOTP MFA. EP-024 moves operational administration into this runtime and retires the embedded user-app Admin console.

## Local commands

```bash
npm run admin:dev       # http://localhost:3001
npm run admin:typecheck
npm run admin:build
npm run admin:start     # http://localhost:3001
```

## Required production environment

- `DATABASE_URL` — shared Delivery Clarity PostgreSQL database
- `ADMIN_SESSION_SECRET` — dedicated admin-session encryption secret; must not equal `SESSION_SECRET`
- `CONFIG_ENCRYPTION_KEY` — encrypts TOTP and saved credentials
- `ADMIN_SESSION_TTL_HOURS` — optional, defaults to 4
- `ADMIN_APP_URL` — dedicated Admin deployment URL; required for the user-app `/admin/*` cutover

The console uses the `dc_admin_session` cookie. It does not accept or reuse the user application's `dc_session` cookie.

## Owner Admin bootstrap

Set production values outside source control:

- `OWNER_ADMIN_EMAIL`
- `OWNER_ADMIN_NAME`
- `OWNER_ADMIN_PASSWORD` — first creation or explicit rotation
- `OWNER_ADMIN_PROMOTE_EXISTING=true` — intentional promotion only
- `OWNER_ADMIN_ROTATE_PASSWORD=true` — intentional rotation only

Run:

```bash
npm run owner:admin:bootstrap
```

For emergency MFA recovery:

```bash
npm run owner:admin:reset-mfa
```

If an already-issued Admin session must be invalidated immediately, rotate `ADMIN_SESSION_SECRET` at the same time.

## MFA flow

1. Administrator enters email and password.
2. The server creates only a pre-MFA session; protected Admin routes remain inaccessible.
3. On first sign-in, the administrator enrolls a TOTP authenticator using the displayed setup key/URI.
4. A valid 6-digit TOTP enables MFA and completes the Admin session.
5. Eight single-use recovery codes are shown once and stored only as keyed hashes.
6. Later sign-ins require a fresh TOTP or one recovery code.
7. A TOTP time-step cannot be replayed, and MFA attempts have a separate rate limit.

## EP-024 operational pages

The separate Admin runtime now owns the operational Admin UI and matching API surface:

### Organization-scoped Admin

- **Overview** — organization users, audit activity and feedback queue
- **Users** — create, activate/disable, change roles, delete and dry-run/reset workspace data
- **Audit** — organization audit events, filters and security activity summary
- **Feedback** — organization feedback queue, status workflow and admin notes

### Owner Admin only

- **System Errors** — deployment-wide system error list, retry and resolve actions
- **Diagnostics** — deployment health, sessions, imports, storage and environment readiness
- **Security** — production security checklist
- **Settings** — application URL, SMTP and shared Jira credential configuration/testing

Legacy `Logs` operational visibility is covered by **Audit + System Errors**. The old Theme page is not part of the operational security boundary and is not migrated as an EP-024 operation.

## Authorization rules

- Every `/api/ops/*` route requires a fully authenticated Admin session: password + MFA + active `role=admin` account.
- Organization-scoped pages use the administrator's server-derived `organizationId`; organization IDs are never accepted from client input.
- Deployment-wide pages require `isSuperAdmin=true` through `requireOwnerAdmin()`.
- New organization-scoped Prisma access is centralized in `src/server/tenancy/adminOperationalRepository.ts`.
- The embedded user-app `/admin/*` layout redirects to `ADMIN_APP_URL`; it no longer renders operational controls or trusts the user-app session as an Admin-console session.

## Cutover verification

Before production cutover:

1. Deploy the Admin runtime independently.
2. Set `ADMIN_APP_URL` on the user app to the dedicated Admin origin.
3. Verify Owner Admin bootstrap and MFA enrollment/recovery.
4. Verify Users, Audit, Feedback, System Errors, Diagnostics, Security and Settings.
5. Confirm `/admin/*` on the user app redirects to the separate Admin origin.
6. Run Quality + E2E on the exact merge head.

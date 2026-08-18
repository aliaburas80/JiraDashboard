# Delivery Clarity — Separate Admin Application

EP-022 establishes the administration console as a separate Next.js runtime and authentication boundary. EP-023 adds the protected Owner Admin bootstrap and mandatory TOTP MFA for every administrator using this runtime.

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
- `CONFIG_ENCRYPTION_KEY` — encrypts the TOTP secret and hashes recovery codes
- `ADMIN_SESSION_TTL_HOURS` — optional, defaults to 4
- `ADMIN_APP_URL` — deployment URL / dedicated admin host

The console uses the `dc_admin_session` cookie. It does not accept or reuse the user application's `dc_session` cookie.

## Owner Admin bootstrap

Set the following production variables without committing their values:

- `OWNER_ADMIN_EMAIL`
- `OWNER_ADMIN_NAME`
- `OWNER_ADMIN_PASSWORD` — required for first creation or an explicit password rotation
- `OWNER_ADMIN_PROMOTE_EXISTING=true` — only when intentionally promoting an existing non-owner account
- `OWNER_ADMIN_ROTATE_PASSWORD=true` — only when intentionally rotating the current Owner Admin password

Run:

```bash
npm run owner:admin:bootstrap
```

The command is idempotent for the configured Owner Admin and refuses to create a second `isSuperAdmin=true` account. It also refuses to silently promote an existing normal account.

For emergency MFA recovery:

```bash
npm run owner:admin:reset-mfa
```

This removes the Owner Admin's stored MFA enrollment and forces fresh enrollment on the next Admin-console sign-in. If an already-issued Admin session must be invalidated immediately, rotate `ADMIN_SESSION_SECRET` at the same time.

## MFA flow

1. Administrator enters email and password.
2. The server creates only a pre-MFA session; protected Admin routes remain inaccessible.
3. On first sign-in, the administrator enrolls a TOTP authenticator using the displayed setup key/URI.
4. A valid 6-digit TOTP enables MFA and completes the Admin session.
5. Eight single-use recovery codes are shown once and stored only as keyed hashes.
6. Later sign-ins require a fresh TOTP or one recovery code.
7. A TOTP time-step cannot be replayed, and MFA attempts have a separate rate limit.

The TOTP secret is encrypted at rest through the existing AES-256-GCM `CONFIG_ENCRYPTION_KEY` helper. No QR or third-party enrollment service receives the secret.

## EP-022 / EP-023 boundary

The separate runtime now includes independent login, logout, session validation, health check, Owner Admin bootstrap, mandatory MFA, recovery codes, audit events, and a separate build/start lifecycle. Only active users whose database role is `admin` can establish an Admin session, and password-only sessions cannot reach protected Admin pages or APIs.

Operational pages from the embedded `/admin/*` application are intentionally not linked here yet. Their migration remains EP-024, after this security boundary is proven in CI and deployed independently.

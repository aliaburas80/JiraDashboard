# Delivery Clarity — Separate Admin Application

EP-022 establishes the administration console as a separate Next.js runtime and authentication boundary.

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
- `ADMIN_SESSION_TTL_HOURS` — optional, defaults to 4
- `ADMIN_APP_URL` — deployment URL / dedicated admin host

The console uses the `dc_admin_session` cookie. It does not accept or reuse the user application's `dc_session` cookie.

## EP-022 boundary

This foundation includes independent login, logout, session validation, health check, runtime protection, and a separate build/start lifecycle. Only active users whose database role is `admin` can establish an admin session.

Operational pages from the embedded `/admin/*` application are intentionally not linked from this foundation. Their migration belongs to EP-024, after this security boundary is proven in CI and deployed independently.

Owner bootstrap and admin MFA remain EP-023.

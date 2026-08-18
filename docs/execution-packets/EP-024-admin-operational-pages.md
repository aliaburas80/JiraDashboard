# EP-024 — Admin Operational Pages

## Goal

Move operational administration out of the user-facing application and into the separate MFA-protected Admin runtime established by EP-022/EP-023.

## Migrated organization-scoped operations

- Overview
- User management
- Workspace-data reset preview/confirm
- Audit events and activity summary
- Feedback review/status workflow

All organization-scoped operations derive `organizationId` from the authenticated administrator identity on the server. Client-supplied organization identifiers are not accepted.

## Owner Admin operations

The following deployment-wide surfaces require `isSuperAdmin=true`:

- System Errors
- Diagnostics
- Security checks
- Deployment Settings / App Config

## Authentication boundary

Every operational route requires a fully authenticated separate-Admin session:

1. Admin password accepted
2. TOTP/recovery second factor accepted
3. Active database account with `role=admin`
4. Owner-only operations additionally require `isSuperAdmin=true`

The user-facing `dc_session` cookie is not accepted by the Admin runtime.

## User-app cutover

The embedded `app/admin/*` UI is retired. Its layout redirects to `ADMIN_APP_URL`, and production fails closed when that variable is not configured.

## Legacy consolidation

- Legacy Logs visibility is covered by Audit + System Errors.
- Theme customization is not an operational security function and remains outside EP-024.

## Verification gate

- Admin app typecheck
- Repo lint
- Jest, including EP-024 boundary regression coverage
- User app production build
- Separate Admin production build
- Existing Playwright critical-path E2E suite

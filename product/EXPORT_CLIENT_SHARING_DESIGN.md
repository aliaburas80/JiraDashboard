# Export & Client Sharing — Design Decision

**Status:** Accepted implementation decision · 2026-08-18  
**Scope:** `EXPORT-04–07`, first usable slice of `SHARE-01–06`

## Decision

Delivery Clarity uses two deliberately different reporting formats:

- **Excel (`.xlsx`) = explore the data.** The existing insight workbook remains the detailed analytical artifact: summary, flow, sprint/delivery, forecast, risks, work items, and data-quality context.
- **PDF = communicate the story.** The existing executive print view remains the concise stakeholder artifact and is opened as a print-ready report so the browser can save a real PDF without introducing a second PDF-rendering stack.
- **Share link = safely show the story.** A share is a sanitized, immutable report payload, not a doorway into the authenticated dashboard.

The canonical section definitions live in `src/config/exportCatalog.ts`. Deterministic export naming lives in `src/services/export/exportMetadata.service.ts`.

## Client-sharing security model

A share URL is `/share/{token}`. The token is a 256-bit random capability generated with Node `crypto.randomBytes(32)` and encoded as base64url. Only a SHA-256 hash is persisted. The raw token is returned once when the link is created and is never stored in the server record.

The first usable release stores the share record in the existing server-side `AppSetting` persistence table under the creator's `ownerId`; the key contains only the token hash. The value contains a versioned, sanitized stakeholder-report DTO plus expiry, revocation, last-accessed, and access-count metadata. This avoids exposing raw Jira rows, authenticated dashboard APIs, sessions, account data, or internal resource IDs to recipients.

The public page resolves the hash server-side, rejects invalid/revoked/expired capabilities, verifies that the issuing account is still active, updates last-access/access-count, and renders only the sanitized DTO. It has no authenticated AppShell/navigation surface and is marked `noindex,nofollow`.

Share creation and revocation are authenticated, same-origin mutations and are written to the audit trail. A user in **local-storage mode cannot create a server-backed public share**: local mode's existing privacy contract says Jira data and derived data remain in the browser, so the API fails closed and the UI explains that Excel/PDF exports remain available locally.

Because the first slice deliberately reuses `AppSetting` rather than a first-class foreign-keyed share model, lifecycle cleanup is explicit: account-deletion requests and user-data resets delete owned report-share rows, inactive/deleted owners cannot resolve public links, and the daily retention job removes any share rows left for inactive or missing owners.

## Scope deliberately excluded from this slice

- Raw Jira rows are never included in the public share payload.
- A previously created link cannot be reconstructed from storage because the raw token is intentionally not persisted; users can revoke it and create a new link instead.
- Direct email delivery (`SHARE-05`) is not part of this slice; copying the newly created secure link is supported.
- The existing Excel exporter does not gain native embedded Excel chart objects in this slice.
- PDF generation uses the existing print-ready executive report/browser Save-as-PDF flow rather than adding a server-side binary PDF dependency.

These are explicit follow-on enhancements, not reasons to weaken token storage or authenticated/public surface isolation.

## Documentation impact

Updated: this decision document; `/reports` is self-explanatory user-facing UI.  
Not affected in this slice: glossary terminology, Jira integration documentation, deployment procedure.  
Reason: no new Jira API contract or deployment mechanism is introduced.

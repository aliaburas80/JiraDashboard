# ORG-01–43 — Multi-Tenant Organization Management: Design Document

**Status:** Design — not approved for implementation as a whole. A first Phase 1 slice (schema, migrations, `scopedRepository`, ESLint boundary rule, isolation unit tests — see TODO-List.md `ORG-04`/`05`/`05b`/`08`) is partially implemented on `feature/org-phase1-tenant-isolation`, held unmerged. Everything else, including the rest of Phase 1, remains design-only — required reading before any further `ORG-*` code is written (per `TODO-List.md` Section 20a's gate).
**Owner:** Ali Abu Ras
**Created:** 2026-06-27 (updated repeatedly same day — added the Organization Application & Owner Approval workflow, §4; structured rejection feedback and resubmission, §4.4.1/§4.4.2; Per-Organization Settings, §7a)
**Closes:** `ORG-01`–`ORG-43` in `TODO-List.md` Section 20a (P1 — Multi-Tenant Organization Management)
**Depends on:** Coordinates with `AIPLAN-03` (`organisationId` on canonical models, from the separate self-hosted-AI plan in Section 28) — this design is the authoritative schema owner; `AIPLAN-03` should consume this design's migration rather than run a second one.

---

## 1. Why this exists

Delivery Clarity today is **single-tenant in practice, multi-user in name**. Every `User` row lives in one shared database with no organizational boundary above it — `canViewAllImportData()` lets `admin`/`manager`/`c_level` roles see *every* user's uploads, and there is no concept that two companies using the same deployment should never see each other's data, because today there is only ever one deployment per company (it's installed/run per customer, not offered as a shared hosted product).

This design introduces an explicit **Organization** boundary so the app can safely run as a shared multi-customer product: each company applies to join (§4 — reviewed and approved by the platform owner, not self-serve instant signup), its users only ever see their own organization's data, and a seat limit and branding identity belong to the organization rather than floating free. The core promise this design must deliver, stated as a non-functional requirement: **zero data overlap between organizations, under any code path, by construction — not by convention.**

**Explicitly out of scope for this design** (separate future efforts): billing/payment processing, org-to-org data sharing/collaboration features, SSO/SAML (only domain-ownership verification is in scope, not enterprise SSO), and the companion mobile app (`MOBILEAPP-*`) and client-export-sharing (`EXPORT-*`/`SHARE-*`) work, both of which are explicitly gated on this design landing first.

---

## 2. Data model

### 2.1 New `Organization` model

```prisma
model Organization {
  id            String    @id @default(cuid())
  name          String
  domain        String    @unique          // verified domain, e.g. "ali.com" — lowercase, no scheme
  domainVerifiedAt DateTime?                // null until ORG-12 verification completes
  logoUrl       String?
  maxSeats      Int       @default(6)       // ORG-10 (confirmed): fixed at ASSIGNABLE_ROLES.length, never admin-editable
  status        String    @default("active") // "active" | "suspended" — ORG-16, non-destructive
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  users User[]

  @@index([domain])
  @@index([status])
}
```

### 2.2 `organizationId` on every canonical model

Per `ORG-04`, every table that stores org-owned data gets a non-nullable `organizationId String` foreign key to `Organization`, with `onDelete: Cascade` from the org side reserved for the explicit deletion flow in §10 (never an accidental cascade from a user delete). This applies to: `User`, `Session` (inherited via `User`, no direct column needed), `ImportLog`, `DashboardSnapshot`, `AuditEvent`, `UserAddRequest`, `Notification`, `JiraConnection`. `SystemErrorLog` is the one explicitly org-agnostic table — it's an internal ops log of Prisma-level failures, not org-owned business data, and stays global so platform admins can debug across the whole deployment.

### 2.3 Single-occupancy roles — `ORG-10`, confirmed 2026-06-27

**Confirmed with the user as a hard, universal constraint** (not plan-gated): every organization may have **exactly one user per role**, always. Since `ASSIGNABLE_ROLES` has 6 values (`admin`, `scrum_master`, `product_owner`, `manager`, `c_level`, `user`), this means every organization is capped at exactly 6 users, with no path to more. Consequences this drives elsewhere in the design:

- **`maxSeats` is not admin-editable** — it is always exactly the count of `ASSIGNABLE_ROLES` (6), derived, not configured. `ORG-02`/`ORG-21` ("seat-limit-reached experience") are still needed, but the limit itself is fixed, not a plan tier.
- **`Organization.plan`/`"solo"`/`"team"` distinction from the earlier draft of this section is removed** — there is only one shape.
- **Assigning a role already held by another user in the same org must reassign-with-confirmation** (`ORG-10`'s original acceptance criterion) — e.g. promoting a second user to `admin` demotes the current `admin` to `user` (or another open role) only after an explicit confirmation step, never silently.
- **Org growth beyond 6 people is out of scope for this org model entirely** — a company that outgrows 6 users is not a target customer for this product shape; this is a deliberate, confirmed product boundary, not an oversight.

---

## 3. Tenant data isolation — the actual security-critical part

This is the section the "no data overlapping, full security" requirement lives in. Two independent layers, neither allowed to be the only one:

### 3.1 Layer 1 — mandatory shared data-access module (`ORG-05`)

No feature is permitted to call `prisma.<model>.findMany/findUnique/update/delete` directly for any org-scoped model. Instead, a new `src/server/tenancy/scopedRepository.ts` wraps every such call and injects `where: { organizationId: session.organizationId, ...callerWhere }` automatically:

```ts
export function scopedRepository(organizationId: string) {
  return {
    importLog: {
      findMany: (args: Prisma.ImportLogFindManyArgs) =>
        prisma.importLog.findMany(withOrgScope(args, organizationId)),
      // ...same pattern for create/update/delete/findUnique
    },
    // one entry per org-scoped model
  };
}
```

A lint rule (ESLint custom rule, per CLAUDE.md §49's "custom local rule" pattern) bans direct `prisma.<orgScopedModel>.*` calls outside `src/server/tenancy/` and a short allowlist (migration scripts, the scoped-repository module itself). This makes "a route forgot the org filter" a build-time error, not a runtime hope.

### 3.2 Layer 2 — defense-in-depth (`ORG-05a`)

Layer 1 is application code and can theoretically have a bug. A second, independent layer must hold even then:

- **Today (SQLite):** there is no SQLite equivalent of Postgres Row-Level Security. The second layer is a **mandatory integration test class** (§8) that attempts cross-org access through every route and asserts denial — not a runtime control, but the best available safety net pre-Postgres.
- **After `FUT-POSTGRES-01` lands:** add real Postgres RLS policies (`CREATE POLICY ... USING (organization_id = current_setting('app.current_org_id')::text)`) on every org-scoped table, with the app setting `app.current_org_id` per request via `SET LOCAL`. This is the genuine second layer — it holds even if every line of application code has a bug — and should be treated as a required follow-up, not an optional nice-to-have, once Postgres is available.

### 3.3 Authorization layer

`canViewAllImportData()` and friends (`src/lib/roles.ts`) currently mean "see all *users'* data" — they must be redefined to mean "see all data **within my organization**," never across organizations. The only role that may ever query across organizations is a new **platform-level** role (distinct from org `admin`), reserved for support/ops tooling, fully audited (`ORG-06`).

---

## 4. Organization Application & Owner Approval (`ORG-23`–`ORG-33`) — added 2026-06-27

**`ORG-01`'s original self-serve instant-registration shape is replaced by a gated application process**, per explicit user request. No organization is created automatically — every organization starts as a reviewed application, decided by a single accountable person: the platform owner. This is a deliberate product decision, not a placeholder: it keeps the customer roster curated, lets the owner vet who's joining a shared multi-tenant product, and gives the public-facing entry point a chance to be a genuine first impression rather than a bare signup form.

### 4.1 The Platform Owner — structurally singular, not just a role (`ORG-27`)

The Platform Owner is **not** a value of `AppRole` and is **not assignable through any admin UI, by anyone, including other admins**. It is bootstrapped once, outside the normal app (e.g. a `PLATFORM_OWNER_EMAIL` environment variable checked against `User.email` at runtime, or a one-time seed script setting a dedicated `User.isPlatformOwner` boolean column that has **no corresponding API field** — no PATCH route ever accepts it as input, so it cannot be set or unset through the application layer at all, only through a direct database migration/seed run by whoever controls the deploy). Consequences this drives:

- **Only the Platform Owner can approve or reject an `OrganizationRequest`** (§4.3). Not org admins (none exist yet for a pending applicant), not the cross-org "platform-level support role" mentioned in §3.3 — that support role, if it's ever introduced, is itself grantable only by the Owner and can never gain authority to act on Owner-level decisions or on the Owner's own account.
- **No code path may suspend, demote, delete, or reassign the Platform Owner.** Every admin-style mutation route must check "is the target the Platform Owner?" and refuse if so, structurally — not as a policy the Owner is just trusted to respect, but as a guard every such route must implement.
- There is exactly one Platform Owner account for this design (singular, matching "no one has any role over me"). If the product later needs more than one trusted reviewer, that's a deliberate future extension requiring its own decision — not an accidental side effect of this design.

### 4.2 Public-facing application entry point (`ORG-23`, `ORG-24`)

This is the *first* thing a prospective customer sees, and it must read as a polished, trustworthy product, not a bare form:

- **`/join` (or similar marketing-grade public route, no auth required):** a genuine landing page — value proposition, product highlights/screenshots, social proof if available, and a clear single primary call to action ("Apply to Join") — built with the same design-token/SCSS-module discipline as the rest of the app (CLAUDE.md §13–22), not a quick unstyled form bolted onto a route. This is explicitly a design/UX deliverable, not just a CRUD form — budget real UI/UX effort here, mirroring the polish already put into `/login`/`/landing`.
- **The application itself is a multi-step wizard**, not one long form — short steps reduce abandonment and let validation/photo upload feel guided rather than overwhelming:
  1. **Company basics:** legal/trading company name, industry, company size (headcount range), country.
  2. **Primary contact:** full name, title/role at the company, work email (must match the company's claimed domain — reuses the `EMAIL_FORMAT` pattern from `FR-316`), phone.
  3. **Organization domain:** the domain the org will operate under (e.g. `ali.com`) — format-validated here; *ownership* verification (still `ORG-12`, now run post-approval, see §4.4) happens later, not at this stage, since an unapproved applicant shouldn't be asked to prove DNS control before the Owner has even decided to consider them.
  4. **Why you're joining:** a required free-text "intended use case" field (mirrors the existing high-privilege-reason pattern in `RequestAddMemberModal.tsx` — required, minimum length enforced server-side, not just client-side, learning directly from the real gap found and fixed in `FR-316`).
  5. **Branding and verification photos:** company logo upload (becomes `Organization.logoUrl` on approval) plus one or more supporting photos/documents (e.g. a business-registration document, an office photo) that help the Owner make an informed decision — all validated by type/size/content per CLAUDE.md §38.4, never trusted by extension or declared MIME type alone.
  6. **Review screen:** every field shown back to the applicant for confirmation before submission — no surprise edits, no silent autocorrection.
  7. **Confirmation screen:** a genuine "thank you" state stating the application was received and giving a realistic response-time expectation — not a bare "submitted" toast.

### 4.3 Data model and submission (`ORG-25`)

```prisma
model OrganizationRequest {
  id                  String    @id @default(cuid())
  companyName         String
  industry            String?
  companySizeRange    String?
  country             String?
  contactName         String
  contactTitle        String?
  contactEmail        String
  contactPhone        String?
  requestedDomain     String
  useCase             String    // required, length-enforced server-side — see §4.2 step 4
  logoUploadUrl        String?
  supportingPhotoUrlsJson String? // JSON array — business doc / office photo / etc.
  status              String    @default("pending") // "pending" | "approved" | "rejected" | "withdrawn"
  ownerDecisionAt     DateTime?
  ownerDecisionNote   String?
  rejectionFieldsJson String?   // JSON array of RejectionField — see §4.4.1 — null unless status: "rejected"
  previousRequestId   String?   // ORG-35 — set when this submission is a resubmission after a rejection
  createdOrganizationId String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  previousRequest OrganizationRequest? @relation("OrganizationRequestResubmission", fields: [previousRequestId], references: [id], onDelete: SetNull)
  resubmissions   OrganizationRequest[] @relation("OrganizationRequestResubmission")

  @@index([status])
  @@index([requestedDomain])
}
```

`POST /api/organization-requests` is **public** (no auth — this is the front door for brand-new customers, by definition pre-account) but rate-limited per-IP, same `RATE_MAX`/`RATE_WINDOW_MS` pattern as `app/api/user-add-requests/route.ts`, to prevent the public form being used as a spam/DoS vector. On submission, the Platform Owner is notified (reuses the `Notification` model with a new `organization_request_submitted` type) — and, since the Owner is a single specific account, this can be a direct, immediate notification rather than a broadcast to "all admins."

### 4.4 Owner review queue and decision (`ORG-26`, `ORG-28`, `ORG-29`)

A dedicated Owner-only screen (mirrors `UserAddRequestsPanel.tsx`'s proven shape: filterable queue, expandable cards, decision note field) lists every `OrganizationRequest`, showing all submitted fields and rendering the uploaded logo/photos inline so the Owner can review without downloading attachments separately. Guarded by the Platform Owner check from §4.1 — **not** `role === 'admin'`, since a regular org admin must never reach this screen. If `previousRequestId` is set, the queue shows it's a resubmission with a link to the prior rejected request and its `rejectionFieldsJson`, so the Owner can see at a glance whether the gaps were actually addressed.

- **Approve** (`PATCH /api/owner/organization-requests/:id/approve`): creates the `Organization` row (`domainVerifiedAt` left null), creates the first `User` with role `admin` in that org, sets `createdOrganizationId`, writes an `organization_request_approve` audit event, and notifies the applicant's contact email that they're approved and the next step (domain verification, §4.5) is required before first login. Re-checks `status === "pending"` first (same already-decided guard pattern as `userAddRequests`' accept/reject routes) — an Owner reviewing two browser tabs can't double-approve.
- **Reject** (`PATCH .../reject`): requires `ownerDecisionNote` (unlike the optional note on the existing `UserAddRequest` reject flow — rejecting a whole company's application deserves an explained reason, not just a status flip), notifies the applicant, no `Organization` created. See §4.4.1 for the structured "what's missing" feedback this notification carries.

#### 4.4.1 Structured rejection feedback — "tell them what to fix" (`ORG-34`)

A free-text note alone forces the applicant to parse prose for what to change. The reject form instead pairs the required note with a **structured checklist** the Owner selects from, covering every section of the application wizard (§4.2):

```ts
export const rejectionFieldOptions = [
  'company_info',       // name/industry/size/country insufficient or implausible
  'contact_info',       // contact name/title/email/phone unverifiable
  'domain',              // domain format invalid, or looks unrelated to the company
  'use_case',            // justification too vague/short/generic
  'logo',                 // missing, wrong format, or unusable
  'supporting_documents', // missing or insufficient proof (registration doc, office photo, etc.)
  'other',                // covered only by the free-text note
] as const;
```

`PATCH .../reject` accepts `{ ownerDecisionNote: string; rejectionFields: RejectionField[] }`, requiring at least one of `rejectionFields` or a non-`other`-only combination to carry real signal — `other` alone still requires the note to actually say something. The rejection notification email/in-app message to the applicant enumerates each selected field with a short human-readable explanation (e.g. "Supporting documents: the uploaded file didn't clearly show proof of business registration") followed by the Owner's free-text note, then a direct link back to `/join` to reapply.

#### 4.4.2 Resubmission (`ORG-35`)

Rejection is not a dead end. The `/join` wizard accepts an optional `previousRequestId` (carried via the rejection email's reapply link, not guessable) and:

- Pre-fills every field from the prior submission except the ones flagged in `rejectionFieldsJson`, which start empty/highlighted so the applicant's attention goes straight to what needs fixing — they are not made to retype everything from scratch.
- Stores the link as `OrganizationRequest.previousRequestId` on the new row, so the Owner's queue (§4.4) can show full history rather than treating every resubmission as a stranger.
- Does **not** carry over `status` — every resubmission is a fresh `"pending"` row requiring a fresh decision; a rejection is never silently "auto-overturned" by a resubmission existing.
- Is rate-limited the same as any other submission (§4.3) — resubmission is not an exemption from abuse protection.

### 4.5 How this connects back to the rest of the design

§5 below ("Domain verification and activation") no longer describes a self-serve flow — it now describes **the step that happens after Owner approval**: the approved applicant verifies domain ownership (`ORG-12`, unchanged mechanism, just moved later in the sequence) and only then gets to actually log in and use the product. §3 (tenant isolation) is unchanged by this addition — this section only changes *how* an `Organization` row comes to exist in the first place, not what it means once it does.

---

## 5. Domain verification and activation (`ORG-11`, `ORG-12`) — runs after Owner approval

1. Once the Owner approves an `OrganizationRequest` (§4.4), the `Organization` row exists but is not yet fully active — its first admin user must still prove control of `requestedDomain` before they can log in.
2. **Domain ownership verification** (`ORG-12`), unchanged in mechanism from the original draft, just sequenced after approval rather than before any human review:
   - Preferred: DNS TXT record challenge (`_deliveryclarity-verify.ali.com` = a generated token), checked server-side with a "Verify" button and a documented propagation-wait state.
   - Fallback for domains without DNS access: a confirmation email loop to the registered contact email only, with a short-lived signed link — weaker than DNS but still proves control of *an* inbox at that domain, not just that the string matches.
3. On verification success, `Organization.domainVerifiedAt` is set and the first admin account becomes usable (can set their password and log in).
4. Every subsequent invite/signup for that organization (`ORG-11`) must have an email domain exactly matching `Organization.domain` — checked server-side, fail-closed, same pattern as the email-format fix shipped in `FR-316`.

This sequencing (review-then-verify, not verify-then-review) means the Owner is never asked to make a trust decision under time pressure from a half-finished DNS challenge, and an applicant never does DNS work for an application that might be rejected.

---

## 6. Login flow (`ORG-14`, `ORG-14a`)

Three-step form, but **not** three separate round-trips that leak information:

1. **Step 1 — domain.** User enters `ali.com`. Client-side this just advances to step 2; it does **not** call the server to check existence yet (avoids a cheap existence-probe endpoint).
2. **Step 2 — username + password.** Submitted together with the domain in one request to a single `POST /api/auth/login` call. The server looks up `Organization` by domain and `User` by `(organizationId, email)` together, and returns the **same generic error** ("Invalid domain, email, or password.") whether the domain doesn't exist, the user doesn't exist, or the password is wrong — and takes roughly constant time for all three cases (hash comparison happens against a dummy hash when the org/user lookup fails, to avoid a timing side-channel).
3. **Rate limiting** is per-IP **and** per-domain (not just per-account), so a domain string itself can't be cheaply enumerated by hammering step 1 with a wordlist — mirrors the existing `RATE_MAX`/`RATE_WINDOW_MS` pattern in `app/api/user-add-requests/route.ts`.

Account recovery (`ORG-19`) follows the identical generic-response, constant-time-feeling pattern.

---

## 7. Branding (`ORG-13`)

`Organization.logoUrl` points to a validated upload (CLAUDE.md §38.4: type/size/content-checked, not just extension) stored under the existing cloud-storage abstraction (`src/lib/storage/`), keyed by `organizationId`. Rendering reuses the existing icon/token registry pattern (CLAUDE.md §10.3) — the app shell reads `session.organization.logoUrl` and renders it wherever the app currently renders its own brand mark (header, exports, future shared reports), and that lookup is itself scoped by the caller's own `organizationId` — there is no code path where org A's logo URL is reachable from org B's session. The same upload-validation requirement applies to the logo/photos collected during the application step itself (§4.2).

The logo is one instance of a broader pattern — §7a generalizes it to every other piece of app-wide configuration that's currently a single global setting shared by the whole deployment.

---

## 7a. Per-Organization Settings — Theme, Issue Hierarchy, Thresholds, Retention, Storage, SMTP (`ORG-36`–`ORG-43`) — added 2026-06-27

Per explicit user request: every setting that currently affects the whole deployment must instead belong to one organization. Today, six categories of "global" configuration exist, none of them org-scoped:

| Category | Today | File/module |
|---|---|---|
| Theme/branding colors | Per-*browser* localStorage (`dc_theme_custom`, `dc_branding`) — not server-side at all | `src/lib/themeCustomizer.ts` |
| Issue type hierarchy | Single JSON file, shared by every user | `data/issue-type-hierarchy.json`, `src/services/settings/issueTypeHierarchy.service.ts` |
| Health/severity thresholds | Single JSON file, shared by every user | `data/health-thresholds.json`, `src/services/settings/thresholds.service.ts` |
| Data retention settings | Single JSON file | `data/retention-settings.json`, `src/services/settings/settings.service.ts` |
| Cloud storage provider config | Single JSON file (+ env var fallback) | `data/storage-settings.json`, `src/services/storage/storageProvider.ts` |
| SMTP / Jira token / app URL | Single encrypted blob (+ env var fallback) | `src/lib/app-config.ts` |

None of these have a Prisma model today — they're all disk-JSON or an encrypted cloud blob, read through a module-level in-memory cache. That caching pattern is **exactly why this needs care**: a process-wide cache keyed by nothing is itself an isolation bug waiting to happen the moment two organizations share a Node process (which they will, in this product).

### 7a.1 Data model — one settings home per organization

Rather than six new tables, add a single `OrganizationSettings` model, 1:1 with `Organization`, with one JSON column per category (mirroring the existing JSON-file shapes 1:1, so the migration in §7a.3 is a straight copy, not a redesign):

```prisma
model OrganizationSettings {
  id                     String   @id @default(cuid())
  organizationId         String   @unique
  themeJson              String?  // accent color, radius, font size, palette — was localStorage dc_theme_custom
  brandingJson           String?  // app name override, favicon — logoUrl itself stays on Organization (§7)
  issueTypeHierarchyJson String?  // was data/issue-type-hierarchy.json
  healthThresholdsJson   String?  // was data/health-thresholds.json
  retentionSettingsJson  String?  // was data/retention-settings.json
  storageSettingsJson    String?  // was data/storage-settings.json — credentials encrypted same as today
  smtpConfigJson         String?  // was the SMTP portion of app-config.ts — encrypted same as today
  updatedAt              DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
```

Each JSON column keeps its **existing** typed shape/schema (CLAUDE.md §9's runtime-validation requirement doesn't change — only *where* the validated blob lives changes, from a file path to a row). `getAppConfig()`/`getThresholds()`/etc. keep their existing function signatures and validation logic; only their storage backend changes, from `fs.readFile(path)`/cloud-blob-by-fixed-key to `scopedRepository(organizationId).organizationSettings.findFirst()`-equivalent (this model joins the `scopedRepository` pattern from §3.1 like every other org-owned table).

### 7a.2 Cache key must include `organizationId`

Every one of the six services above currently caches its parsed config in a module-level variable (`_cached`, `_cache`) with no key at all — fine for one organization, a cross-tenant leak risk for more than one. Each cache must become a `Map<organizationId, ParsedConfig>` (or be removed in favor of a short TTL), and every cache *read* must take `organizationId` as a required parameter — there is no "get the config" function anymore, only "get *this org's* config."

### 7a.3 Migration — same default-org pattern as Phase 1

When `prisma/backfillDefaultOrganization.ts` (§9, Phase 1) creates the one default organization for an existing single-tenant deployment, it must also read each of the six existing JSON files/encrypted blobs (if present) and write them verbatim into that default org's new `OrganizationSettings` row — an existing deployment's thresholds, hierarchy, retention rules, storage config, and SMTP settings must survive the migration unchanged, not reset to defaults. The original `data/*.json` files are left in place (read-only, unused) rather than deleted, as a rollback safety net, until an admin confirms the migrated settings are correct.

### 7a.4 Per-org admin UI

Every existing admin settings page/tab (Issue Type Hierarchy, Thresholds, Retention, Storage, App Config) keeps its current UI almost unchanged — only its data source changes from "the one global file" to "this admin's own organization's row." No cross-org admin can ever see or edit another organization's thresholds, hierarchy, branding, or credentials — enforced the same way as every other org-scoped read/write (§3).

### 7a.5 Theme/branding specifically — org default, user override stays local

Per-browser localStorage theme customization (`dc_theme_custom`) is a genuinely useful per-user preference (CLAUDE.md §7's "Level 4 — User preferences") and should **not** be deleted. Instead: `OrganizationSettings.themeJson` becomes the org's *default* theme (what a brand-new user in that org sees before they've customized anything), and a user's local override continues to take precedence once set — consistent with CLAUDE.md §7.1's "User preferences must not modify global product configuration" (here, "global" is now scoped to "this organization," not the whole deployment).

---

## 8. Required tests before this ships (`ORG-08`, `ORG-08a`, `ORG-32`, `ORG-43`)

Beyond ordinary CRUD-scoping tests, the adversarial pass must explicitly attempt and assert denial for:

- Direct object reference manipulation — authenticated as org A, request org B's `ImportLog`/`DashboardSnapshot`/`UserAddRequest`/`Notification` by guessing/incrementing IDs.
- Search/list endpoints — confirm no endpoint returns a count, name, or any fragment belonging to another org (including 404-vs-403 timing/response differences that could confirm an ID exists in another org).
- Bulk export endpoints — Excel/CSV export must filter by the caller's `organizationId` at the query layer, not just at the UI layer.
- Background/cron-style jobs (e.g. future scheduled Jira sync) — any job iterating "all `JiraConnection` rows" must iterate per-organization, never globally unscoped.
- Error messages — generic enough that a 403 doesn't accidentally confirm "that record exists, you're just not allowed to see it" vs. "that record doesn't exist at all."
- **`OrganizationSettings` specifically (`ORG-43`):** org A's admin saving a threshold/hierarchy/retention/storage/SMTP change must never affect org B's `OrganizationSettings` row; the six now-keyed-by-org caches from §7a.2 must never return another organization's cached value (the actual bug class this section exists to prevent); a brand-new org with no `OrganizationSettings` row yet must fall back to bundled safe defaults (CLAUDE.md §11.1), never another org's settings and never a crash.

Zero findings required before merge, per `ORG-08a` — this is a security review gate, not a backlog of follow-up tickets.

---

## 9. Migration plan for existing single-tenant deployments

Existing deployments have users and data with no `organizationId` at all. The migration must not silently destroy or merge anyone's data:

1. Add `Organization` table (additive, no existing-table impact).
2. Create exactly one `Organization` row per existing deployment — a "default" org seeded from the existing admin's email domain (or a placeholder domain requiring an admin to confirm/correct it post-migration if the existing admin's email isn't a real company domain, e.g. a personal Gmail used during development).
3. Add `organizationId` columns as **nullable** in the same migration, backfill every existing row to the default org's ID, then a **second** migration flips the columns to non-nullable — never a single migration that adds a non-nullable FK with no backfill step, which would simply fail against existing data.
4. This matches the existing project convention of nullable-then-backfill-then-tighten migrations (see how `mustChangePassword`/`isActive` were added to `User` with defaults rather than breaking existing rows).
5. **(§7a) Settings migration, same pass:** read each existing global settings file/blob (`data/issue-type-hierarchy.json`, `data/health-thresholds.json`, `data/retention-settings.json`, `data/storage-settings.json`, the SMTP portion of `app-config.ts`) and write it into the default org's new `OrganizationSettings` row, unchanged. Leave the original files in place, unused, as a rollback safety net rather than deleting them immediately.

---

## 10. Suspension and offboarding (`ORG-16`, `ORG-17`)

- **Suspension** sets `Organization.status = "suspended"`; the auth layer checks this on every login/session-refresh and rejects with a clear "account suspended, contact support" message — no data is touched, deleted, or modified. Reactivation is just flipping the flag back.
- **Export and deletion** (`ORG-17`): an org admin (or platform admin acting on the org's explicit request) can trigger a full data export (reuses the existing Excel/backup-export machinery, scoped to that one `organizationId`) and, separately, a full deletion request. Deletion is **not** instant — it follows the same non-destructive-by-default principle as the rest of this app: mark `status = "pending_deletion"` with a recorded grace period (e.g. 30 days, configurable), then a scheduled job performs the actual cascade delete after the grace period, writing a final `AuditEvent` before the org's own audit trail is itself deleted.

---

## 11. Rollout phases

This is large enough that it should not land as one PR:

1. **Phase 1 — schema + isolation core:** `Organization` model, `organizationId` backfill migration, `scopedRepository`, the ESLint boundary rule, and the `ORG-08`/`ORG-08a` test suite. No UI changes. This phase alone is what makes the "no data overlap" guarantee real — everything after this is UX around it. **Partially implemented 2026-06-27** on `feature/org-phase1-tenant-isolation` (unmerged) — schema/migrations/backfill complete, `scopedRepository` built and unit-tested, ESLint rule live with an explicit shrink-only allowlist of ~31 files not yet migrated. See TODO-List.md `ORG-04`/`05`/`05a`/`05b`/`07`/`08` for the precise done-vs-remaining split.
2. **Phase 2 — Organization Application & Owner Approval:** `ORG-23`–`ORG-33` (public `/join` landing page + wizard, `OrganizationRequest` model, Owner-only review queue, approve/reject, Platform Owner bootstrap). This is now the *only* way an `Organization` row gets created — must land before Phase 3 can mean anything.
3. **Phase 3 — domain verification, login:** `ORG-11`, `ORG-12`, `ORG-14`/`14a`, `ORG-19`.
4. **Phase 4 — admin experience:** `ORG-03`/`06`/`15`/`18`/`21` (seat-limit enforcement, org settings page, scoped admin, org audit log, seat-limit UX). `ORG-02` (the seat limit itself) is already fixed/derived per §2.3, not built here.
5. **Phase 5 — branding, suspension, offboarding, per-org rate limiting:** `ORG-13`, `ORG-16`, `ORG-17`, `ORG-20`.
6. **Phase 6 — `ORG-10` single-occupancy roles** (confirmed hard constraint, §2.3): role-reassignment-with-confirmation UX, and the derived (non-editable) 6-seat cap.
7. **Phase 7 — Per-Organization Settings (§7a):** `ORG-36`–`ORG-43` — `OrganizationSettings` model, the six service migrations (theme, issue hierarchy, thresholds, retention, storage, SMTP/app-config) off disk-JSON/single-blob storage and onto org-keyed caches, settings migration folded into the Phase 1 backfill script, and the isolation tests proving one org's settings can never leak into another's. Sequenced after Phase 1 because it reuses `scopedRepository` and the same backfill script.

Each phase gets its own branch, its own doc-impact-matrix pass, and its own full-suite verification — consistent with how `FCAST-14–26`/`RETRO-04–38` shipped.

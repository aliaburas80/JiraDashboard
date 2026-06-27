# ORG-01–22 — Multi-Tenant Organization Management: Design Document

**Status:** Design — not started, not approved for implementation. Required reading before any `ORG-*` code is written (per `TODO-List.md` Section 20a's gate).
**Owner:** Ali Abu Ras
**Created:** 2026-06-27
**Closes:** `ORG-01`–`ORG-22` in `TODO-List.md` Section 20a (P1 — Multi-Tenant Organization Management)
**Depends on:** Coordinates with `AIPLAN-03` (`organisationId` on canonical models, from the separate self-hosted-AI plan in Section 28) — this design is the authoritative schema owner; `AIPLAN-03` should consume this design's migration rather than run a second one.

---

## 1. Why this exists

Delivery Clarity today is **single-tenant in practice, multi-user in name**. Every `User` row lives in one shared database with no organizational boundary above it — `canViewAllImportData()` lets `admin`/`manager`/`c_level` roles see *every* user's uploads, and there is no concept that two companies using the same deployment should never see each other's data, because today there is only ever one deployment per company (it's installed/run per customer, not offered as a shared hosted product).

This design introduces an explicit **Organization** boundary so the app can safely run as a shared multi-customer product: each company registers its own organization, its users only ever see their own organization's data, and a seat limit and branding identity belong to the organization rather than floating free. The core promise this design must deliver, stated as a non-functional requirement: **zero data overlap between organizations, under any code path, by construction — not by convention.**

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
  maxSeats      Int       @default(6)       // ORG-02; default mirrors the 6 assignable AppRole values
  plan          String    @default("solo")  // "solo" | "team" — see §2.3 for what this gates
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

### 2.3 Single-occupancy roles — resolving the open question from `ORG-10`

The original request ("each org has only one user for each rule") is ambiguous as a hard global rule — it would cap every organization at exactly 6 users (one per `AppRole`), which is a real product constraint, not an accident. Rather than guess, this design makes it an explicit **plan-gated** behavior instead of a universal law:

- **`plan: "solo"`** (the default): exactly one user per role, matching the literal request. This fits a single small team where one person *is* the Scrum Master, one *is* the Product Owner, etc. — `maxSeats` defaults to 6 and is not editable on this plan.
- **`plan: "team"`**: multiple users may share a role (e.g. three Scrum Masters across different sub-teams); `maxSeats` becomes an admin-editable number (`ORG-02`).

This must be confirmed with the user before `ORG-10` is implemented — it is the one place in this design where a literal reading of the request and a defensible product shape diverge, and it's cheaper to confirm in writing now than to build the wrong one.

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

- **Today (SQLite):** there is no SQLite equivalent of Postgres Row-Level Security. The second layer is a **mandatory integration test class** (§7) that attempts cross-org access through every route and asserts denial — not a runtime control, but the best available safety net pre-Postgres.
- **After `FUT-POSTGRES-01` lands:** add real Postgres RLS policies (`CREATE POLICY ... USING (organization_id = current_setting('app.current_org_id')::text)`) on every org-scoped table, with the app setting `app.current_org_id` per request via `SET LOCAL`. This is the genuine second layer — it holds even if every line of application code has a bug — and should be treated as a required follow-up, not an optional nice-to-have, once Postgres is available.

### 3.3 Authorization layer

`canViewAllImportData()` and friends (`src/lib/roles.ts`) currently mean "see all *users'* data" — they must be redefined to mean "see all data **within my organization**," never across organizations. The only role that may ever query across organizations is a new **platform-level** role (distinct from org `admin`), reserved for support/ops tooling, fully audited (`ORG-06`).

---

## 4. Registration and domain ownership (`ORG-01`, `ORG-11`, `ORG-12`)

1. A prospective customer visits a (new) `/register-organization` flow, enters a company name, a work email (e.g. `ali@ali.com`), and a password.
2. The system derives the candidate domain from the email (`ali.com`) and checks `Organization.domain` is not already claimed.
3. **Domain ownership verification** (`ORG-12`) happens *before* the org is created, not after — otherwise a second person with an `@ali.com` address could register a competing org first:
   - Preferred: DNS TXT record challenge (`_deliveryclarity-verify.ali.com` = a generated token), checked server-side with a "Verify" button and a documented propagation-wait state.
   - Fallback for domains without DNS access at signup time: a confirmation email loop to the registering address only, with a short-lived signed link — weaker than DNS but still proves control of *an* inbox at that domain, not just that the string matches.
4. On verification success, create `Organization` (`domainVerifiedAt` set) and the first `User` with role `admin` in that org.
5. Every subsequent invite/signup for that organization (`ORG-11`) must have an email domain exactly matching `Organization.domain` — checked server-side, fail-closed, same pattern as the email-format fix shipped in `FR-316`.

---

## 5. Login flow (`ORG-14`, `ORG-14a`)

Three-step form, but **not** three separate round-trips that leak information:

1. **Step 1 — domain.** User enters `ali.com`. Client-side this just advances to step 2; it does **not** call the server to check existence yet (avoids a cheap existence-probe endpoint).
2. **Step 2 — username + password.** Submitted together with the domain in one request to a single `POST /api/auth/login` call. The server looks up `Organization` by domain and `User` by `(organizationId, email)` together, and returns the **same generic error** ("Invalid domain, email, or password.") whether the domain doesn't exist, the user doesn't exist, or the password is wrong — and takes roughly constant time for all three cases (hash comparison happens against a dummy hash when the org/user lookup fails, to avoid a timing side-channel).
3. **Rate limiting** is per-IP **and** per-domain (not just per-account), so a domain string itself can't be cheaply enumerated by hammering step 1 with a wordlist — mirrors the existing `RATE_MAX`/`RATE_WINDOW_MS` pattern in `app/api/user-add-requests/route.ts`.

Account recovery (`ORG-19`) follows the identical generic-response, constant-time-feeling pattern.

---

## 6. Branding (`ORG-13`)

`Organization.logoUrl` points to a validated upload (CLAUDE.md §38.4: type/size/content-checked, not just extension) stored under the existing cloud-storage abstraction (`src/lib/storage/`), keyed by `organizationId`. Rendering reuses the existing icon/token registry pattern (CLAUDE.md §10.3) — the app shell reads `session.organization.logoUrl` and renders it wherever the app currently renders its own brand mark (header, exports, future shared reports), and that lookup is itself scoped by the caller's own `organizationId` — there is no code path where org A's logo URL is reachable from org B's session.

---

## 7. Required tests before this ships (`ORG-08`, `ORG-08a`)

Beyond ordinary CRUD-scoping tests, the adversarial pass must explicitly attempt and assert denial for:

- Direct object reference manipulation — authenticated as org A, request org B's `ImportLog`/`DashboardSnapshot`/`UserAddRequest`/`Notification` by guessing/incrementing IDs.
- Search/list endpoints — confirm no endpoint returns a count, name, or any fragment belonging to another org (including 404-vs-403 timing/response differences that could confirm an ID exists in another org).
- Bulk export endpoints — Excel/CSV export must filter by the caller's `organizationId` at the query layer, not just at the UI layer.
- Background/cron-style jobs (e.g. future scheduled Jira sync) — any job iterating "all `JiraConnection` rows" must iterate per-organization, never globally unscoped.
- Error messages — generic enough that a 403 doesn't accidentally confirm "that record exists, you're just not allowed to see it" vs. "that record doesn't exist at all."

Zero findings required before merge, per `ORG-08a` — this is a security review gate, not a backlog of follow-up tickets.

---

## 8. Migration plan for existing single-tenant deployments

Existing deployments have users and data with no `organizationId` at all. The migration must not silently destroy or merge anyone's data:

1. Add `Organization` table (additive, no existing-table impact).
2. Create exactly one `Organization` row per existing deployment — a "default" org seeded from the existing admin's email domain (or a placeholder domain requiring an admin to confirm/correct it post-migration if the existing admin's email isn't a real company domain, e.g. a personal Gmail used during development).
3. Add `organizationId` columns as **nullable** in the same migration, backfill every existing row to the default org's ID, then a **second** migration flips the columns to non-nullable — never a single migration that adds a non-nullable FK with no backfill step, which would simply fail against existing data.
4. This matches the existing project convention of nullable-then-backfill-then-tighten migrations (see how `mustChangePassword`/`isActive` were added to `User` with defaults rather than breaking existing rows).

---

## 9. Suspension and offboarding (`ORG-16`, `ORG-17`)

- **Suspension** sets `Organization.status = "suspended"`; the auth layer checks this on every login/session-refresh and rejects with a clear "account suspended, contact support" message — no data is touched, deleted, or modified. Reactivation is just flipping the flag back.
- **Export and deletion** (`ORG-17`): an org admin (or platform admin acting on the org's explicit request) can trigger a full data export (reuses the existing Excel/backup-export machinery, scoped to that one `organizationId`) and, separately, a full deletion request. Deletion is **not** instant — it follows the same non-destructive-by-default principle as the rest of this app: mark `status = "pending_deletion"` with a recorded grace period (e.g. 30 days, configurable), then a scheduled job performs the actual cascade delete after the grace period, writing a final `AuditEvent` before the org's own audit trail is itself deleted.

---

## 10. Rollout phases

This is large enough that it should not land as one PR:

1. **Phase 1 — schema + isolation core:** `Organization` model, `organizationId` backfill migration, `scopedRepository`, the ESLint boundary rule, and the `ORG-08`/`ORG-08a` test suite. No UI changes. This phase alone is what makes the "no data overlap" guarantee real — everything after this is UX around it.
2. **Phase 2 — registration, login, domain verification:** `ORG-01`, `ORG-11`, `ORG-12`, `ORG-14`/`14a`, `ORG-19`.
3. **Phase 3 — admin experience:** `ORG-02`/`03`/`06`/`15`/`18`/`21` (seat limits, org settings page, scoped admin, org audit log, seat-limit UX).
4. **Phase 4 — branding, suspension, offboarding, per-org rate limiting:** `ORG-13`, `ORG-16`, `ORG-17`, `ORG-20`.
5. **Phase 5 — `ORG-10` single-occupancy roles**, deliberately last and gated on the plan/seat-limit confirmation in §2.3 — it's the one item in this design that needs a product decision, not just an engineering one, before it's built.

Each phase gets its own branch, its own doc-impact-matrix pass, and its own full-suite verification — consistent with how `FCAST-14–26`/`RETRO-04–38` shipped.

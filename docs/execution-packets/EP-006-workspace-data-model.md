# EP-006 — Workspace Data Model

```
Execution Packet ID:   EP-006
Title:                 Workspace Data Model
Priority:              P0 — All public user features depend on this
MVP Classification:    Foundation — blocks EP-007 through EP-018
Architecture Decision IDs: ADR-001 (see below)
Related TODO IDs:      P0A-04, P0B-01, P0B-02
Dependencies:          EP-001, EP-002
Blocked By:            Nothing (PO has approved migration strategy)
Estimated Effort:      Medium — schema + migration + backfill + 2 API updates + tests
Approved By:           Ali Abu Ras (Product Owner) — 2026-07-02
Migration Strategy:    Option A — each existing user becomes a workspace owner;
                       all their ImportLogs, Snapshots, JiraConnections stay attached.
Status:                Ready for Codex
```

---

## ADR-001 — Workspace Migration Strategy

```
Decision:   Option A — User-as-Workspace-Owner
Date:       2026-07-02
Status:     Approved by Product Owner
Context:    All existing data (ImportLog, DashboardSnapshot, JiraConnection) is
            tied to userId. Two options were presented:
            A) Each existing user becomes workspace owner; their data stays attached.
            B) Parallel workspace system; existing records stay userId-scoped.
Selected:   Option A
Reason:     Simpler migration; atomic in one SQL script; no orphaned records;
            all existing data immediately becomes workspace-scoped.
Risk:       Low — backfill is a single UPDATE per affected table.
Rollback:   Drop workspaceId columns and Workspace/WorkspaceMember tables.
```

---

## Business Objective

Every Delivery Clarity user will have one private workspace. The workspace is the container for all their analysis data. Without this model, public registration cannot be built (no place to put the user's data), data isolation cannot be enforced (no workspace boundary to scope queries to), and the trial entitlement system has nothing to attach to.

This packet adds the schema and migrates existing data. It does **not** add workspace-switching UI, collaboration features, or workspace settings — those are deferred beyond MVP.

---

## Current State Evidence

**Prisma schema (`prisma/schema.prisma`):**
- No `Workspace` model
- No `WorkspaceMember` model
- `ImportLog` has `userId` but no `workspaceId`
- `DashboardSnapshot` has `userId` but no `workspaceId`
- `JiraConnection` has `createdByUserId` but no `workspaceId`

**Registration (`app/api/auth/register/route.ts`):**
- Creates a User record
- Does NOT create a Workspace or WorkspaceMember record

**Upload (`app/api/upload/route.ts`):**
- Creates an ImportLog scoped by `userId`
- Does NOT set `workspaceId`

**Snapshots (`app/api/snapshots/route.ts`):**
- Creates DashboardSnapshot scoped by `userId`
- Does NOT set `workspaceId`

---

## Required Outcome

After this packet is complete:

1. The database contains a `Workspace` table and a `WorkspaceMember` table.
2. Every existing `User` has exactly one `Workspace` with themselves as owner and as the sole `WorkspaceMember`.
3. Every existing `ImportLog` has a `workspaceId` pointing to its owner's workspace.
4. Every existing `DashboardSnapshot` has a `workspaceId` pointing to its owner's workspace.
5. Every existing `JiraConnection` has a `workspaceId` pointing to its creator's workspace.
6. New user registration automatically creates a Workspace and a WorkspaceMember record.
7. New ImportLog and DashboardSnapshot records receive a `workspaceId`.
8. `npx prisma validate` passes.
9. `npx prisma generate` passes.
10. `npx tsc --noEmit` passes.
11. `npm test -- --runInBand` passes (760+ tests, no regressions).
12. `npx next build` passes.

---

## Scope

**Included:**
- `Workspace` model in Prisma schema
- `WorkspaceMember` model in Prisma schema
- `workspaceId` on `ImportLog`, `DashboardSnapshot`, `JiraConnection`
- One Prisma migration with complete backfill SQL
- Auto-workspace creation in the register API
- `workspaceId` set on new ImportLog (upload API)
- `workspaceId` set on new DashboardSnapshot (snapshots API)
- Workspace-read helper (get workspace for current user)
- Tests for backfill correctness and new-user workspace creation
- Updated migration list in `product/DEVELOPER_GUIDE.md`

**Explicit exclusions — do not implement:**
- Workspace switching UI
- Multi-workspace support per user
- Workspace settings page
- Workspace invitation or collaboration
- Workspace deletion flow (that is EP-018)
- `workspaceId` enforcement on read queries (that is EP-008)
- Any new admin pages
- Any changes to metric calculations
- Any changes to export logic
- Any changes to the dashboard pages

---

## Expected Files

**New:**
- `prisma/migrations/20260703000001_add_workspace_model/migration.sql`

**Modified:**
- `prisma/schema.prisma` — add Workspace, WorkspaceMember, workspaceId columns
- `app/api/auth/register/route.ts` — auto-create workspace on registration
- `app/api/upload/route.ts` — set workspaceId on new ImportLog
- `app/api/snapshots/route.ts` — set workspaceId on new DashboardSnapshot
- `src/lib/workspace.ts` — new helper: `getWorkspaceForUser(userId)`
- `src/__tests__/workspace.test.ts` — new test file
- `product/DEVELOPER_GUIDE.md` — add migration to table

**Possible:**
- `src/lib/prisma.ts` — only if Prisma client needs extension

**Prohibited:**
- No UI page files
- No admin page changes
- No metric calculation files
- No export files
- No test changes outside the new test file and auth.test.ts

---

## Data and Migration Requirements

### New Prisma schema additions

Add these two models:

```prisma
model Workspace {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  status      String   @default("active") // "active" | "suspended" | "deleted"
  ownerUserId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner           User              @relation("WorkspaceOwner", fields: [ownerUserId], references: [id], onDelete: Cascade)
  members         WorkspaceMember[]
  importLogs      ImportLog[]
  snapshots       DashboardSnapshot[]
  jiraConnections JiraConnection[]

  @@index([ownerUserId])
  @@index([status])
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  accessRole  String   @default("owner") // "owner" | "member" (member is for future use)
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
}
```

Add to `User` model:
```prisma
  ownedWorkspace      Workspace?        @relation("WorkspaceOwner")
  workspaceMemberships WorkspaceMember[]
```

Add to `ImportLog` model:
```prisma
  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  // Add to @@index: workspaceId
```

Add to `DashboardSnapshot` model:
```prisma
  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  // Add to @@index: workspaceId
```

Add to `JiraConnection` model:
```prisma
  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)
  // Add to @@index: workspaceId
```

**Why nullable workspaceId on existing models:** The backfill happens in the migration SQL. Making the column nullable first avoids constraint errors if any record is missed during backfill. EP-008 will add enforcement at the query layer.

### Migration SQL

Create migration file: `prisma/migrations/20260703000001_add_workspace_model/migration.sql`

The migration MUST be written as a single SQL script that:
1. Creates the two new tables
2. Adds nullable `workspaceId` columns to existing tables
3. Backfills: creates one Workspace per User, one WorkspaceMember per Workspace
4. Backfills: sets `workspaceId` on all existing ImportLog, DashboardSnapshot, JiraConnection
5. Adds foreign key constraints
6. Adds indexes

```sql
-- ── Step 1: Create Workspace table ────────────────────────────────────────────
CREATE TABLE "Workspace" (
  "id"          TEXT        NOT NULL,
  "name"        TEXT        NOT NULL,
  "slug"        TEXT        NOT NULL,
  "status"      TEXT        NOT NULL DEFAULT 'active',
  "ownerUserId" TEXT        NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE INDEX "Workspace_ownerUserId_idx" ON "Workspace"("ownerUserId");
CREATE INDEX "Workspace_status_idx" ON "Workspace"("status");

-- ── Step 2: Create WorkspaceMember table ──────────────────────────────────────
CREATE TABLE "WorkspaceMember" (
  "id"          TEXT        NOT NULL,
  "workspaceId" TEXT        NOT NULL,
  "userId"      TEXT        NOT NULL,
  "accessRole"  TEXT        NOT NULL DEFAULT 'owner',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- ── Step 3: Add nullable workspaceId to existing tables ───────────────────────
ALTER TABLE "ImportLog"         ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "DashboardSnapshot" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "JiraConnection"    ADD COLUMN "workspaceId" TEXT;

CREATE INDEX "ImportLog_workspaceId_idx"         ON "ImportLog"("workspaceId");
CREATE INDEX "DashboardSnapshot_workspaceId_idx" ON "DashboardSnapshot"("workspaceId");
CREATE INDEX "JiraConnection_workspaceId_idx"    ON "JiraConnection"("workspaceId");

-- ── Step 4: Backfill — create one Workspace per existing User ─────────────────
-- Slug = user id (guaranteed unique; can be made human-readable later)
INSERT INTO "Workspace" ("id", "name", "slug", "ownerUserId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::TEXT,
  "name",
  CONCAT('ws-', "id"),
  "id",
  "createdAt",
  "createdAt"
FROM "User";

-- ── Step 5: Backfill — create WorkspaceMember (owner) for each Workspace ──────
INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "accessRole", "createdAt")
SELECT
  gen_random_uuid()::TEXT,
  w."id",
  w."ownerUserId",
  'owner',
  w."createdAt"
FROM "Workspace" w;

-- ── Step 6: Backfill workspaceId on owned data ────────────────────────────────
UPDATE "ImportLog" il
SET "workspaceId" = w."id"
FROM "Workspace" w
WHERE il."userId" = w."ownerUserId";

UPDATE "DashboardSnapshot" ds
SET "workspaceId" = w."id"
FROM "Workspace" w
WHERE ds."userId" = w."ownerUserId";

UPDATE "JiraConnection" jc
SET "workspaceId" = w."id"
FROM "Workspace" w
WHERE jc."createdByUserId" = w."ownerUserId";

-- ── Step 7: Add foreign key constraints ───────────────────────────────────────
ALTER TABLE "Workspace"
  ADD CONSTRAINT "Workspace_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT "WorkspaceMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImportLog"
  ADD CONSTRAINT "ImportLog_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DashboardSnapshot"
  ADD CONSTRAINT "DashboardSnapshot_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JiraConnection"
  ADD CONSTRAINT "JiraConnection_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

**Do NOT use `prisma migrate dev`** — this generates wrong migration names and can conflict with manual migrations. Use `prisma migrate deploy` to apply the migration after creating the SQL file manually.

---

## API Requirements

### Register API — `app/api/auth/register/route.ts`

After creating the User record, immediately create:
1. A `Workspace` with:
   - `id`: `cuid()` (Prisma default)
   - `name`: user's name
   - `slug`: `ws-${userId}` (matches migration pattern)
   - `ownerUserId`: the new user's id
   - `status`: `'active'`
2. A `WorkspaceMember` with:
   - `workspaceId`: the new workspace id
   - `userId`: the new user's id
   - `accessRole`: `'owner'`

Use a Prisma transaction so user + workspace + member are created atomically. If any step fails, no partial state is written.

```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { /* existing fields */ } });
  const workspace = await tx.workspace.create({
    data: {
      name:        user.name,
      slug:        `ws-${user.id}`,
      ownerUserId: user.id,
      status:      'active',
    },
  });
  await tx.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId:      user.id,
      accessRole:  'owner',
    },
  });
  return { user, workspace };
});
```

Write an audit event: `eventType: 'workspace_created'`, `eventDescription: 'Workspace auto-created on registration'`.

### Upload API — `app/api/upload/route.ts`

When creating an `ImportLog`, look up the user's workspace and set `workspaceId`:

```typescript
const workspace = await getWorkspaceForUser(session.userId);
// pass workspace.id into the ImportLog create call
```

If no workspace exists for the user (edge case), log an error and continue — do not block the upload. `workspaceId` is nullable.

### Snapshots API — `app/api/snapshots/route.ts`

Same pattern: look up workspace, set `workspaceId` on the new `DashboardSnapshot`.

### Workspace helper — `src/lib/workspace.ts`

```typescript
import { prisma } from '@/lib/prisma';

export async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({
    where: { ownerUserId: userId, status: 'active' },
    select: { id: true, name: true, slug: true, status: true },
  });
}
```

This is the ONLY workspace lookup function in this packet. Do not add other workspace functions — they belong in EP-008.

---

## Security Requirements

- The workspace creation in the register API MUST be inside a transaction — no partial user-without-workspace state is acceptable.
- The `getWorkspaceForUser` helper must always filter by `ownerUserId = userId` — never accept a workspaceId from user input in this packet.
- Do not expose `workspaceId` in any public-facing error messages.
- The `workspaceId` column is nullable in the DB for safety during transition; the query layer enforcement comes in EP-008.

---

## Acceptance Criteria

```
AC-01: After migration runs, every User has exactly one Workspace where ownerUserId = user.id.

AC-02: After migration runs, every Workspace has exactly one WorkspaceMember with
       accessRole = 'owner' and userId = workspace.ownerUserId.

AC-03: After migration runs, every ImportLog that had a userId has a matching workspaceId.

AC-04: After migration runs, every DashboardSnapshot that had a userId has a matching workspaceId.

AC-05: After migration runs, every JiraConnection that had a createdByUserId has a matching workspaceId.

AC-06: Registering a new user creates exactly one Workspace and one WorkspaceMember atomically.
       If the Workspace creation fails, the User record is also rolled back.

AC-07: A new upload (ImportLog) created after the migration has a non-null workspaceId.

AC-08: A new snapshot (DashboardSnapshot) created after the migration has a non-null workspaceId.

AC-09: npx prisma validate passes with zero errors.

AC-10: npx tsc --noEmit passes with zero errors.

AC-11: npm test -- --runInBand passes — all 760 existing tests still pass plus new workspace tests.

AC-12: npx next build passes.
```

---

## Required Tests — `src/__tests__/workspace.test.ts`

Write a new test file covering:

```
TC-WS-01: getWorkspaceForUser returns the workspace for a user with an owned workspace
TC-WS-02: getWorkspaceForUser returns null when no workspace exists for the user
TC-WS-03: getWorkspaceForUser returns null for a suspended workspace (status = 'suspended')
TC-WS-04: Register API creates user + workspace + workspaceMember in a single transaction
TC-WS-05: Register API rolls back the user if workspace creation fails
TC-WS-06: A new workspace slug is ws-{userId}
TC-WS-07: Two users produce two separate workspaces with unique slugs
TC-WS-08: Workspace ownerUserId matches the registering user's id
TC-WS-09: WorkspaceMember accessRole is 'owner' for the registering user
```

Also update `src/__tests__/auth.test.ts` to verify that the register endpoint now produces a workspace (check that a Workspace row exists after registration).

Use the existing Prisma mock pattern already in the test suite.

---

## Required Commands

The coding agent must run these in order and report exact output:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npx tsc --noEmit
npm test -- --runInBand
npx next build
```

If `prisma migrate deploy` fails with a timeout (Neon cold start), retry once after 10 seconds.

---

## Documentation

Update `product/DEVELOPER_GUIDE.md`:
- Add migration `20260703000001_add_workspace_model` to the migrations table
- Add a note: "Every User has one Workspace. All data is workspace-scoped from this migration forward."

---

## Completion Evidence Required

The coding agent must provide:

1. Summary of changes made
2. List of all changed files with line ranges
3. Migration file content (full SQL)
4. Exact output of `npx prisma migrate deploy`
5. Test results: total suites, total tests, pass/fail count
6. Exact output of `npx tsc --noEmit`
7. Build result (pass/fail)
8. Any deviations from this packet

---

## Stop Conditions

Stop and return to Claude if:

- The Prisma schema changes generate TypeScript errors that cannot be resolved within the scope of this packet
- `prisma migrate deploy` fails with anything other than a timeout
- Any existing test fails that was passing before this packet
- The register API needs changes beyond what is specified here
- Any metric calculation or export file needs to be modified to accommodate the workspace ID
- The migration backfill SQL reports row count mismatches (i.e., some records have NULL workspaceId after backfill that should not)

---

## Delegation Instruction to Codex

```
Implement only the attached execution packet EP-006.

Read the complete execution packet before editing any code.

Do not determine product priority.
Do not expand the business scope.
Do not implement workspace switching, collaboration, or workspace settings.
Do not modify metric calculations.
Do not modify export logic.
Do not modify any dashboard pages.
Do not introduce dependencies without documenting why.
Do not claim completion without tests and execution evidence.

Before implementation:
1. Read prisma/schema.prisma to understand the current model structure.
2. Read app/api/auth/register/route.ts to understand the current register flow.
3. Read app/api/upload/route.ts to understand the current upload flow.
4. Read app/api/snapshots/route.ts to understand the current snapshot flow.
5. Read src/__tests__/auth.test.ts to understand the existing auth test structure.
6. Confirm you understand the migration strategy: one workspace per user, backfill in SQL.
7. Report any contradiction before writing code.

During implementation:
1. Add the Workspace and WorkspaceMember models to prisma/schema.prisma exactly as specified.
2. Add workspaceId (nullable) to ImportLog, DashboardSnapshot, JiraConnection.
3. Create the migration SQL file exactly as specified.
4. Run prisma migrate deploy to apply it.
5. Create src/lib/workspace.ts with getWorkspaceForUser only.
6. Update the register API to use a transaction creating user + workspace + member.
7. Update the upload API to set workspaceId.
8. Update the snapshots API to set workspaceId.
9. Write src/__tests__/workspace.test.ts covering TC-WS-01 through TC-WS-09.
10. Update auth.test.ts to verify workspace creation.
11. Run all required commands and record exact results.

After implementation:
1. Run every required command.
2. Record exact results.
3. Produce the completion-evidence report.
4. Do not claim completion if any required command failed or was skipped.
5. Return the work to Claude for architecture and acceptance review.
```

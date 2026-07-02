-- EP-006: Workspace Data Model
-- Creates Workspace and WorkspaceMember tables, adds nullable workspaceId
-- to ImportLog, DashboardSnapshot, and JiraConnection, then backfills
-- all existing data so every user owns a workspace and all their records
-- are linked to it. Single atomic migration — no partial state possible.

-- ── Step 1: Workspace table ───────────────────────────────────────────────────
CREATE TABLE "Workspace" (
  "id"          TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "slug"        TEXT         NOT NULL,
  "status"      TEXT         NOT NULL DEFAULT 'active',
  "ownerUserId" TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_slug_key"        ON "Workspace"("slug");
CREATE UNIQUE INDEX "Workspace_ownerUserId_key"  ON "Workspace"("ownerUserId");
CREATE        INDEX "Workspace_ownerUserId_idx"  ON "Workspace"("ownerUserId");
CREATE        INDEX "Workspace_status_idx"       ON "Workspace"("status");

-- ── Step 2: WorkspaceMember table ─────────────────────────────────────────────
CREATE TABLE "WorkspaceMember" (
  "id"          TEXT         NOT NULL,
  "workspaceId" TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  "accessRole"  TEXT         NOT NULL DEFAULT 'owner',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key"
  ON "WorkspaceMember"("workspaceId", "userId");
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");
CREATE INDEX "WorkspaceMember_userId_idx"      ON "WorkspaceMember"("userId");

-- ── Step 3: Add nullable workspaceId columns ──────────────────────────────────
ALTER TABLE "ImportLog"         ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "DashboardSnapshot" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "JiraConnection"    ADD COLUMN "workspaceId" TEXT;

CREATE INDEX "ImportLog_workspaceId_idx"         ON "ImportLog"("workspaceId");
CREATE INDEX "DashboardSnapshot_workspaceId_idx" ON "DashboardSnapshot"("workspaceId");
CREATE INDEX "JiraConnection_workspaceId_idx"    ON "JiraConnection"("workspaceId");

-- ── Step 4: Backfill — one Workspace per existing User ────────────────────────
-- Slug = ws-{userId} — guaranteed unique since userId is unique.
INSERT INTO "Workspace" ("id", "name", "slug", "ownerUserId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::TEXT,
  "name",
  CONCAT('ws-', "id"),
  "id",
  "createdAt",
  "createdAt"
FROM "User";

-- ── Step 5: Backfill — WorkspaceMember (owner) for every Workspace ────────────
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
SET    "workspaceId" = w."id"
FROM   "Workspace"  w
WHERE  il."userId" = w."ownerUserId";

UPDATE "DashboardSnapshot" ds
SET    "workspaceId" = w."id"
FROM   "Workspace"   w
WHERE  ds."userId" = w."ownerUserId";

UPDATE "JiraConnection" jc
SET    "workspaceId" = w."id"
FROM   "Workspace"   w
WHERE  jc."createdByUserId" = w."ownerUserId";

-- ── Step 7: Foreign key constraints ──────────────────────────────────────────
ALTER TABLE "Workspace"
  ADD CONSTRAINT "Workspace_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT "WorkspaceMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImportLog"
  ADD CONSTRAINT "ImportLog_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DashboardSnapshot"
  ADD CONSTRAINT "DashboardSnapshot_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "JiraConnection"
  ADD CONSTRAINT "JiraConnection_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "JiraConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "deploymentType" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authEmail" TEXT,
    "projectFilters" TEXT NOT NULL,
    "fieldMapping" TEXT NOT NULL,
    "refreshMode" TEXT NOT NULL DEFAULT 'manual',
    "refreshIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
    "lastSyncAt" DATETIME,
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JiraConnection_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'file',
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "jiraConnectionId" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "warningsCount" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,
    "doneIssues" INTEGER NOT NULL DEFAULT 0,
    "healthScore" REAL NOT NULL DEFAULT 0,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingTimeMs" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" TEXT,
    CONSTRAINT "ImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImportLog_jiraConnectionId_fkey" FOREIGN KEY ("jiraConnectionId") REFERENCES "JiraConnection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ImportLog" ("doneIssues", "errorsCount", "fileName", "fileSize", "fileType", "healthScore", "id", "metadataJson", "processingTimeMs", "rowCount", "status", "totalIssues", "uploadedAt", "userId", "warningsCount") SELECT "doneIssues", "errorsCount", "fileName", "fileSize", "fileType", "healthScore", "id", "metadataJson", "processingTimeMs", "rowCount", "status", "totalIssues", "uploadedAt", "userId", "warningsCount" FROM "ImportLog";
DROP TABLE "ImportLog";
ALTER TABLE "new_ImportLog" RENAME TO "ImportLog";
CREATE INDEX "ImportLog_userId_idx" ON "ImportLog"("userId");
CREATE INDEX "ImportLog_jiraConnectionId_idx" ON "ImportLog"("jiraConnectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "JiraConnection_createdByUserId_idx" ON "JiraConnection"("createdByUserId");

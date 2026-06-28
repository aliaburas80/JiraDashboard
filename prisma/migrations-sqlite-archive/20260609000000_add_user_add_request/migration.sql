-- CreateTable
CREATE TABLE "UserAddRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestedName" TEXT NOT NULL,
    "requestedEmail" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "teamOrProject" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedByUserId" TEXT NOT NULL,
    "adminDecisionById" TEXT,
    "adminDecisionAt" DATETIME,
    "adminDecisionNote" TEXT,
    "createdUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAddRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

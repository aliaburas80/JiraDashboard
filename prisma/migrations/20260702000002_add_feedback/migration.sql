-- P0B-09: user feedback capture table

CREATE TABLE "Feedback" (
  "id"            TEXT NOT NULL,
  "category"      TEXT NOT NULL,
  "message"       TEXT NOT NULL,
  "impactLevel"   TEXT NOT NULL DEFAULT 'Minor',
  "canContact"    BOOLEAN NOT NULL DEFAULT false,
  "page"          TEXT,
  "appVersion"    TEXT,
  "browserFamily" TEXT,
  "status"        TEXT NOT NULL DEFAULT 'New',
  "statusNote"    TEXT,
  "userId"        TEXT,
  "userEmail"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Feedback_status_createdAt_idx"   ON "Feedback"("status", "createdAt");
CREATE INDEX "Feedback_userId_idx"              ON "Feedback"("userId");
CREATE INDEX "Feedback_category_createdAt_idx"  ON "Feedback"("category", "createdAt");

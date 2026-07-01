-- CreateTable
CREATE TABLE "AppError" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "page" TEXT,
    "component" TEXT,
    "userId" TEXT,
    "browserFamily" TEXT,
    "releaseVersion" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,

    CONSTRAINT "AppError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppError_fingerprint_idx" ON "AppError"("fingerprint");

-- CreateIndex
CREATE INDEX "AppError_severity_lastSeenAt_idx" ON "AppError"("severity", "lastSeenAt");

-- CreateIndex
CREATE INDEX "AppError_page_lastSeenAt_idx" ON "AppError"("page", "lastSeenAt");

-- CreateIndex
CREATE INDEX "AppError_resolvedAt_idx" ON "AppError"("resolvedAt");

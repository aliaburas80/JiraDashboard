-- CreateTable
CREATE TABLE "UserIssueTypeHierarchy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIssueTypeHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserIssueTypeHierarchy_userId_key" ON "UserIssueTypeHierarchy"("userId");

-- CreateIndex
CREATE INDEX "UserIssueTypeHierarchy_userId_idx" ON "UserIssueTypeHierarchy"("userId");

-- AddForeignKey
ALTER TABLE "UserIssueTypeHierarchy" ADD CONSTRAINT "UserIssueTypeHierarchy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

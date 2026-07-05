-- CreateTable
CREATE TABLE "UserStorageProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "credentialsEnc" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStorageProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStorageProvider_userId_key" ON "UserStorageProvider"("userId");

-- CreateIndex
CREATE INDEX "UserStorageProvider_userId_idx" ON "UserStorageProvider"("userId");

-- AddForeignKey
ALTER TABLE "UserStorageProvider" ADD CONSTRAINT "UserStorageProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

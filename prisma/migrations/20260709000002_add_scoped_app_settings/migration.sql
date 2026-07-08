-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'global',
    "key" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_ownerId_key_key" ON "AppSetting"("ownerId", "key");

-- CreateIndex
CREATE INDEX "AppSetting_key_idx" ON "AppSetting"("key");

-- CreateIndex
CREATE INDEX "AppSetting_ownerId_idx" ON "AppSetting"("ownerId");

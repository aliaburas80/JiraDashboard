-- AlterTable
ALTER TABLE "User" ADD COLUMN     "secondaryPersonas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

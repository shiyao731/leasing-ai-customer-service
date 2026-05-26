-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "managerId" TEXT;

-- CreateTable
CREATE TABLE "Manager" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isOnDuty" BOOLEAN NOT NULL DEFAULT true,
    "wecomUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HandoffRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantName" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignee" TEXT,
    "conversationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    "claimedBy" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "nightMode" BOOLEAN NOT NULL DEFAULT false,
    "wecomWebhookUrl" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Settings" ("id", "nightMode") SELECT "id", "nightMode" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HandoffRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantName" TEXT NOT NULL,
    "roomNo" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignee" TEXT,
    "conversationId" TEXT,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    "claimedBy" TEXT
);
INSERT INTO "new_HandoffRequest" ("assignee", "claimedAt", "claimedBy", "conversationId", "createdAt", "id", "phone", "roomNo", "status", "summary", "tenantName") SELECT "assignee", "claimedAt", "claimedBy", "conversationId", "createdAt", "id", "phone", "roomNo", "status", "summary", "tenantName" FROM "HandoffRequest";
DROP TABLE "HandoffRequest";
ALTER TABLE "new_HandoffRequest" RENAME TO "HandoffRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

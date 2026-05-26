-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaintenanceStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MaintenanceStaff" ("id", "name", "phone", "specialty") SELECT "id", "name", "phone", "specialty" FROM "MaintenanceStaff";
DROP TABLE "MaintenanceStaff";
ALTER TABLE "new_MaintenanceStaff" RENAME TO "MaintenanceStaff";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

/*
  Warnings:

  - You are about to drop the column `winnderId` on the `Tournament` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "requiredPlayers" INTEGER NOT NULL DEFAULT 8,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "winnerId" INTEGER
);
INSERT INTO "new_Tournament" ("currentRound", "description", "endDate", "id", "name", "requiredPlayers", "startDate", "status") SELECT "currentRound", "description", "endDate", "id", "name", "requiredPlayers", "startDate", "status" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- AlterTable
ALTER TABLE "TournamentMatch" ADD COLUMN "nextMatchId" INTEGER;
ALTER TABLE "TournamentMatch" ADD COLUMN "winnerId" INTEGER;

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
    "winnderId" INTEGER
);
INSERT INTO "new_Tournament" ("description", "endDate", "id", "name", "startDate") SELECT "description", "endDate", "id", "name", "startDate" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TournamentMatch_nextMatchId_idx" ON "TournamentMatch"("nextMatchId");

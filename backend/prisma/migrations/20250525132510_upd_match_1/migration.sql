/*
  Warnings:

  - You are about to drop the column `winnerId` on the `TournamentMatch` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TournamentMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "bracketPos" INTEGER NOT NULL,
    "nextMatchId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TournamentMatch" ("bracketPos", "createdAt", "id", "matchId", "nextMatchId", "round", "tournamentId") SELECT "bracketPos", "createdAt", "id", "matchId", "nextMatchId", "round", "tournamentId" FROM "TournamentMatch";
DROP TABLE "TournamentMatch";
ALTER TABLE "new_TournamentMatch" RENAME TO "TournamentMatch";
CREATE UNIQUE INDEX "TournamentMatch_matchId_key" ON "TournamentMatch"("matchId");
CREATE INDEX "TournamentMatch_tournamentId_round_idx" ON "TournamentMatch"("tournamentId", "round");
CREATE INDEX "TournamentMatch_nextMatchId_idx" ON "TournamentMatch"("nextMatchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

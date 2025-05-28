-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "bracketPos" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_matchId_key" ON "TournamentMatch"("matchId");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_round_idx" ON "TournamentMatch"("tournamentId", "round");

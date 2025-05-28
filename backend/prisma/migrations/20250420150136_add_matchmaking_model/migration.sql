-- CreateTable
CREATE TABLE "MatchMakingRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MatchMakingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" TEXT,
    CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("id", "playedAt", "player1Id", "player2Id", "result") SELECT "id", "playedAt", "player1Id", "player2Id", "result" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MatchMakingRequest_userId_key" ON "MatchMakingRequest"("userId");

-- CreateIndex
CREATE INDEX "MatchMakingRequest_createdAt_idx" ON "MatchMakingRequest"("createdAt");

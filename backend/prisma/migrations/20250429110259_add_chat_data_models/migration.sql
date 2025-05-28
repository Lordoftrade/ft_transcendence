/*
  Warnings:

  - You are about to drop the column `sentAt` on the `ChatMessage` table. All the data in the column will be lost.
  - Made the column `receiverId` on table `ChatMessage` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Block" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blockerId" INTEGER NOT NULL,
    "blockedId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameInvitation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,
    "game" TEXT NOT NULL DEFAULT 'Pong',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "GameInvitation_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameInvitation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChatMessage" ("content", "id", "receiverId", "senderId") SELECT "content", "id", "receiverId", "senderId" FROM "ChatMessage";
DROP TABLE "ChatMessage";
ALTER TABLE "new_ChatMessage" RENAME TO "ChatMessage";
CREATE INDEX "ChatMessage_receiverId_isRead_idx" ON "ChatMessage"("receiverId", "isRead");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GameInvitation_toId_status_idx" ON "GameInvitation"("toId", "status");

-- CreateIndex
CREATE INDEX "GameInvitation_fromId_status_idx" ON "GameInvitation"("fromId", "status");

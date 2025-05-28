/*
  Warnings:

  - You are about to drop the column `userAId` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `userBId` on the `Friendship` table. All the data in the column will be lost.
  - Added the required column `receiverId` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterId` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Friendship" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requesterId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Friendship" ("createdAt", "id") SELECT "createdAt", "id" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE UNIQUE INDEX "Friendship_requesterId_receiverId_key" ON "Friendship"("requesterId", "receiverId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "googleId" TEXT,
    "avatarUrl" TEXT DEFAULT '../data/default/default_avatar.jpg',
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "googleId", "id", "losses", "online", "password", "updatedAt", "username", "wins") SELECT "avatarUrl", "createdAt", "email", "googleId", "id", "losses", "online", "password", "updatedAt", "username", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

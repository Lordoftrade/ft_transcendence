/*
  Warnings:

  - A unique constraint covering the columns `[blockerId,blockedId]` on the table `Block` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Block_blockerId_blockedId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

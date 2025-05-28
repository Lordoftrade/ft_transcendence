/*
  Warnings:

  - A unique constraint covering the columns `[createdAt,id]` on the table `ChatMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_createdAt_id_key" ON "ChatMessage"("createdAt", "id");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "deletedAt" DATETIME,
    "chatTypes" JSONB,
    "senderType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("chatTypes", "content", "conversationId", "createdAt", "deletedAt", "guestId", "id", "senderType", "updatedAt", "userId") SELECT "chatTypes", "content", "conversationId", "createdAt", "deletedAt", "guestId", "id", "senderType", "updatedAt", "userId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

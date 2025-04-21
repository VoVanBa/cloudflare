-- DropIndex
DROP INDEX "Message_createdAt_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "chatTypes" JSONB;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NEW_MESSAGE',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageOnMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageOnMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageOnMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "clientType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Conversation" ("businessId", "clientType", "createdAt", "deletedAt", "guestId", "id", "updatedAt", "userId") SELECT "businessId", "clientType", "createdAt", "deletedAt", "guestId", "id", "updatedAt", "userId" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE INDEX "Conversation_businessId_idx" ON "Conversation"("businessId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

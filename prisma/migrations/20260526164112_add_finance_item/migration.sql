-- CreateTable
CREATE TABLE "FinanceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entryId" TEXT,
    "title" TEXT NOT NULL,
    "amountText" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "sourceText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinanceItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinanceItem_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FinanceItem_userId_createdAt_idx" ON "FinanceItem"("userId", "createdAt");

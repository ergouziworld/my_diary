CREATE TABLE "PageWallpaper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PageWallpaper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PageWallpaper_userId_path_key" ON "PageWallpaper"("userId", "path");
CREATE INDEX "PageWallpaper_userId_updatedAt_idx" ON "PageWallpaper"("userId", "updatedAt");

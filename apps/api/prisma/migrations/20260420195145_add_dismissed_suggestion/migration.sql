-- CreateTable
CREATE TABLE "DismissedSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DismissedSuggestion_userId_idx" ON "DismissedSuggestion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DismissedSuggestion_userId_friendId_dayOfWeek_startTime_end_key" ON "DismissedSuggestion"("userId", "friendId", "dayOfWeek", "startTime", "endTime");

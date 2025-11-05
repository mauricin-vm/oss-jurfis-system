-- CreateTable
CREATE TABLE "jurfis"."OvertimeRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "extraHours" DOUBLE PRECISION NOT NULL,
    "lateHours" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "accumulatedBalance" DOUBLE PRECISION NOT NULL,
    "documentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OvertimeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OvertimeRecord_userId_year_month_idx" ON "jurfis"."OvertimeRecord"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "OvertimeRecord_userId_month_year_key" ON "jurfis"."OvertimeRecord"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "jurfis"."OvertimeRecord" ADD CONSTRAINT "OvertimeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "jurfis"."Chat_User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

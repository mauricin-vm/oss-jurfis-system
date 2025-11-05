-- CreateEnum: MeetingStatus
DO $$ BEGIN
    CREATE TYPE "jurfis"."MeetingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Meeting
CREATE TABLE IF NOT EXISTS "jurfis"."Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "contacts" TEXT,
    "notes" TEXT,
    "status" "jurfis"."MeetingStatus" NOT NULL DEFAULT 'APPROVED',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

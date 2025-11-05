-- CreateEnum
CREATE TYPE "jurfis"."UserRole" AS ENUM ('ADMIN', 'SERVIDOR');

-- AlterTable
ALTER TABLE "jurfis"."Chat_User" ADD COLUMN "role" "jurfis"."UserRole" NOT NULL DEFAULT 'SERVIDOR';

/*
  Warnings:

  - The primary key for the `attendancerequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `schedule` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "attendancerequest" DROP CONSTRAINT "attendancerequest_pkey",
ALTER COLUMN "attendancedate" SET DATA TYPE DATE,
ADD CONSTRAINT "attendancerequest_pkey" PRIMARY KEY ("sapid", "attendancedate");

-- AlterTable
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_pkey",
ALTER COLUMN "starttime" SET DATA TYPE TIME,
ALTER COLUMN "endtime" SET DATA TYPE TIME,
ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("batchid", "weekday", "starttime", "subject", "teacher");

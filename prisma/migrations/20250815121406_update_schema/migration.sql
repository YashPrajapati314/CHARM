/*
  Warnings:

  - The primary key for the `attendancerequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `attendancedate` on the `attendancerequest` table. All the data in the column will be lost.
  - You are about to drop the column `batchid` on the `attendancerequest` table. All the data in the column will be lost.
  - You are about to drop the column `letterimagelink` on the `attendancerequest` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `attendancerequest` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `attendancerequest` table. All the data in the column will be lost.
  - You are about to drop the column `rollno` on the `attendancerequest` table. All the data in the column will be lost.
  - The primary key for the `schedule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `iselective` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `ishonours` on the `schedule` table. All the data in the column will be lost.
  - You are about to drop the column `elective` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `elective2` on the `student` table. All the data in the column will be lost.
  - You are about to drop the column `honours` on the `student` table. All the data in the column will be lost.
  - The primary key for the `teacher` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `electivename` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `honoursname` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[batchid,weekday,starttime,endtime,subject,teacher]` on the table `schedule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `attendancerequest` table without a default value. This is not possible if the table is not empty.
  - The required column `requestid` was added to the `attendancerequest` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `letterstatus` on the `attendancerequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `lectureid` was added to the `schedule` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `teacher` on the `schedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `initials` to the `teacher` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `teacher` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_teacher_fkey";

-- AlterTable
ALTER TABLE "attendancerequest" DROP CONSTRAINT "attendancerequest_pkey",
DROP COLUMN "attendancedate",
DROP COLUMN "batchid",
DROP COLUMN "letterimagelink",
DROP COLUMN "name",
DROP COLUMN "reason",
DROP COLUMN "rollno",
ADD COLUMN     "date" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "endtime" TIME NOT NULL DEFAULT '1970-01-01 23:59:59 +00:00',
ADD COLUMN     "requestid" UUID NOT NULL,
ADD COLUMN     "requesttime" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "starttime" TIME NOT NULL DEFAULT '1970-01-01 00:00:00 +00:00',
DROP COLUMN "letterstatus",
ADD COLUMN     "letterstatus" INTEGER NOT NULL,
ADD CONSTRAINT "attendancerequest_pkey" PRIMARY KEY ("requestid");

-- AlterTable
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_pkey",
DROP COLUMN "iselective",
DROP COLUMN "ishonours",
ADD COLUMN     "lectureid" UUID NOT NULL,
DROP COLUMN "teacher",
ADD COLUMN     "teacher" UUID NOT NULL,
ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("lectureid");

-- AlterTable
ALTER TABLE "student" DROP COLUMN "elective",
DROP COLUMN "elective2",
DROP COLUMN "honours";

-- AlterTable
ALTER TABLE "teacher" DROP CONSTRAINT "teacher_pkey",
ADD COLUMN     "initials" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "teacher_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "electivename";

-- DropTable
DROP TABLE "honoursname";

-- CreateTable
CREATE TABLE "module" (
    "course_code" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "is_laboratory" BOOLEAN,
    "is_elective" BOOLEAN,
    "is_honours" BOOLEAN,

    CONSTRAINT "module_pkey" PRIMARY KEY ("course_code")
);

-- CreateTable
CREATE TABLE "studentmodulebooking" (
    "sapid" BIGINT NOT NULL,
    "course_code" TEXT NOT NULL,

    CONSTRAINT "studentmodulebooking_pkey" PRIMARY KEY ("sapid","course_code")
);

-- CreateTable
CREATE TABLE "attendancerequesttomedia" (
    "requestid" UUID NOT NULL,
    "mediaid" UUID NOT NULL,

    CONSTRAINT "attendancerequesttomedia_pkey" PRIMARY KEY ("requestid","mediaid")
);

-- CreateTable
CREATE TABLE "media" (
    "mediaid" UUID NOT NULL,
    "mediaurl" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("mediaid")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_batchid_weekday_starttime_endtime_subject_teacher_key" ON "schedule"("batchid", "weekday", "starttime", "endtime", "subject", "teacher");

-- AddForeignKey
ALTER TABLE "studentmodulebooking" ADD CONSTRAINT "studentmodulebooking_sapid_fkey" FOREIGN KEY ("sapid") REFERENCES "student"("sapid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studentmodulebooking" ADD CONSTRAINT "studentmodulebooking_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "module"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_teacher_fkey" FOREIGN KEY ("teacher") REFERENCES "teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_subject_fkey" FOREIGN KEY ("subject") REFERENCES "module"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendancerequesttomedia" ADD CONSTRAINT "attendancerequesttomedia_requestid_fkey" FOREIGN KEY ("requestid") REFERENCES "attendancerequest"("requestid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendancerequesttomedia" ADD CONSTRAINT "attendancerequesttomedia_mediaid_fkey" FOREIGN KEY ("mediaid") REFERENCES "media"("mediaid") ON DELETE RESTRICT ON UPDATE CASCADE;

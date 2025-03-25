/*
  Warnings:

  - The primary key for the `attendancerequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `letterimagelink` column on the `attendancerequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `reason` column on the `attendancerequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `teacher` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `teacher` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `teacher` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `teacher` table. All the data in the column will be lost.
  - Added the required column `id` to the `teacher` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "schedule" DROP CONSTRAINT "schedule_teacher_fkey";

-- DropIndex
DROP INDEX "teacher_email_key";

-- DropIndex
DROP INDEX "teacher_name_key";

-- AlterTable
ALTER TABLE "attendancerequest" DROP CONSTRAINT "attendancerequest_pkey",
ADD COLUMN     "letterstatus" INTEGER[],
DROP COLUMN "letterimagelink",
ADD COLUMN     "letterimagelink" TEXT[],
ALTER COLUMN "attendancedate" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "reason",
ADD COLUMN     "reason" TEXT[],
ADD CONSTRAINT "attendancerequest_pkey" PRIMARY KEY ("sapid", "attendancedate");

-- AlterTable
ALTER TABLE "teacher" DROP CONSTRAINT "teacher_pkey",
DROP COLUMN "email",
DROP COLUMN "password",
DROP COLUMN "username",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "teacher_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_teacher_fkey" FOREIGN KEY ("teacher") REFERENCES "teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

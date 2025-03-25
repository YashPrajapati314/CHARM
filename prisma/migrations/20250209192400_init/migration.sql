/*
  Warnings:

  - Added the required column `batchid` to the `attendancerequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `attendancerequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rollno` to the `attendancerequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendancerequest" ADD COLUMN     "batchid" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "rollno" INTEGER NOT NULL;

/*
  Warnings:

  - Added the required column `uploadedby` to the `attendancerequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendancerequest" ADD COLUMN     "uploadedby" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "attendancerequest" ADD CONSTRAINT "attendancerequest_uploadedby_fkey" FOREIGN KEY ("uploadedby") REFERENCES "User"("universityid") ON DELETE RESTRICT ON UPDATE CASCADE;

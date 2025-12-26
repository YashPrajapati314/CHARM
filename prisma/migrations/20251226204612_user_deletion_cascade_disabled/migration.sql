-- DropForeignKey
ALTER TABLE "attendancerequest" DROP CONSTRAINT "attendancerequest_uploadedby_fkey";

-- AddForeignKey
ALTER TABLE "attendancerequest" ADD CONSTRAINT "attendancerequest_uploadedby_fkey" FOREIGN KEY ("uploadedby") REFERENCES "User"("universityid") ON DELETE NO ACTION ON UPDATE CASCADE;

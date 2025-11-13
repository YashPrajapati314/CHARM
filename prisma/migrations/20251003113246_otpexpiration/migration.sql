/*
  Warnings:

  - You are about to drop the column `otpgenerationtimestamp` on the `User` table. All the data in the column will be lost.
  - Added the required column `otpexpiration` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otpgenerationtimestamp",
ADD COLUMN     "otpexpiration" TIMESTAMPTZ(3) NOT NULL;

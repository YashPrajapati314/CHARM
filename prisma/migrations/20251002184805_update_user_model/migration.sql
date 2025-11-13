/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sapid` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[universityid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `universityid` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_sapid_key";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "sapid",
ADD COLUMN     "universityid" TEXT NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("universityid");

-- CreateIndex
CREATE UNIQUE INDEX "User_universityid_key" ON "User"("universityid");

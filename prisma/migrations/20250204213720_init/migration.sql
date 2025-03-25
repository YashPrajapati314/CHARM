/*
  Warnings:

  - Added the required column `dept` to the `teacher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "student" ADD COLUMN     "elective2" TEXT,
ALTER COLUMN "elective" DROP NOT NULL;

-- AlterTable
ALTER TABLE "teacher" ADD COLUMN     "dept" TEXT NOT NULL,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "department" (
    "departmentname" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "shorthand" TEXT,

    CONSTRAINT "department_pkey" PRIMARY KEY ("departmentname")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_order_key" ON "department"("order");

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_dept_fkey" FOREIGN KEY ("dept") REFERENCES "department"("departmentname") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_dept_fkey" FOREIGN KEY ("dept") REFERENCES "department"("departmentname") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "student" (
    "sapid" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "rollno" INTEGER NOT NULL,
    "batchid" TEXT NOT NULL,
    "elective" TEXT NOT NULL,
    "honours" TEXT,

    CONSTRAINT "student_pkey" PRIMARY KEY ("sapid")
);

-- CreateTable
CREATE TABLE "batch" (
    "batchid" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "div" INTEGER NOT NULL,
    "batch" INTEGER NOT NULL,
    "studyyear" INTEGER NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("batchid")
);

-- CreateTable
CREATE TABLE "schedule" (
    "batchid" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "starttime" TIMESTAMP(3) NOT NULL,
    "endtime" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "iselective" BOOLEAN NOT NULL DEFAULT false,
    "ishonours" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("batchid","weekday","starttime","subject","teacher")
);

-- CreateTable
CREATE TABLE "attendancerequest" (
    "sapid" BIGINT NOT NULL,
    "letterimagelink" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "attendancedate" DATE NOT NULL,
    "reason" TEXT,

    CONSTRAINT "attendancerequest_pkey" PRIMARY KEY ("sapid","letterimagelink","attendancedate")
);

-- CreateTable
CREATE TABLE "electivename" (
    "electiveabbr" TEXT NOT NULL,
    "subjectname" TEXT NOT NULL,

    CONSTRAINT "electivename_pkey" PRIMARY KEY ("electiveabbr","subjectname")
);

-- CreateTable
CREATE TABLE "honoursname" (
    "honoursabbr" TEXT NOT NULL,
    "subjectname" TEXT NOT NULL,

    CONSTRAINT "honoursname_pkey" PRIMARY KEY ("honoursabbr","subjectname")
);

-- CreateTable
CREATE TABLE "teacher" (
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "teacher_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_name_key" ON "teacher"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_email_key" ON "teacher"("email");

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_batchid_fkey" FOREIGN KEY ("batchid") REFERENCES "batch"("batchid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_batchid_fkey" FOREIGN KEY ("batchid") REFERENCES "batch"("batchid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_teacher_fkey" FOREIGN KEY ("teacher") REFERENCES "teacher"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendancerequest" ADD CONSTRAINT "attendancerequest_sapid_fkey" FOREIGN KEY ("sapid") REFERENCES "student"("sapid") ON DELETE RESTRICT ON UPDATE CASCADE;

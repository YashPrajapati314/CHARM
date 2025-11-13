-- CreateTable
CREATE TABLE "User" (
    "sapid" TEXT NOT NULL,
    "password" TEXT,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("sapid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_sapid_key" ON "User"("sapid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

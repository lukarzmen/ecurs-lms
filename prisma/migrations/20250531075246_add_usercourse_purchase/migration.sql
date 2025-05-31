-- CreateTable
CREATE TABLE "UserCoursePurchase" (
    "id" SERIAL NOT NULL,
    "userCourseId" INTEGER NOT NULL,
    "paymentId" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCoursePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCoursePurchase_userCourseId_key" ON "UserCoursePurchase"("userCourseId");

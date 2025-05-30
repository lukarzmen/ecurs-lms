-- AlterTable
ALTER TABLE "UserCourse" ADD COLUMN     "priceId" INTEGER;

-- CreateTable
CREATE TABLE "CoursePrice" (
    "id" SERIAL NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoursePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoursePrice_courseId_key" ON "CoursePrice"("courseId");

-- CreateIndex
CREATE INDEX "UserCourse_priceId_idx" ON "UserCourse"("priceId");

-- AlterTable
ALTER TABLE "CoursePrice" ADD COLUMN "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 23;

-- AlterTable
ALTER TABLE "EducationalPathPrice" ADD COLUMN "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 23;

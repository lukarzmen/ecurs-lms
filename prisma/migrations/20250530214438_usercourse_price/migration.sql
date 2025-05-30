/*
  Warnings:

  - You are about to drop the column `priceId` on the `UserCourse` table. All the data in the column will be lost.
  - You are about to drop the `CoursePrice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "UserCourse_priceId_idx";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserCourse" DROP COLUMN "priceId";

-- DropTable
DROP TABLE "CoursePrice";

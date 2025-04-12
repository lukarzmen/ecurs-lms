/*
  Warnings:

  - You are about to drop the column `userId` on the `Course` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "userId",
ADD COLUMN     "authorId" INTEGER NULL;

UPDATE "Course" SET "authorId" = 1;
ALTER TABLE "Course" ALTER COLUMN "authorId" SET NOT NULL;
-- CreateIndex
CREATE INDEX "Course_authorId_idx" ON "Course"("authorId");

-- AlterTable
ALTER TABLE "UserCourse" ADD COLUMN     "roleId" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX "UserCourse_roleId_idx" ON "UserCourse"("roleId");

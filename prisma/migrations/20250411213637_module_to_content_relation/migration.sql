/*
  Warnings:

  - You are about to drop the column `moduleContentId` on the `Module` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Module_moduleContentId_key";

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "moduleContentId";

-- AlterTable
ALTER TABLE "ModuleContent" ADD COLUMN     "moduleId" INTEGER;

-- CreateIndex
CREATE INDEX "ModuleContent_moduleId_idx" ON "ModuleContent"("moduleId");

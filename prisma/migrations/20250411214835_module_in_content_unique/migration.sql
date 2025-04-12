/*
  Warnings:

  - A unique constraint covering the columns `[moduleId]` on the table `ModuleContent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ModuleContent_moduleId_key" ON "ModuleContent"("moduleId");

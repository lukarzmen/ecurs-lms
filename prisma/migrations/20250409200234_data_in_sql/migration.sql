/*
  Warnings:

  - Changed the type of `moduleContentId` on the `Module` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Module" DROP COLUMN "moduleContentId",
ADD COLUMN     "moduleContentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roleId" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleContent" (
    "id" SERIAL NOT NULL,
    "guid" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "guid" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleContent_guid_key" ON "ModuleContent"("guid");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_guid_key" ON "Attachment"("guid");

-- CreateIndex
CREATE UNIQUE INDEX "Module_moduleContentId_key" ON "Module"("moduleContentId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateEnum
CREATE TYPE "CommunicationPlatform" AS ENUM ('WHATSAPP', 'TELEGRAM', 'DISCORD', 'SLACK', 'TEAMS', 'ZOOM', 'CUSTOM');

-- CreateTable
CREATE TABLE "CourseCommunication" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "platform" "CommunicationPlatform" NOT NULL,
    "link" VARCHAR(500) NOT NULL,
    "label" VARCHAR(100),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseCommunication_courseId_idx" ON "CourseCommunication"("courseId");

-- CreateIndex
CREATE INDEX "CourseCommunication_platform_idx" ON "CourseCommunication"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCommunication_courseId_platform_label_key" ON "CourseCommunication"("courseId", "platform", "label");

-- AddForeignKey
ALTER TABLE "CourseCommunication" ADD CONSTRAINT "CourseCommunication_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
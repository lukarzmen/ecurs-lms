-- CreateTable
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "NotificationSchedule" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "cronExpression" VARCHAR(100) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationType" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "NotificationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSentLog" (
    "id" SERIAL NOT NULL,
    "notificationScheduleId" INTEGER NOT NULL,
    "recipientEmail" VARCHAR(255) NOT NULL,
    "recipientUserId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,

    CONSTRAINT "NotificationSentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationSchedule_courseId_idx" ON "NotificationSchedule"("courseId");

-- CreateIndex
CREATE INDEX "NotificationSchedule_authorId_idx" ON "NotificationSchedule"("authorId");

-- CreateIndex
CREATE INDEX "NotificationSchedule_isEnabled_idx" ON "NotificationSchedule"("isEnabled");

-- CreateIndex
CREATE INDEX "NotificationSchedule_cronExpression_idx" ON "NotificationSchedule"("cronExpression");

-- CreateIndex
CREATE INDEX "NotificationSentLog_notificationScheduleId_idx" ON "NotificationSentLog"("notificationScheduleId");

-- CreateIndex
CREATE INDEX "NotificationSentLog_recipientUserId_idx" ON "NotificationSentLog"("recipientUserId");

-- CreateIndex
CREATE INDEX "NotificationSentLog_sentAt_idx" ON "NotificationSentLog"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationSentLog_status_idx" ON "NotificationSentLog"("status");

-- AddForeignKey
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSentLog" ADD CONSTRAINT "NotificationSentLog_notificationScheduleId_fkey" FOREIGN KEY ("notificationScheduleId") REFERENCES "NotificationSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSentLog" ADD CONSTRAINT "NotificationSentLog_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
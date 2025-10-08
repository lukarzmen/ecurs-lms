-- EducationalPath table
CREATE TABLE "EducationalPath" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- EducationalPathCourse join table
CREATE TABLE "EducationalPathCourse" (
    "id" SERIAL PRIMARY KEY,
    "educationalPathId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "EducationalPathCourse_educationalPathId_fkey" FOREIGN KEY ("educationalPathId") REFERENCES "EducationalPath"("id") ON DELETE CASCADE,
    CONSTRAINT "EducationalPathCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
    CONSTRAINT "EducationalPathCourse_unique" UNIQUE ("educationalPathId", "courseId")
);

-- EducationalPathPurchase table
CREATE TABLE "EducationalPathPurchase" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "educationalPathId" INTEGER NOT NULL,
    "purchaseDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "EducationalPathPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "EducationalPathPurchase_educationalPathId_fkey" FOREIGN KEY ("educationalPathId") REFERENCES "EducationalPath"("id") ON DELETE CASCADE,
    CONSTRAINT "EducationalPathPurchase_unique" UNIQUE ("userId", "educationalPathId")
);

-- Indexes for performance
CREATE INDEX "EducationalPathCourse_educationalPathId_idx" ON "EducationalPathCourse" ("educationalPathId");
CREATE INDEX "EducationalPathCourse_courseId_idx" ON "EducationalPathCourse" ("courseId");
CREATE INDEX "EducationalPathPurchase_userId_idx" ON "EducationalPathPurchase" ("userId");
CREATE INDEX "EducationalPathPurchase_educationalPathId_idx" ON "EducationalPathPurchase" ("educationalPathId");

ALTER TABLE "EducationalPathPurchase"
ADD COLUMN "paymentId" VARCHAR(255);

CREATE TABLE "UserEducationalPath" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "educationalPathId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL,
    "state" INTEGER NOT NULL DEFAULT 0,
    "roleId" INTEGER DEFAULT 0,
    CONSTRAINT "UserEducationalPath_userId_educationalPathId_unique" UNIQUE ("userId", "educationalPathId")
);

CREATE INDEX "UserEducationalPath_userId_idx" ON "UserEducationalPath" ("userId");
CREATE INDEX "UserEducationalPath_educationalPathId_idx" ON "UserEducationalPath" ("educationalPathId");
CREATE INDEX "UserEducationalPath_roleId_idx" ON "UserEducationalPath" ("roleId");

ALTER TABLE "UserEducationalPath"
    ADD CONSTRAINT "UserEducationalPath_user_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "UserEducationalPath"
    ADD CONSTRAINT "UserEducationalPath_educationalPath_fkey"
    FOREIGN KEY ("educationalPathId") REFERENCES "EducationalPath"("id") ON DELETE CASCADE;

ALTER TABLE "UserEducationalPath"
    ADD CONSTRAINT "UserEducationalPath_role_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE;

    ALTER TABLE "EducationalPath"
ADD COLUMN "imageId" VARCHAR(255);

ALTER TABLE "EducationalPath"
  ADD COLUMN "mode" integer NOT NULL DEFAULT 0,
  ADD COLUMN "state" integer NOT NULL DEFAULT 0;
-- Set Course.schoolId from author's school (for courses without schoolId)
-- First: Get schoolId from teacher's owned school
UPDATE "public"."Course" 
SET "schoolId" = (
  SELECT "id" FROM "public"."schools" 
  WHERE "ownerId" = "Course"."authorId"
  LIMIT 1
)
WHERE "schoolId" IS NULL
  AND EXISTS (
    SELECT 1 FROM "public"."schools" 
    WHERE "ownerId" = "Course"."authorId"
  );

-- For courses where author is a teacher in a school (not owner), assign the school they teach at
UPDATE "public"."Course"
SET "schoolId" = (
  SELECT "schoolId" FROM "public"."school_teachers"
  WHERE "teacherId" = "Course"."authorId"
  LIMIT 1
)
WHERE "schoolId" IS NULL
  AND EXISTS (
    SELECT 1 FROM "public"."school_teachers"
    WHERE "teacherId" = "Course"."authorId"
  );

-- For any remaining courses without schoolId, set to a default school (first one in database)
UPDATE "public"."Course"
SET "schoolId" = (
  SELECT "id" FROM "public"."schools" 
  ORDER BY "id" ASC
  LIMIT 1
)
WHERE "schoolId" IS NULL;

-- Now make schoolId NOT NULL
ALTER TABLE "public"."Course" ALTER COLUMN "schoolId" SET NOT NULL;

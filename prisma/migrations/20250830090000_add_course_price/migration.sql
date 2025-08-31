BEGIN;

-- Create PriceInterval enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priceinterval') THEN
    CREATE TYPE "PriceInterval" AS ENUM ('ONE_TIME','MONTH','YEAR');
  END IF;
END$$;

-- Create CoursePrice table
CREATE TABLE IF NOT EXISTS "CoursePrice" (
  "id" SERIAL PRIMARY KEY,
  "amount" numeric(10,2) NOT NULL DEFAULT 0,
  "currency" text NOT NULL DEFAULT 'PLN',
  "isRecurring" boolean NOT NULL DEFAULT false,
  "interval" "PriceInterval",
  "courseId" integer NOT NULL UNIQUE,
  "createdAt" timestamp(3) NOT NULL DEFAULT now(),
  "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

-- Add foreign key constraint to Course
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'CoursePrice' AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "CoursePrice"
      ADD CONSTRAINT "CoursePrice_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE;
  END IF;
END$$;

-- Migrate existing prices from Course.price into CoursePrice
-- Assumption: existing prices are in PLN and are one-time payments
INSERT INTO "CoursePrice" ("amount","currency","isRecurring","interval","courseId","createdAt","updatedAt")
SELECT "price", 'PLN', false, 'ONE_TIME', "id", now(), now()
FROM "Course"
WHERE "price" IS NOT NULL;

-- Drop the old price column from Course (if exists)
ALTER TABLE "Course" DROP COLUMN IF EXISTS "price";

COMMIT;

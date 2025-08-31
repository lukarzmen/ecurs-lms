Migration: add_course_price

This migration creates the PriceInterval enum and CoursePrice table, migrates existing Course.price values into CoursePrice (assumes currency 'PLN' and one-time prices), and drops the legacy Course.price column.

How to apply locally:

1. Ensure DATABASE_URL points to your development database.
2. Run the migration SQL directly using psql or use Prisma migrate deploy if you have generated a proper migration folder.

Example using psql (Postgres):

psql "$DATABASE_URL" -f prisma/migrations/20250830090000_add_course_price/migration.sql

Or use Prisma to deploy migrations if integrated with your workflow:

npx prisma migrate deploy --schema=prisma/schema.prisma

After running the SQL, regenerate the client:

npx prisma generate

-- Add publishedAt field to Module table for scheduled publication
ALTER TABLE "Module" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Create index for efficient querying of modules to publish
CREATE INDEX "Module_publishedAt_idx" ON "Module"("publishedAt");

-- Add comment to explain the field purpose
COMMENT ON COLUMN "Module"."publishedAt" IS 'Scheduled publication date - module will be automatically published when this date passes';
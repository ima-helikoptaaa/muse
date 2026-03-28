-- AlterEnum: Add INSTAGRAM_CAROUSEL to ContentFormat
ALTER TYPE "ContentFormat" ADD VALUE IF NOT EXISTS 'INSTAGRAM_CAROUSEL';

-- AlterEnum: Add INSTAGRAM to Platform
ALTER TYPE "Platform" ADD VALUE IF NOT EXISTS 'INSTAGRAM';

-- AlterTable: Add cascade, sourceArticles, angle to ContentIdea
ALTER TABLE "ContentIdea" ADD COLUMN IF NOT EXISTS "cascade" JSONB;
ALTER TABLE "ContentIdea" ADD COLUMN IF NOT EXISTS "sourceArticles" JSONB;
ALTER TABLE "ContentIdea" ADD COLUMN IF NOT EXISTS "angle" TEXT;

-- Make format and targetPlatform have defaults for new cascade-style ideas
ALTER TABLE "ContentIdea" ALTER COLUMN "format" SET DEFAULT 'BLOG_POST';
ALTER TABLE "ContentIdea" ALTER COLUMN "targetPlatform" SET DEFAULT 'BLOG';

-- Fix nullable externalId: backfill any NULLs with a generated value, then make NOT NULL
UPDATE "RawArticle" SET "externalId" = 'legacy-' || "id" WHERE "externalId" IS NULL;
ALTER TABLE "RawArticle" ALTER COLUMN "externalId" SET NOT NULL;

-- Add cascade delete: Source -> RawArticle
ALTER TABLE "RawArticle" DROP CONSTRAINT "RawArticle_sourceId_fkey";
ALTER TABLE "RawArticle" ADD CONSTRAINT "RawArticle_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix nullable contentPieceId on PlatformMetric: delete orphans, then make NOT NULL
DELETE FROM "PlatformMetric" WHERE "contentPieceId" IS NULL;
ALTER TABLE "PlatformMetric" ALTER COLUMN "contentPieceId" SET NOT NULL;

-- Add cascade delete: ContentPiece -> PlatformMetric
ALTER TABLE "PlatformMetric" DROP CONSTRAINT "PlatformMetric_contentPieceId_fkey";
ALTER TABLE "PlatformMetric" ADD CONSTRAINT "PlatformMetric_contentPieceId_fkey"
  FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

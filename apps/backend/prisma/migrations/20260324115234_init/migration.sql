-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ARXIV', 'HACKER_NEWS', 'REDDIT', 'GITHUB_TRENDING', 'HUGGINGFACE', 'TECH_BLOG', 'PRODUCT_HUNT');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('IDEA', 'RESEARCHING', 'CREATING', 'READY', 'POSTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('BLOG_POST', 'YOUTUBE_VIDEO', 'LINKEDIN_POST', 'TWITTER_POST', 'MEME');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('BLOG', 'YOUTUBE', 'LINKEDIN', 'TWITTER');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('POST_CONTENT', 'BRAND_MEME', 'ENGAGEMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'DISMISSED', 'ACTED');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fetchConfig" JSONB,
    "lastFetched" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawArticle" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "authors" TEXT[],
    "summary" TEXT,
    "content" TEXT,
    "score" DOUBLE PRECISION,
    "tags" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Digest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Digest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestItem" (
    "id" TEXT NOT NULL,
    "digestId" TEXT NOT NULL,
    "rawArticleId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "topicTags" TEXT[],
    "whyItMatters" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentIdea" (
    "id" TEXT NOT NULL,
    "digestId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "format" "ContentFormat" NOT NULL,
    "targetPlatform" "Platform" NOT NULL,
    "researchSteps" JSONB NOT NULL,
    "talkingPoints" JSONB,
    "estimatedEffort" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "format" "ContentFormat" NOT NULL,
    "targetPlatform" "Platform" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'IDEA',
    "notes" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "postedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCalendar" (
    "id" TEXT NOT NULL,
    "contentPieceId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT,
    "platform" "Platform" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "platform" "Platform",
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformMetric" (
    "id" TEXT NOT NULL,
    "contentPieceId" TEXT,
    "platform" "Platform" NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineRun" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,

    CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RawArticle_fetchedAt_idx" ON "RawArticle"("fetchedAt");

-- CreateIndex
CREATE INDEX "RawArticle_sourceId_idx" ON "RawArticle"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RawArticle_sourceId_externalId_key" ON "RawArticle"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "DigestItem_digestId_idx" ON "DigestItem"("digestId");

-- CreateIndex
CREATE UNIQUE INDEX "DigestItem_digestId_rawArticleId_key" ON "DigestItem"("digestId", "rawArticleId");

-- CreateIndex
CREATE INDEX "ContentIdea_format_idx" ON "ContentIdea"("format");

-- CreateIndex
CREATE INDEX "ContentIdea_targetPlatform_idx" ON "ContentIdea"("targetPlatform");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPiece_ideaId_key" ON "ContentPiece"("ideaId");

-- CreateIndex
CREATE INDEX "ContentPiece_status_idx" ON "ContentPiece"("status");

-- CreateIndex
CREATE INDEX "ContentPiece_targetPlatform_idx" ON "ContentPiece"("targetPlatform");

-- CreateIndex
CREATE INDEX "ContentPiece_scheduledFor_idx" ON "ContentPiece"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "ContentCalendar_contentPieceId_key" ON "ContentCalendar"("contentPieceId");

-- CreateIndex
CREATE INDEX "ContentCalendar_scheduledDate_idx" ON "ContentCalendar"("scheduledDate");

-- CreateIndex
CREATE INDEX "Reminder_status_scheduledAt_idx" ON "Reminder"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "PlatformMetric_platform_metricDate_idx" ON "PlatformMetric"("platform", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformMetric_contentPieceId_platform_metricDate_key" ON "PlatformMetric"("contentPieceId", "platform", "metricDate");

-- AddForeignKey
ALTER TABLE "RawArticle" ADD CONSTRAINT "RawArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestItem" ADD CONSTRAINT "DigestItem_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "Digest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestItem" ADD CONSTRAINT "DigestItem_rawArticleId_fkey" FOREIGN KEY ("rawArticleId") REFERENCES "RawArticle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIdea" ADD CONSTRAINT "ContentIdea_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "Digest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ContentIdea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCalendar" ADD CONSTRAINT "ContentCalendar_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformMetric" ADD CONSTRAINT "PlatformMetric_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { DedupService } from './dedup.service';
import { ScraperService } from './scraper.service';
import { TrendService, DetectedTrend } from './trend.service';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
    private dedupService: DedupService,
    private scraperService: ScraperService,
    private trendService: TrendService,
  ) {}

  async createDigest(dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || startOfDay(subDays(new Date(), 1));
    const to = dateTo || endOfDay(subDays(new Date(), 1));

    // ─── STEP 1: Fetch raw articles ─────────────────────
    const rawArticles = await this.prisma.rawArticle.findMany({
      where: {
        fetchedAt: { gte: from, lte: to },
      },
      include: { source: true },
      orderBy: { score: 'desc' },
      take: 300,
    });

    if (rawArticles.length === 0) {
      this.logger.warn('No articles found for digest period');
      return null;
    }

    this.logger.log(`Step 1: Fetched ${rawArticles.length} raw articles`);

    // ─── STEP 2: Cross-source deduplication ─────────────
    const deduped = this.dedupService.deduplicate(rawArticles);
    this.logger.log(
      `Step 2: Deduplicated to ${deduped.length} unique articles`,
    );

    // ─── STEP 3: Pass 1 — LLM quick filter ─────────────
    const filterInput = deduped.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary || undefined,
      source: a.source.name,
    }));

    const relevantIds = await this.llmService.filterArticles(filterInput);
    const filtered = deduped.filter((a) => relevantIds.includes(a.id));

    this.logger.log(
      `Step 3: LLM filter kept ${filtered.length}/${deduped.length} articles`,
    );

    if (filtered.length === 0) {
      this.logger.warn('No relevant articles after filtering');
      return null;
    }

    // ─── STEP 4: Scrape full content for filtered articles ──
    // Only scrape the top candidates (by score) to save time
    const toScrape = filtered.slice(0, 60);
    const scrapedContent = await this.scraperService.scrapeMany(
      toScrape.map((a) => ({ id: a.id, url: a.url })),
      5,
    );

    this.logger.log(
      `Step 4: Scraped content for ${scrapedContent.size}/${toScrape.length} articles`,
    );

    // ─── STEP 5: Build personalization context ──────────
    const personalContext = await this.getPersonalizationContext();

    // ─── STEP 6: Pass 2 — Deep comparative ranking ──────
    // Count how many sources each story appeared in (pre-dedup)
    const crossSourceCounts = new Map<string, number>();
    for (const article of filtered) {
      // Count raw articles that matched this deduped article's title
      const titleLower = article.title.toLowerCase();
      const count = rawArticles.filter(
        (r) =>
          r.id === article.id ||
          r.title.toLowerCase() === titleLower,
      ).length;
      crossSourceCounts.set(article.id, count);
    }

    // Take top 50 for ranking (LLM context limit)
    const forRanking = filtered.slice(0, 50).map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary || undefined,
      content: scrapedContent.get(a.id)?.text,
      url: a.url || undefined,
      source: a.source.name,
      crossSourceCount: crossSourceCounts.get(a.id) || 1,
    }));

    const ranked = await this.llmService.rankArticles(
      forRanking,
      personalContext || undefined,
    );

    this.logger.log(`Step 6: Ranked ${ranked.length} articles`);

    // Take top 20
    ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topItems = ranked.slice(0, 20);

    if (topItems.length === 0) {
      this.logger.warn('No relevant articles found after ranking');
      return null;
    }

    // ─── STEP 7: Detect trends ──────────────────────────
    const trendInput = topItems.map((item) => {
      const article = filtered.find((a) => a.id === item.rawArticleId);
      return {
        id: item.rawArticleId,
        title: article?.title || '',
        summary: item.aiSummary,
        topicTags: item.topicTags,
      };
    });

    const trends = await this.trendService.detectTrends(trendInput);

    this.logger.log(`Step 7: Detected ${trends.length} trends`);

    // ─── STEP 8: Create the digest ──────────────────────
    const trendSummary =
      trends.length > 0
        ? '\n\nEmerging trends:\n' +
          trends
            .map((t) => `- ${t.theme} (${t.articleCount} articles): ${t.description}`)
            .join('\n')
        : '';

    const digest = await this.prisma.digest.create({
      data: {
        title: `AI Digest - ${format(from, 'MMM d, yyyy')}`,
        summary:
          `Top ${topItems.length} AI/ML developments from ${format(from, 'MMM d')} to ${format(to, 'MMM d, yyyy')}` +
          trendSummary,
        dateFrom: from,
        dateTo: to,
        items: {
          create: topItems.map((item, index) => ({
            rawArticleId: item.rawArticleId,
            rank: index + 1,
            relevanceScore: item.relevanceScore,
            aiSummary: item.aiSummary,
            topicTags: item.topicTags,
            whyItMatters: item.whyItMatters || '',
          })),
        },
      },
      include: {
        items: {
          include: { rawArticle: { include: { source: true } } },
          orderBy: { rank: 'asc' },
        },
      },
    });

    this.logger.log(
      `Created digest "${digest.title}" with ${digest.items.length} items`,
    );
    return digest;
  }

  /**
   * Builds a personalization context string from recently promoted content.
   * This tells the ranking LLM what topics the user has been creating content about,
   * so it can boost novel-but-related items and deprioritize exact repeats.
   */
  private async getPersonalizationContext(): Promise<string | null> {
    const recentContent = await this.prisma.contentPiece.findMany({
      where: {
        status: { in: ['RESEARCHING', 'CREATING', 'READY', 'POSTED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { title: true, format: true, targetPlatform: true },
    });

    if (recentContent.length === 0) return null;

    return recentContent
      .map(
        (c) =>
          `- "${c.title}" (${c.format} for ${c.targetPlatform})`,
      )
      .join('\n');
  }

  async getDigest(id: string) {
    return this.prisma.digest.findUnique({
      where: { id },
      include: {
        items: {
          include: { rawArticle: { include: { source: true } } },
          orderBy: { rank: 'asc' },
        },
        contentIdeas: true,
      },
    });
  }

  async listDigests(page = 1, limit = 10) {
    const [digests, total] = await Promise.all([
      this.prisma.digest.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true, contentIdeas: true } } },
      }),
      this.prisma.digest.count(),
    ]);

    return { digests, total, page, totalPages: Math.ceil(total / limit) };
  }
}

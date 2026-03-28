import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { DedupService } from './dedup.service';
import { ScraperService } from './scraper.service';
import { TrendService, DetectedTrend } from './trend.service';
import { subDays, startOfDay, endOfDay, format, differenceInHours } from 'date-fns';

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
    // Fetch ALL articles in the window (don't pre-filter by score — that drops
    // fresh breakthroughs with low engagement). Then rank by a composite signal
    // that balances engagement with recency.
    const allArticles = await this.prisma.rawArticle.findMany({
      where: {
        fetchedAt: { gte: from, lte: to },
      },
      include: { source: true },
    });

    if (allArticles.length === 0) {
      this.logger.warn('No articles found for digest period');
      return null;
    }

    // Composite scoring: balance raw engagement with recency and source quality.
    // - Recent items (published in last 24h) get a boost so fresh breakthroughs
    //   aren't buried by older viral tweets.
    // - arXiv/tech blog items with score=0 still surface if they're new.
    const now = new Date();
    const scored = allArticles.map((a) => {
      const rawScore = a.score || 0;
      const publishDate = a.publishedAt || a.fetchedAt;
      const hoursAgo = Math.max(1, differenceInHours(now, publishDate));

      // Recency multiplier: 2x for <6h old, 1.5x for <24h, 1x for older
      const recencyBoost = hoursAgo <= 6 ? 2.0 : hoursAgo <= 24 ? 1.5 : 1.0;

      // Source quality floor: arXiv papers and tech blogs are inherently
      // valuable even with 0 engagement — give them a minimum score
      const sourceFloor =
        a.source.type === 'ARXIV' ? 50 :
        a.source.type === 'TECH_BLOG' ? 30 :
        a.source.type === 'HUGGINGFACE' ? 20 : 0;

      const effectiveScore = Math.max(rawScore, sourceFloor);

      return {
        article: a,
        compositeScore: effectiveScore * recencyBoost,
      };
    });

    // Sort by composite score and take top 300
    scored.sort((a, b) => b.compositeScore - a.compositeScore);
    const rawArticles = scored.slice(0, 300).map((s) => s.article);

    this.logger.log(
      `Step 1: Fetched ${allArticles.length} articles, selected top ${rawArticles.length} by composite score (recency + engagement)`,
    );

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
      score: a.score || undefined,
      publishedAge: this.formatAge(a.publishedAt || a.fetchedAt, now),
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
    // Build a title->count lookup once (O(n)) instead of filtering per article (O(n²))
    const titleCountMap = new Map<string, number>();
    for (const r of rawArticles) {
      const key = r.title.toLowerCase();
      titleCountMap.set(key, (titleCountMap.get(key) || 0) + 1);
    }
    const crossSourceCounts = new Map<string, number>();
    for (const article of filtered) {
      const count = titleCountMap.get(article.title.toLowerCase()) || 1;
      crossSourceCounts.set(article.id, count);
    }

    // Take top 50 for ranking (LLM context limit)
    // Use numeric indices instead of CUIDs to avoid LLM hallucination of IDs
    const rankingSlice = filtered.slice(0, 50);
    const indexToId = new Map(rankingSlice.map((a, i) => [i + 1, a.id]));

    const forRanking = rankingSlice.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary || undefined,
      content: scrapedContent.get(a.id)?.text,
      url: a.url || undefined,
      source: a.source.name,
      crossSourceCount: crossSourceCounts.get(a.id) || 1,
      score: a.score || undefined,
      publishedAge: this.formatAge(a.publishedAt || a.fetchedAt, now),
    }));

    const ranked = await this.llmService.rankArticles(
      forRanking,
      personalContext || undefined,
    );

    // Map numeric indices back to real article IDs
    const mappedRanked = ranked
      .filter((item) => indexToId.has(item.index))
      .map((item) => ({
        ...item,
        rawArticleId: indexToId.get(item.index)!,
      }));

    const droppedCount = ranked.length - mappedRanked.length;
    if (droppedCount > 0) {
      this.logger.warn(`Dropped ${droppedCount} ranked items with invalid indices`);
    }

    this.logger.log(`Step 6: Ranked ${mappedRanked.length} articles`);

    // Take top 50 for the digest (ideas generation will use top 20 as primary)
    mappedRanked.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topItems = mappedRanked.slice(0, 50);

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

  private formatAge(date: Date, now: Date): string {
    const hours = differenceInHours(now, date);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
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

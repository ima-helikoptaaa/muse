import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Source, SourceType } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { ISourceFetcher } from './fetcher.interface';
import {
  ArxivFetcher,
  HackerNewsFetcher,
  RedditFetcher,
  GitHubTrendingFetcher,
  HuggingFaceFetcher,
  TechBlogsFetcher,
  ProductHuntFetcher,
  TwitterFetcher,
} from './fetchers';

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);
  private readonly fetcherMap: Map<string, ISourceFetcher>;

  constructor(
    private prisma: PrismaService,
    private arxivFetcher: ArxivFetcher,
    private hnFetcher: HackerNewsFetcher,
    private redditFetcher: RedditFetcher,
    private githubFetcher: GitHubTrendingFetcher,
    private hfFetcher: HuggingFaceFetcher,
    private techBlogsFetcher: TechBlogsFetcher,
    private phFetcher: ProductHuntFetcher,
    private twitterFetcher: TwitterFetcher,
  ) {
    this.fetcherMap = new Map<string, ISourceFetcher>([
      ['ARXIV', this.arxivFetcher],
      ['HACKER_NEWS', this.hnFetcher],
      ['REDDIT', this.redditFetcher],
      ['GITHUB_TRENDING', this.githubFetcher],
      ['HUGGINGFACE', this.hfFetcher],
      ['TECH_BLOG', this.techBlogsFetcher],
      ['PRODUCT_HUNT', this.phFetcher],
      ['TWITTER', this.twitterFetcher],
    ]);
  }

  async listSources() {
    return this.prisma.source.findMany({ orderBy: { name: 'asc' } });
  }

  async createSource(data: {
    name: string;
    type: SourceType;
    url: string;
    fetchConfig?: any;
  }) {
    return this.prisma.source.create({ data });
  }

  async toggleSource(id: string, enabled: boolean) {
    return this.prisma.source.update({ where: { id }, data: { enabled } });
  }

  async fetchAll(): Promise<{ totalArticles: number; bySource: Record<string, number> }> {
    const sources = await this.prisma.source.findMany({
      where: { enabled: true },
    });

    let totalArticles = 0;
    const bySource: Record<string, number> = {};

    for (const source of sources) {
      const count = await this.fetchSource(source);
      bySource[source.name] = count;
      totalArticles += count;
    }

    return { totalArticles, bySource };
  }

  async fetchByType(type: SourceType): Promise<number> {
    const sources = await this.prisma.source.findMany({
      where: { type, enabled: true },
    });

    let total = 0;
    for (const source of sources) {
      total += await this.fetchSource(source);
    }
    return total;
  }

  private async fetchSource(source: Source): Promise<number> {
    const fetcher = this.fetcherMap.get(source.type);
    if (!fetcher) {
      this.logger.warn(`No fetcher for source type: ${source.type}`);
      return 0;
    }

    try {
      const articles = await fetcher.fetch(source);
      const { stored } = await this.storeArticles(source.id, articles);

      await this.prisma.source.update({
        where: { id: source.id },
        data: { lastFetched: new Date() },
      });

      return stored;
    } catch (error) {
      this.logger.error(
        `Failed to fetch source ${source.name}`,
        error,
      );
      return 0;
    }
  }

  async ingestArticles(
    sourceType: SourceType,
    articles: FetchedArticle[],
  ): Promise<{ stored: number; created: number }> {
    const sources = await this.prisma.source.findMany({
      where: { type: sourceType, enabled: true },
      orderBy: { createdAt: 'asc' },
      take: 1,
    });
    const source = sources[0];
    if (!source) {
      this.logger.warn(`No enabled source found for type: ${sourceType}`);
      return { stored: 0, created: 0 };
    }

    const { stored, created } = await this.storeArticles(source.id, articles);

    await this.prisma.source.update({
      where: { id: source.id },
      data: { lastFetched: new Date() },
    });

    this.logger.log(
      `Ingested ${stored} articles (${created} new) for ${sourceType} from remote discovery`,
    );
    return { stored, created };
  }

  private async storeArticles(
    sourceId: string,
    articles: FetchedArticle[],
  ): Promise<{ stored: number; created: number }> {
    let stored = 0;
    let created = 0;

    for (const article of articles) {
      if (!article.externalId) {
        this.logger.warn(`Skipping article with empty externalId: ${article.title}`);
        continue;
      }

      try {
        const existing = await this.prisma.rawArticle.findUnique({
          where: {
            sourceId_externalId: { sourceId, externalId: article.externalId },
          },
          select: { id: true },
        });

        await this.prisma.rawArticle.upsert({
          where: {
            sourceId_externalId: {
              sourceId,
              externalId: article.externalId,
            },
          },
          update: {
            title: article.title,
            summary: article.summary,
            score: article.score,
            tags: article.tags,
          },
          create: {
            sourceId,
            externalId: article.externalId,
            title: article.title,
            url: article.url,
            authors: article.authors,
            summary: article.summary,
            content: article.content,
            score: article.score,
            tags: article.tags,
            publishedAt: article.publishedAt,
          },
        });
        stored++;
        if (!existing) created++;
      } catch (error) {
        this.logger.warn(
          `Failed to store article: ${article.title}`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    return { stored, created };
  }

  async getArticles(options?: {
    sourceType?: SourceType;
    since?: Date;
    limit?: number;
  }) {
    return this.prisma.rawArticle.findMany({
      where: {
        ...(options?.sourceType && {
          source: { type: options.sourceType },
        }),
        ...(options?.since && {
          fetchedAt: { gte: options.since },
        }),
      },
      include: { source: true },
      orderBy: { fetchedAt: 'desc' },
      take: options?.limit || 100,
    });
  }
}

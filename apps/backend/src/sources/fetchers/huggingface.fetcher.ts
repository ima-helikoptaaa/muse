import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import Parser from 'rss-parser';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

@Injectable()
export class HuggingFaceFetcher implements ISourceFetcher {
  readonly sourceType = 'HUGGINGFACE';
  private readonly logger = new Logger(HuggingFaceFetcher.name);
  private parser = new Parser();

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const articles: FetchedArticle[] = [];

    // Fetch daily papers API
    try {
      const { data: papers } = await axios.get(
        'https://huggingface.co/api/daily_papers',
      );

      for (const paper of papers || []) {
        articles.push({
          externalId: paper.paper?.id || paper.id || String(Math.random()),
          title: paper.title || paper.paper?.title || '',
          url: paper.paper?.id
            ? `https://huggingface.co/papers/${paper.paper.id}`
            : undefined,
          authors: paper.paper?.authors?.map(
            (a: any) => a.name || a.user?.fullname || '',
          ) || [],
          summary: paper.paper?.summary || undefined,
          score: paper.paper?.upvotes || paper.numLikes || 0,
          tags: ['huggingface', 'paper'],
          publishedAt: paper.publishedAt
            ? new Date(paper.publishedAt)
            : new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Failed to fetch HuggingFace daily papers', error);
    }

    // Fetch blog RSS
    try {
      const feed = await this.parser.parseURL(
        'https://huggingface.co/blog/feed.xml',
      );

      for (const item of feed.items?.slice(0, 20) || []) {
        articles.push({
          externalId: item.guid || item.link || '',
          title: item.title || '',
          url: item.link,
          authors: item.creator ? [item.creator] : [],
          summary: item.contentSnippet?.slice(0, 500) || undefined,
          tags: ['huggingface', 'blog'],
          publishedAt: item.pubDate
            ? new Date(item.pubDate)
            : undefined,
        });
      }
    } catch (error) {
      this.logger.error('Failed to fetch HuggingFace blog RSS', error);
    }

    this.logger.log(
      `Fetched ${articles.length} articles from HuggingFace`,
    );
    return articles;
  }
}

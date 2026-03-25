import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

const ARXIV_FEEDS = [
  'https://rss.arxiv.org/rss/cs.AI',
  'https://rss.arxiv.org/rss/cs.CL',
  'https://rss.arxiv.org/rss/cs.LG',
];

@Injectable()
export class ArxivFetcher implements ISourceFetcher {
  readonly sourceType = 'ARXIV';
  private readonly logger = new Logger(ArxivFetcher.name);
  private parser = new Parser();

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const articles: FetchedArticle[] = [];
    const config = source.fetchConfig as { feeds?: string[] } | null;
    const feeds = config?.feeds || ARXIV_FEEDS;

    for (const feedUrl of feeds) {
      try {
        // Respect ArXiv rate limits
        if (feeds.indexOf(feedUrl) > 0) {
          await new Promise((r) => setTimeout(r, 3000));
        }

        const feed = await this.parser.parseURL(feedUrl);

        for (const item of feed.items || []) {
          const id = item.link?.match(/abs\/(.+)/)?.[1] || item.guid;
          if (!id) continue;

          articles.push({
            externalId: id,
            title: item.title?.replace(/\n/g, ' ').trim() || '',
            url: item.link,
            authors: item.creator
              ? item.creator.split(',').map((a) => a.trim())
              : [],
            summary: item.contentSnippet || item.content || undefined,
            tags: ['arxiv', feedUrl.split('/').pop() || ''],
            publishedAt: item.pubDate
              ? new Date(item.pubDate)
              : undefined,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to fetch ArXiv feed: ${feedUrl}`, error);
      }
    }

    this.logger.log(`Fetched ${articles.length} articles from ArXiv`);
    return articles;
  }
}

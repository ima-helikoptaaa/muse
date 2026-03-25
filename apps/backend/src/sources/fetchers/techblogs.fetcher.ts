import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

const DEFAULT_BLOG_FEEDS = [
  { name: 'OpenAI', url: 'https://openai.com/blog/rss.xml' },
  { name: 'Anthropic', url: 'https://www.anthropic.com/rss.xml' },
  { name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/' },
];

@Injectable()
export class TechBlogsFetcher implements ISourceFetcher {
  readonly sourceType = 'TECH_BLOG';
  private readonly logger = new Logger(TechBlogsFetcher.name);
  private parser = new Parser();

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const config = source.fetchConfig as
      | { feeds?: { name: string; url: string }[] }
      | null;
    const feeds = config?.feeds || DEFAULT_BLOG_FEEDS;
    const articles: FetchedArticle[] = [];

    for (const blog of feeds) {
      try {
        const feed = await this.parser.parseURL(blog.url);

        for (const item of feed.items?.slice(0, 10) || []) {
          articles.push({
            externalId: item.guid || item.link || '',
            title: item.title || '',
            url: item.link,
            authors: item.creator
              ? [item.creator]
              : [blog.name],
            summary: item.contentSnippet?.slice(0, 500) || undefined,
            tags: ['tech-blog', blog.name.toLowerCase().replace(/\s+/g, '-')],
            publishedAt: item.pubDate
              ? new Date(item.pubDate)
              : undefined,
          });
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch blog: ${blog.name} (${blog.url})`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    this.logger.log(
      `Fetched ${articles.length} articles from tech blogs`,
    );
    return articles;
  }
}

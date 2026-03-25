import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Parser from 'rss-parser';
import axios from 'axios';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

@Injectable()
export class TwitterFetcher implements ISourceFetcher {
  readonly sourceType = 'TWITTER';
  private readonly logger = new Logger(TwitterFetcher.name);
  private readonly parser = new Parser();

  constructor(private configService: ConfigService) {}

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const rsshubBase = this.configService.get<string>(
      'rsshub.baseUrl',
      'http://localhost:1200',
    );

    const config = source.fetchConfig as {
      accounts?: string[];
    } | null;

    const accounts = config?.accounts || [];
    if (accounts.length === 0) {
      this.logger.warn('No Twitter accounts configured');
      return [];
    }

    const articles: FetchedArticle[] = [];

    for (const username of accounts) {
      try {
        const feedUrl = `${rsshubBase}/twitter/user/${username}`;
        const feed = await this.parser.parseURL(feedUrl);

        for (const item of feed.items.slice(0, 20)) {
          if (!item.title && !item.contentSnippet) continue;

          const text = item.contentSnippet || item.title || '';

          // Skip very short tweets with no substance
          if (text.length < 30) continue;

          articles.push({
            externalId: `tweet-${username}-${item.guid || item.link || item.title}`,
            title: `@${username}: ${text.slice(0, 120)}${text.length > 120 ? '...' : ''}`,
            url: item.link || `https://x.com/${username}`,
            authors: [username],
            summary: text,
            score: undefined,
            tags: ['twitter', `@${username}`],
            publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
          });
        }

        this.logger.log(
          `Fetched ${feed.items.length} tweets from @${username} via RSSHub`,
        );

        // Small delay between accounts to be nice to RSSHub
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        this.logger.warn(
          `Failed to fetch tweets from @${username} via RSSHub: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    // Enrich tweets with engagement scores via syndication API
    await this.enrichWithEngagement(articles);

    return articles;
  }

  /**
   * Fetches like/retweet counts from Twitter's public syndication endpoint.
   * No auth required. Calculates engagement score: likes + retweets*2 + quotes*3
   */
  private async enrichWithEngagement(articles: FetchedArticle[]): Promise<void> {
    let enriched = 0;

    // Process in batches of 5 to avoid hammering the endpoint
    for (let i = 0; i < articles.length; i += 5) {
      const batch = articles.slice(i, i + 5);

      await Promise.all(
        batch.map(async (article) => {
          try {
            const tweetId = this.extractTweetId(article.url);
            if (!tweetId) return;

            const res = await axios.get(
              `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`,
              { timeout: 5000 },
            );

            const data = res.data;
            if (!data || !data.favorite_count) return;

            const likes = data.favorite_count || 0;
            const retweets = data.retweet_count || 0;
            const quotes = data.quote_count || 0;

            article.score = likes + retweets * 2 + quotes * 3;
            enriched++;
          } catch {
            // Silently skip — engagement is nice-to-have, not critical
          }
        }),
      );

      // Small delay between batches
      if (i + 5 < articles.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    this.logger.log(
      `Enriched ${enriched}/${articles.length} tweets with engagement scores`,
    );
  }

  private extractTweetId(url?: string): string | null {
    if (!url) return null;
    // URL format: https://x.com/username/status/1234567890
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  }
}

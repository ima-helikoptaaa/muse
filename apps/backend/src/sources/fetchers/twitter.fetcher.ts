import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

@Injectable()
export class TwitterFetcher implements ISourceFetcher {
  readonly sourceType = 'TWITTER';
  private readonly logger = new Logger(TwitterFetcher.name);

  private rateLimitRemaining: number | null = null;
  private rateLimitReset: number | null = null;

  constructor(private configService: ConfigService) {}

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const config = source.fetchConfig as {
      accounts?: string[];
    } | null;

    const accounts = config?.accounts || [];
    if (accounts.length === 0) {
      this.logger.warn('No Twitter accounts configured');
      return [];
    }

    const articles: FetchedArticle[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const username = accounts[i];

      // Wait for rate limit window to reset if we're out of quota
      await this.waitForRateLimit();

      try {
        const { tweets, headers } = await this.fetchViaSyndication(username);
        this.updateRateLimit(headers);

        for (const tweet of tweets.slice(0, 10)) {
          if (tweet.text.length < 30) continue;

          const score =
            (tweet.likes || 0) +
            (tweet.retweets || 0) * 2 +
            (tweet.quotes || 0) * 3;

          articles.push({
            externalId: `tweet-${username}-${tweet.id}`,
            title: `@${username}: ${tweet.text.slice(0, 120)}${tweet.text.length > 120 ? '...' : ''}`,
            url: `https://x.com/${username}/status/${tweet.id}`,
            authors: [username],
            summary: tweet.text,
            score: score > 0 ? score : undefined,
            tags: ['twitter', `@${username}`],
            publishedAt: tweet.createdAt ? new Date(tweet.createdAt) : undefined,
          });
        }

        if (tweets.length > 0) {
          this.logger.log(
            `Fetched ${tweets.length} tweets from @${username} (${i + 1}/${accounts.length}, remaining: ${this.rateLimitRemaining})`,
          );
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to fetch tweets from @${username}: ${msg}`);

        if (msg.includes('429')) {
          // Force wait for reset on 429
          if (this.rateLimitReset) {
            this.rateLimitRemaining = 0;
            await this.waitForRateLimit();
          }
        }
      }
    }

    return articles;
  }

  private updateRateLimit(headers: Record<string, string>) {
    const remaining = headers['x-rate-limit-remaining'];
    const reset = headers['x-rate-limit-reset'];

    if (remaining !== undefined) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }
    if (reset !== undefined) {
      this.rateLimitReset = parseInt(reset, 10);
    }
  }

  private async waitForRateLimit() {
    if (this.rateLimitRemaining !== null && this.rateLimitRemaining <= 1 && this.rateLimitReset) {
      const now = Math.floor(Date.now() / 1000);
      const waitSec = this.rateLimitReset - now + 10;

      if (waitSec > 0) {
        this.logger.log(`Rate limit exhausted, waiting ${waitSec}s for reset...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        // Reset tracking after waiting
        this.rateLimitRemaining = null;
        this.rateLimitReset = null;
      }
    }
  }

  private async fetchViaSyndication(username: string) {
    const res: AxiosResponse = await axios.get(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
      {
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    );

    const headers: Record<string, string> = {};
    for (const key of ['x-rate-limit-remaining', 'x-rate-limit-reset', 'x-rate-limit-limit']) {
      const val = res.headers[key];
      if (val) headers[key] = String(val);
    }

    const html = res.data as string;
    const tweets: Array<{
      id: string;
      text: string;
      likes: number;
      retweets: number;
      quotes: number;
      createdAt: string | null;
    }> = [];

    // Extract JSON data from script tags
    const scriptMatch = html.match(
      /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (scriptMatch) {
      try {
        const data = JSON.parse(scriptMatch[1]);
        const entries =
          data?.props?.pageProps?.timeline?.entries ||
          data?.props?.pageProps?.timeline?.timeline?.entries ||
          [];

        for (const entry of entries) {
          const tweet = entry?.content?.tweet || entry?.tweet;
          if (!tweet?.id_str) continue;

          tweets.push({
            id: tweet.id_str,
            text: tweet.full_text || tweet.text || '',
            likes: tweet.favorite_count || 0,
            retweets: tweet.retweet_count || 0,
            quotes: tweet.quote_count || 0,
            createdAt: tweet.created_at || null,
          });
        }
      } catch (e) {
        this.logger.warn(`Failed to parse syndication data for @${username}`);
      }
    }

    return { tweets, headers };
  }
}

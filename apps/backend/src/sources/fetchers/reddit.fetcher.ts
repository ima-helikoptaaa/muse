import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

const DEFAULT_SUBREDDITS = ['MachineLearning', 'LocalLLaMA', 'artificial'];

@Injectable()
export class RedditFetcher implements ISourceFetcher {
  readonly sourceType = 'REDDIT';
  private readonly logger = new Logger(RedditFetcher.name);
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private configService: ConfigService) {}

  private async authenticate(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('reddit.clientId');
    const clientSecret = this.configService.get<string>('reddit.clientSecret');
    const userAgent = this.configService.get<string>('reddit.userAgent');

    if (!clientId || !clientSecret) {
      this.logger.warn('Reddit credentials not configured, skipping');
      return null;
    }

    try {
      const { data } = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          auth: { username: clientId, password: clientSecret },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': userAgent,
          },
        },
      );

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;
      return this.accessToken;
    } catch (error) {
      this.logger.error('Reddit authentication failed', error);
      return null;
    }
  }

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const token = await this.authenticate();
    if (!token) return [];

    const config = source.fetchConfig as { subreddits?: string[] } | null;
    const subreddits = config?.subreddits || DEFAULT_SUBREDDITS;
    const userAgent = this.configService.get<string>('reddit.userAgent');
    const articles: FetchedArticle[] = [];

    for (const sub of subreddits) {
      try {
        const { data } = await axios.get(
          `https://oauth.reddit.com/r/${sub}/hot.json?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': userAgent,
            },
          },
        );

        for (const child of data.data.children || []) {
          const post = child.data;
          articles.push({
            externalId: post.id,
            title: post.title,
            url: post.url,
            authors: post.author ? [post.author] : [],
            summary: post.selftext?.slice(0, 500) || undefined,
            score: post.score,
            tags: ['reddit', sub],
            publishedAt: post.created_utc
              ? new Date(post.created_utc * 1000)
              : undefined,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to fetch from r/${sub}`, error);
      }
    }

    this.logger.log(`Fetched ${articles.length} articles from Reddit`);
    return articles;
  }
}

#!/usr/bin/env npx tsx
/**
 * Standalone discovery script — runs locally, pushes results to AWS backend.
 * No local DB or Redis needed.
 *
 * Usage: MUSE_API_URL=https://your-server/api npx tsx scripts/discovery.ts
 *
 * Env vars:
 *   MUSE_API_URL          - AWS backend URL (required)
 *   REDDIT_CLIENT_ID      - Reddit API credentials
 *   REDDIT_CLIENT_SECRET
 *   REDDIT_USER_AGENT
 *   PRODUCTHUNT_API_TOKEN - Product Hunt API token
 */

import axios from 'axios';

// Lightweight ConfigService shim for fetchers that need it
class SimpleConfigService {
  private config: Record<string, any>;

  constructor() {
    this.config = {
      'reddit.clientId': process.env.REDDIT_CLIENT_ID,
      'reddit.clientSecret': process.env.REDDIT_CLIENT_SECRET,
      'reddit.userAgent': process.env.REDDIT_USER_AGENT || 'muse:v1.0.0',
      'productHunt.apiToken': process.env.PRODUCTHUNT_API_TOKEN,
    };
  }

  get<T>(key: string): T | undefined {
    return this.config[key] as T | undefined;
  }
}

// Import fetchers — they use @Injectable but we instantiate them directly
import { ArxivFetcher } from '../apps/backend/src/sources/fetchers/arxiv.fetcher';
import { HackerNewsFetcher } from '../apps/backend/src/sources/fetchers/hackernews.fetcher';
import { RedditFetcher } from '../apps/backend/src/sources/fetchers/reddit.fetcher';
import { GitHubTrendingFetcher } from '../apps/backend/src/sources/fetchers/github-trending.fetcher';
import { HuggingFaceFetcher } from '../apps/backend/src/sources/fetchers/huggingface.fetcher';
import { TechBlogsFetcher } from '../apps/backend/src/sources/fetchers/techblogs.fetcher';
import { ProductHuntFetcher } from '../apps/backend/src/sources/fetchers/producthunt.fetcher';
import { TwitterFetcher } from '../apps/backend/src/sources/fetchers/twitter.fetcher';

const API_URL = process.env.MUSE_API_URL;
if (!API_URL) {
  console.error('MUSE_API_URL is required');
  process.exit(1);
}

const api = axios.create({ baseURL: API_URL, timeout: 30000 });
const configService = new SimpleConfigService() as any;

const FETCHER_MAP: Record<string, any> = {
  ARXIV: new ArxivFetcher(),
  HACKER_NEWS: new HackerNewsFetcher(),
  REDDIT: new RedditFetcher(configService),
  GITHUB_TRENDING: new GitHubTrendingFetcher(),
  HUGGINGFACE: new HuggingFaceFetcher(),
  TECH_BLOG: new TechBlogsFetcher(),
  PRODUCT_HUNT: new ProductHuntFetcher(configService),
  TWITTER: new TwitterFetcher(configService),
};

async function main() {
  console.log(`[discovery] Starting at ${new Date().toISOString()}`);
  console.log(`[discovery] API: ${API_URL}`);

  // 1. Get source configs from AWS
  let sources: any[];
  try {
    const { data } = await api.get('/sources');
    sources = data.filter((s: any) => s.enabled);
    console.log(`[discovery] Found ${sources.length} enabled sources`);
  } catch (err) {
    console.error('[discovery] Failed to fetch sources from API:', (err as Error).message);
    process.exit(1);
  }

  let totalIngested = 0;

  // 2. Run each fetcher locally
  for (const source of sources) {
    const fetcher = FETCHER_MAP[source.type];
    if (!fetcher) {
      console.log(`[discovery] No fetcher for ${source.type}, skipping`);
      continue;
    }

    console.log(`[discovery] Fetching ${source.name} (${source.type})...`);

    try {
      const articles = await fetcher.fetch(source);
      if (articles.length === 0) {
        console.log(`[discovery] No articles from ${source.name}`);
        continue;
      }

      // 3. Push to AWS backend
      const { data: result } = await api.post('/sources/articles/ingest', {
        sourceType: source.type,
        articles,
      });

      console.log(`[discovery] ${source.name}: ${result.stored} articles ingested`);
      totalIngested += result.stored;
    } catch (err) {
      console.error(`[discovery] Failed ${source.name}:`, (err as Error).message);
    }
  }

  console.log(`[discovery] Done. Total ingested: ${totalIngested}`);
}

main().catch((err) => {
  console.error('[discovery] Fatal error:', err);
  process.exit(1);
});

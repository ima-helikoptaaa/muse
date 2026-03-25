import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { AI_KEYWORDS } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

const HN_API = 'https://hacker-news.firebaseio.com/v0';

interface HNItem {
  id: number;
  title?: string;
  url?: string;
  by?: string;
  score?: number;
  time?: number;
  text?: string;
  type?: string;
}

@Injectable()
export class HackerNewsFetcher implements ISourceFetcher {
  readonly sourceType = 'HACKER_NEWS';
  private readonly logger = new Logger(HackerNewsFetcher.name);

  async fetch(source: Source): Promise<FetchedArticle[]> {
    try {
      const { data: storyIds } = await axios.get<number[]>(
        `${HN_API}/topstories.json`,
      );

      const top100 = storyIds.slice(0, 100);
      const batchSize = 20;
      const articles: FetchedArticle[] = [];

      for (let i = 0; i < top100.length; i += batchSize) {
        const batch = top100.slice(i, i + batchSize);
        const items = await Promise.all(
          batch.map((id) =>
            axios
              .get<HNItem>(`${HN_API}/item/${id}.json`)
              .then((r) => r.data)
              .catch(() => null),
          ),
        );

        for (const item of items) {
          if (!item || !item.title || item.type !== 'story') continue;

          const titleLower = item.title.toLowerCase();
          const isRelevant = AI_KEYWORDS.some((kw) =>
            titleLower.includes(kw),
          );
          if (!isRelevant) continue;

          articles.push({
            externalId: String(item.id),
            title: item.title,
            url: item.url,
            authors: item.by ? [item.by] : [],
            summary: item.text || undefined,
            score: item.score,
            tags: ['hacker-news'],
            publishedAt: item.time
              ? new Date(item.time * 1000)
              : undefined,
          });
        }
      }

      this.logger.log(
        `Fetched ${articles.length} AI-relevant articles from Hacker News`,
      );
      return articles;
    } catch (error) {
      this.logger.error('Failed to fetch from Hacker News', error);
      return [];
    }
  }
}

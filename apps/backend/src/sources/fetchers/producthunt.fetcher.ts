import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { AI_KEYWORDS } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

const PH_GRAPHQL = 'https://api.producthunt.com/v2/api/graphql';

const POSTS_QUERY = `
  query {
    posts(order: VOTES, first: 30) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          votesCount
          createdAt
          makers { name }
          topics(first: 5) { edges { node { name } } }
        }
      }
    }
  }
`;

@Injectable()
export class ProductHuntFetcher implements ISourceFetcher {
  readonly sourceType = 'PRODUCT_HUNT';
  private readonly logger = new Logger(ProductHuntFetcher.name);

  constructor(private configService: ConfigService) {}

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const token = this.configService.get<string>('productHunt.apiToken');
    if (!token) {
      this.logger.warn('Product Hunt API token not configured, skipping');
      return [];
    }

    try {
      const { data } = await axios.post(
        PH_GRAPHQL,
        { query: POSTS_QUERY },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const posts = data.data?.posts?.edges || [];
      const articles: FetchedArticle[] = [];

      for (const { node: post } of posts) {
        const text =
          `${post.name} ${post.tagline} ${post.description || ''}`.toLowerCase();
        const isRelevant = AI_KEYWORDS.some((kw) => text.includes(kw));
        if (!isRelevant) continue;

        const topics = (post.topics?.edges || []).map(
          (e: any) => e.node.name,
        );

        articles.push({
          externalId: post.id,
          title: `${post.name} - ${post.tagline}`,
          url: post.url,
          authors: (post.makers || []).map((m: any) => m.name),
          summary: post.description?.slice(0, 500) || post.tagline,
          score: post.votesCount,
          tags: ['product-hunt', ...topics],
          publishedAt: post.createdAt
            ? new Date(post.createdAt)
            : undefined,
        });
      }

      this.logger.log(
        `Fetched ${articles.length} AI-relevant products from Product Hunt`,
      );
      return articles;
    } catch (error) {
      this.logger.error('Failed to fetch from Product Hunt', error);
      return [];
    }
  }
}

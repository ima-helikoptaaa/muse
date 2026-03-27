import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';
import { AI_KEYWORDS } from '@muse/shared';
import { ISourceFetcher } from '../fetcher.interface';

@Injectable()
export class GitHubTrendingFetcher implements ISourceFetcher {
  readonly sourceType = 'GITHUB_TRENDING';
  private readonly logger = new Logger(GitHubTrendingFetcher.name);

  async fetch(source: Source): Promise<FetchedArticle[]> {
    const articles: FetchedArticle[] = [];

    try {
      const { data: html } = await axios.get(
        'https://github.com/trending?since=daily',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; Muse/1.0; Content Engine)',
          },
        },
      );

      const $ = cheerio.load(html);

      $('article.Box-row').each((_, el) => {
        const repoLink = $(el).find('h2 a').attr('href')?.trim();
        if (!repoLink) return;

        const repoName = repoLink.replace(/^\//, '');
        const description =
          $(el).find('p.col-9').text().trim() || '';
        const starsText =
          $(el)
            .find('a.Link--muted:first')
            .text()
            .trim()
            .replace(/,/g, '') || '0';
        const stars = parseInt(starsText, 10) || 0;
        const language =
          $(el).find('[itemprop="programmingLanguage"]').text().trim() || '';

        const descLower = (description + ' ' + repoName).toLowerCase();
        const isRelevant = AI_KEYWORDS.some((kw) => descLower.includes(kw));
        if (!isRelevant) return;

        articles.push({
          externalId: repoName,
          title: repoName,
          url: `https://github.com/${repoName}`,
          authors: [repoName.split('/')[0]],
          summary: description,
          score: stars,
          tags: ['github', language].filter(Boolean),
          publishedAt: new Date(),
        });
      });

      if (articles.length === 0) {
        this.logger.warn(
          'GitHub Trending returned 0 AI-relevant repos — DOM selectors may have changed (article.Box-row, h2 a, etc.)',
        );
      } else {
        this.logger.log(
          `Fetched ${articles.length} AI-relevant repos from GitHub Trending`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to fetch GitHub Trending', error);
    }

    return articles;
  }
}

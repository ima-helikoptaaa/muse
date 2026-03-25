import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  text: string;
  wordCount: number;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly MAX_CONTENT_LENGTH = 3000; // chars to send to LLM
  private readonly TIMEOUT = 10000; // 10s per page

  /**
   * Fetches and extracts the main text content from a URL.
   * Returns truncated text suitable for LLM context.
   */
  async scrapeArticle(url: string): Promise<ScrapedContent | null> {
    try {
      const { data: html } = await axios.get(url, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Muse/1.0; Content Engine)',
          Accept: 'text/html,application/xhtml+xml',
        },
        maxRedirects: 3,
        // Don't download huge files
        maxContentLength: 5 * 1024 * 1024,
      });

      if (typeof html !== 'string') return null;

      const $ = cheerio.load(html);

      // Remove noise elements
      $(
        'script, style, nav, header, footer, iframe, noscript, ' +
          '.sidebar, .comments, .advertisement, .ad, .social-share, ' +
          '.related-posts, .newsletter-signup, [role="navigation"], ' +
          '[role="banner"], [role="complementary"]',
      ).remove();

      // Try to find the main content using common selectors
      let mainText = '';

      const contentSelectors = [
        'article',
        '[role="main"]',
        'main',
        '.post-content',
        '.article-content',
        '.entry-content',
        '.blog-post',
        '.content',
        '#content',
      ];

      for (const selector of contentSelectors) {
        const el = $(selector);
        if (el.length > 0) {
          mainText = el.text();
          break;
        }
      }

      // Fallback: get body text
      if (!mainText || mainText.trim().length < 100) {
        mainText = $('body').text();
      }

      // Clean up whitespace
      const cleaned = mainText
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (cleaned.length < 50) return null;

      const truncated =
        cleaned.length > this.MAX_CONTENT_LENGTH
          ? cleaned.slice(0, this.MAX_CONTENT_LENGTH) + '...'
          : cleaned;

      return {
        text: truncated,
        wordCount: cleaned.split(/\s+/).length,
      };
    } catch (error) {
      // Silently fail — many URLs won't be scrapable (paywalls, SPAs, etc.)
      this.logger.debug(
        `Failed to scrape ${url}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return null;
    }
  }

  /**
   * Batch scrape multiple URLs with concurrency control.
   */
  async scrapeMany(
    articles: { id: string; url: string | null }[],
    concurrency = 5,
  ): Promise<Map<string, ScrapedContent>> {
    const results = new Map<string, ScrapedContent>();
    const toScrape = articles.filter((a) => a.url);

    this.logger.log(`Scraping content from ${toScrape.length} articles...`);

    // Process in batches to respect rate limits
    for (let i = 0; i < toScrape.length; i += concurrency) {
      const batch = toScrape.slice(i, i + concurrency);
      const scraped = await Promise.all(
        batch.map(async (article) => {
          const content = await this.scrapeArticle(article.url!);
          return { id: article.id, content };
        }),
      );

      for (const { id, content } of scraped) {
        if (content) results.set(id, content);
      }
    }

    this.logger.log(
      `Successfully scraped ${results.size}/${toScrape.length} articles`,
    );
    return results;
  }
}

import { Injectable, Logger } from '@nestjs/common';

interface ArticleForDedup {
  id: string;
  title: string;
  url?: string | null;
  sourceId: string;
  score?: number | null;
}

interface DeduplicatedGroup {
  primary: ArticleForDedup;
  duplicates: ArticleForDedup[];
  sources: string[];
}

@Injectable()
export class DedupService {
  private readonly logger = new Logger(DedupService.name);

  /**
   * Deduplicates articles across sources using title similarity and URL matching.
   * Returns deduplicated list, keeping the version with the highest score.
   */
  deduplicate<T extends ArticleForDedup>(articles: T[]): T[] {
    const groups = this.groupDuplicates(articles);

    this.logger.log(
      `Deduplication: ${articles.length} articles → ${groups.length} unique (removed ${articles.length - groups.length} duplicates)`,
    );

    // Return the primary article from each group (highest score)
    return groups.map((g) => {
      const primaryArticle = articles.find((a) => a.id === g.primary.id)!;
      return primaryArticle;
    });
  }

  private groupDuplicates(articles: ArticleForDedup[]): DeduplicatedGroup[] {
    const groups: DeduplicatedGroup[] = [];
    const assigned = new Set<string>();

    for (const article of articles) {
      if (assigned.has(article.id)) continue;

      const group: DeduplicatedGroup = {
        primary: article,
        duplicates: [],
        sources: [article.sourceId],
      };

      // Find duplicates of this article
      for (const other of articles) {
        if (other.id === article.id || assigned.has(other.id)) continue;

        if (this.isDuplicate(article, other)) {
          group.duplicates.push(other);
          group.sources.push(other.sourceId);
          assigned.add(other.id);

          // If the duplicate has a higher score, make it the primary
          if ((other.score || 0) > (group.primary.score || 0)) {
            group.duplicates.push(group.primary);
            group.primary = other;
          }
        }
      }

      assigned.add(article.id);
      groups.push(group);
    }

    return groups;
  }

  private isDuplicate(a: ArticleForDedup, b: ArticleForDedup): boolean {
    // Same source? Never dedup within a source (that's handled by upsert)
    if (a.sourceId === b.sourceId) return false;

    // URL match (strip protocol, www, trailing slashes)
    if (a.url && b.url && this.normalizeUrl(a.url) === this.normalizeUrl(b.url)) {
      return true;
    }

    // Title similarity
    const similarity = this.titleSimilarity(a.title, b.title);
    return similarity >= 0.75;
  }

  private normalizeUrl(url: string): string {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '')
      .replace(/\?.*$/, '');
  }

  /**
   * Token-based Jaccard similarity on titles.
   * Normalized: lowercased, stripped of punctuation, split into words.
   */
  private titleSimilarity(a: string, b: string): number {
    const tokensA = this.tokenize(a);
    const tokensB = this.tokenize(b);

    if (tokensA.size === 0 && tokensB.size === 0) return 1;
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const token of tokensA) {
      if (tokensB.has(token)) intersection++;
    }

    const union = tokensA.size + tokensB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2), // Skip short words like "a", "an", "in"
    );
  }
}

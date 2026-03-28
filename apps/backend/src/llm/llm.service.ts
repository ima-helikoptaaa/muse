import { Injectable, Inject, Logger } from '@nestjs/common';
import { LLM_PROVIDER, ILLMProvider } from './llm-provider.interface';
import {
  FILTER_SYSTEM_PROMPT,
  buildFilterUserPrompt,
  RANK_SYSTEM_PROMPT,
  buildRankUserPrompt,
} from './prompts/digest.prompt';
import {
  IDEATION_SYSTEM_PROMPT,
  buildIdeationUserPrompt,
} from './prompts/ideation.prompt';
import {
  SUMMARIZE_SYSTEM_PROMPT,
  buildSummarizeUserPrompt,
} from './prompts/summarize.prompt';

export interface RankedArticle {
  index: number;
  rawArticleId?: string;
  rank: number;
  relevanceScore: number;
  aiSummary: string;
  topicTags: string[];
  whyItMatters: string;
}

export interface GeneratedContentIdea {
  title: string;
  description: string;
  format: string;
  targetPlatform: string;
  researchSteps: string[];
  talkingPoints: string[];
  estimatedEffort: string;
  priority: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    @Inject(LLM_PROVIDER) private provider: ILLMProvider,
  ) {}

  /**
   * Pass 1: Quick filter — returns IDs of articles worth ranking.
   * Uses minimal context (title + short summary) to be fast and cheap.
   */
  async filterArticles(
    articles: { id: string; title: string; summary?: string; source: string; score?: number; publishedAge?: string }[],
  ): Promise<string[]> {
    if (articles.length === 0) return [];

    // Process in batches of 80 (filter is lightweight)
    const batchSize = 80;
    const allIds: string[] = [];

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      try {
        const ids = await this.provider.completeJSON<string[]>([
          { role: 'system', content: FILTER_SYSTEM_PROMPT },
          { role: 'user', content: buildFilterUserPrompt(batch) },
        ]);
        allIds.push(...ids);
      } catch (error) {
        this.logger.error(
          `Filter batch failed, passing ${batch.length} articles through`,
          error instanceof Error ? error.stack : error,
        );
        allIds.push(...batch.map((a) => a.id));
      }
    }

    return allIds;
  }

  /**
   * Pass 2: Deep comparative ranking with full content and personalization.
   * Sees all candidates at once so it can rank them relative to each other.
   */
  async rankArticles(
    articles: {
      id: string;
      title: string;
      summary?: string;
      content?: string;
      url?: string;
      source: string;
      crossSourceCount?: number;
      score?: number;
      publishedAge?: string;
    }[],
    personalContext?: string,
  ): Promise<RankedArticle[]> {
    if (articles.length === 0) return [];

    return this.provider.completeJSON<RankedArticle[]>(
      [
        { role: 'system', content: RANK_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildRankUserPrompt(articles, personalContext),
        },
      ],
      { model: 'gemini-3.1-pro-preview', maxTokens: 32768 },
    );
  }

  async summarizeArticle(title: string, content: string): Promise<string> {
    const result = await this.provider.complete([
      { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
      { role: 'user', content: buildSummarizeUserPrompt(title, content) },
    ]);
    return result.content;
  }

  async generateContentIdeas(
    digestItems: {
      title: string;
      aiSummary: string;
      topicTags: string[];
      whyItMatters: string;
    }[],
  ): Promise<GeneratedContentIdea[]> {
    if (digestItems.length === 0) return [];

    return this.provider.completeJSON<GeneratedContentIdea[]>([
      { role: 'system', content: IDEATION_SYSTEM_PROMPT },
      { role: 'user', content: buildIdeationUserPrompt(digestItems) },
    ]);
  }
}

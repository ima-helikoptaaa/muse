import { Injectable, Logger, Inject } from '@nestjs/common';
import { LLM_PROVIDER, ILLMProvider } from '../llm/llm-provider.interface';

export interface DetectedTrend {
  theme: string;
  description: string;
  articleCount: number;
  articleIds: string[];
  significance: string;
}

@Injectable()
export class TrendService {
  private readonly logger = new Logger(TrendService.name);

  constructor(
    @Inject(LLM_PROVIDER) private llmProvider: ILLMProvider,
  ) {}

  /**
   * Uses LLM to detect emerging themes across a set of articles.
   * Groups related articles and identifies trends worth highlighting.
   */
  async detectTrends(
    articles: {
      id: string;
      title: string;
      summary?: string;
      topicTags?: string[];
    }[],
  ): Promise<DetectedTrend[]> {
    if (articles.length === 0) return [];

    const articleList = articles
      .map(
        (a, i) =>
          `${i + 1}. "${a.title}"${a.summary ? ` — ${a.summary.slice(0, 150)}` : ''}${a.topicTags?.length ? ` [${a.topicTags.join(', ')}]` : ''}\n   ID: ${a.id}`,
      )
      .join('\n');

    try {
      const trends = await this.llmProvider.completeJSON<DetectedTrend[]>([
        {
          role: 'system',
          content: `You are a trend analyst for AI/ML developments. Given a list of articles, identify two types of signals:

1. **Standalone Breakthroughs** — A single article that represents a genuinely novel contribution: new architecture, new SOTA result, new paradigm, new open-source release with real substance. These do NOT need 2+ articles — one groundbreaking item is enough. Mark these with articleCount: 1.

2. **Emerging Trends** — Themes that appear across 2+ articles suggesting a broader shift or convergence. E.g., "move toward smaller models", "agent frameworks consolidating", "new attention mechanisms".

Prioritize breakthroughs and novelty over popularity. A single paper introducing a new quantization method or a new memory architecture is more significant than 5 articles about the same product launch.

Return a JSON array combining both types.`,
        },
        {
          role: 'user',
          content: `Analyze these ${articles.length} articles for emerging trends and themes:

${articleList}

Return a JSON array with objects: { "theme": string (short title), "description": string (2-3 sentences), "articleCount": number, "articleIds": string[] (IDs of related articles), "significance": string (why this matters) }

Include standalone breakthroughs (articleCount: 1) AND multi-article trends (articleCount: 2+). Respond with a JSON array wrapped in \`\`\`json code fence.`,
        },
      ]);

      this.logger.log(`Detected ${trends.length} trends`);
      return trends;
    } catch (error) {
      this.logger.error('Trend detection failed', error);
      return [];
    }
  }
}

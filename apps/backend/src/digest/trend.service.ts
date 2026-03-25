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
    if (articles.length < 5) return [];

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
          content: `You are a trend analyst for AI/ML developments. Given a list of articles, identify emerging themes — topics that appear across multiple articles suggesting a trend or significant development.

Only report trends backed by 2+ articles. Focus on:
- New capabilities or breakthroughs appearing from multiple sources
- Shifts in the field (e.g., "move toward smaller models", "agent frameworks consolidating")
- Hot topics getting unusual attention

Return a JSON array of trends.`,
        },
        {
          role: 'user',
          content: `Analyze these ${articles.length} articles for emerging trends and themes:

${articleList}

Return a JSON array with objects: { "theme": string (short title), "description": string (2-3 sentences about the trend), "articleCount": number, "articleIds": string[] (IDs of related articles), "significance": string (why this trend matters) }

Only include trends with 2+ related articles. Respond with a JSON array wrapped in \`\`\`json code fence.`,
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

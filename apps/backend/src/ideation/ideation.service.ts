import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { ContentFormat, Platform } from '@prisma/client';

@Injectable()
export class IdeationService {
  private readonly logger = new Logger(IdeationService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
  ) {}

  async generateIdeas(digestId: string) {
    const digest = await this.prisma.digest.findUnique({
      where: { id: digestId },
      include: {
        items: {
          include: { rawArticle: true },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!digest) throw new Error(`Digest not found: ${digestId}`);

    const digestItems = digest.items.map((item) => ({
      title: item.rawArticle.title,
      aiSummary: item.aiSummary,
      topicTags: item.topicTags,
      whyItMatters: item.whyItMatters || '',
    }));

    this.logger.log(
      `Generating content ideas from ${digestItems.length} digest items...`,
    );

    const ideas = await this.llmService.generateContentIdeas(digestItems);

    const created = await Promise.all(
      ideas.map((idea) =>
        this.prisma.contentIdea.create({
          data: {
            digestId,
            title: idea.title,
            description: idea.description,
            format: idea.format as ContentFormat,
            targetPlatform: idea.targetPlatform as Platform,
            researchSteps: idea.researchSteps,
            talkingPoints: idea.talkingPoints,
            estimatedEffort: idea.estimatedEffort,
            priority: idea.priority,
          },
        }),
      ),
    );

    this.logger.log(
      `Generated ${created.length} content ideas for digest ${digestId}`,
    );
    return created;
  }

  async listIdeas(options?: {
    format?: ContentFormat;
    platform?: Platform;
    digestId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const where = {
      ...(options?.format && { format: options.format }),
      ...(options?.platform && { targetPlatform: options.platform }),
      ...(options?.digestId && { digestId: options.digestId }),
    };

    const [ideas, total] = await Promise.all([
      this.prisma.contentIdea.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'desc' },
        include: { digest: true, contentPiece: true },
      }),
      this.prisma.contentIdea.count({ where }),
    ]);

    return { ideas, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getIdea(id: string) {
    return this.prisma.contentIdea.findUnique({
      where: { id },
      include: {
        digest: { include: { items: { include: { rawArticle: true } } } },
        contentPiece: true,
      },
    });
  }
}

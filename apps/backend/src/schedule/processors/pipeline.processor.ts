import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SourcesService } from '../../sources/sources.service';
import { DigestService } from '../../digest/digest.service';
import { IdeationService } from '../../ideation/ideation.service';

@Processor('muse-pipeline')
export class PipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(PipelineProcessor.name);

  constructor(
    private prisma: PrismaService,
    private sourcesService: SourcesService,
    private digestService: DigestService,
    private ideationService: IdeationService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job: ${job.name} (${job.id})`);

    const run = await this.prisma.pipelineRun.create({
      data: { type: job.name, status: 'running' },
    });

    try {
      let result: any;

      switch (job.name) {
        case 'discovery':
          result = await this.handleDiscovery();
          break;
        case 'digest':
          result = await this.handleDigest(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }

      await this.prisma.pipelineRun.update({
        where: { id: run.id },
        data: { status: 'completed', completedAt: new Date(), result },
      });

      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      await this.prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: errorMsg,
        },
      });
      throw error;
    }
  }

  private async handleDiscovery() {
    this.logger.log('Running discovery pipeline...');
    const result = await this.sourcesService.fetchAll();
    this.logger.log(
      `Discovery complete: ${result.totalArticles} articles fetched`,
    );
    return result;
  }

  private async handleDigest(data: any) {
    this.logger.log('Running digest pipeline...');

    const dateFrom = data?.dateFrom ? new Date(data.dateFrom) : undefined;
    const dateTo = data?.dateTo ? new Date(data.dateTo) : undefined;

    const digest = await this.digestService.createDigest(dateFrom, dateTo);
    if (!digest) return { message: 'No articles to digest' };

    // Auto-generate ideas from the digest
    const ideas = await this.ideationService.generateIdeas(digest.id);

    this.logger.log(
      `Digest pipeline complete: ${digest.items.length} items, ${ideas.length} ideas`,
    );
    return {
      digestId: digest.id,
      items: digest.items.length,
      ideas: ideas.length,
    };
  }
}

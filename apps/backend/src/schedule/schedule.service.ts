import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectQueue('muse-pipeline') private pipelineQueue: Queue,
  ) {}

  // Daily at 7 AM: Create digest + ideas
  @Cron('0 7 * * *')
  async scheduledDigest() {
    this.logger.log('Triggering scheduled digest...');
    await this.pipelineQueue.add('digest', {}, { jobId: `digest-${Date.now()}` });
  }

  // Manual triggers — discovery is called from local machine via launchd
  async triggerDiscovery() {
    const job = await this.pipelineQueue.add('discovery', { manual: true });
    return { jobId: job.id, type: 'discovery' };
  }

  async triggerDigest(dateFrom?: string, dateTo?: string) {
    const job = await this.pipelineQueue.add('digest', {
      manual: true,
      dateFrom,
      dateTo,
    });
    return { jobId: job.id, type: 'digest' };
  }
}

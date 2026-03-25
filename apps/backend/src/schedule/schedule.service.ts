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

  // Daily at 6 AM: Discover new content
  @Cron('0 6 * * *')
  async scheduledDiscovery() {
    this.logger.log('Triggering scheduled discovery...');
    await this.pipelineQueue.add('discovery', {}, { jobId: `discovery-${Date.now()}` });
  }

  // Daily at 7 AM: Create digest + ideas
  @Cron('0 7 * * *')
  async scheduledDigest() {
    this.logger.log('Triggering scheduled digest...');
    await this.pipelineQueue.add('digest', {}, { jobId: `digest-${Date.now()}` });
  }

  // Hourly: Process reminders
  @Cron('0 * * * *')
  async scheduledReminders() {
    await this.pipelineQueue.add('reminder-check', {}, { jobId: `reminder-${Date.now()}` });
  }

  // 9 AM and 5 PM on weekdays: Brand reminders
  @Cron('0 9,17 * * 1-5')
  async scheduledBrandReminders() {
    this.logger.log('Triggering brand reminder...');
    await this.pipelineQueue.add('brand-reminder', {}, { jobId: `brand-${Date.now()}` });
  }

  // Manual trigger methods
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

  async triggerBrandReminder() {
    const job = await this.pipelineQueue.add('brand-reminder', {
      manual: true,
    });
    return { jobId: job.id, type: 'brand-reminder' };
  }
}

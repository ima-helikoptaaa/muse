import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderType, ReminderStatus, Platform } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async createReminder(data: {
    type: ReminderType;
    title: string;
    message: string;
    platform?: Platform;
    scheduledAt: Date;
    metadata?: any;
  }) {
    return this.prisma.reminder.create({ data });
  }

  async getDueReminders() {
    return this.prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async markReminderSent(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });
  }

  async dismissReminder(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { status: 'DISMISSED' },
    });
  }

  async actOnReminder(id: string) {
    return this.prisma.reminder.update({
      where: { id },
      data: { status: 'ACTED' },
    });
  }

  async listReminders(options?: {
    status?: ReminderStatus;
    type?: ReminderType;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const where = {
      ...(options?.status && { status: options.status }),
      ...(options?.type && { type: options.type }),
    };

    const [reminders, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return { reminders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createBrandReminders() {
    const memeReminder = await this.createReminder({
      type: 'BRAND_MEME',
      title: 'Time to post a meme!',
      message:
        'Post a relevant AI meme on X/Twitter to keep your audience engaged. Memes about LLMs, prompt engineering fails, or AI hype cycles tend to perform well.',
      platform: 'TWITTER',
      scheduledAt: new Date(),
      metadata: {
        suggestions: [
          'LLM hallucination jokes',
          'AI vs human developer memes',
          'Prompt engineering struggles',
          'Fine-tuning gone wrong',
        ],
      },
    });

    this.logger.log('Created brand reminder: meme posting');
    return [memeReminder];
  }

  async processReminders() {
    const due = await this.getDueReminders();

    for (const reminder of due) {
      // For now, just mark as sent (in-app notification)
      // Future: send email, push notification, etc.
      await this.markReminderSent(reminder.id);
      this.logger.log(`Reminder sent: ${reminder.title}`);
    }

    return { processed: due.length };
  }
}

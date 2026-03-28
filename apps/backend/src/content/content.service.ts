import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus, ContentFormat, Platform } from '@prisma/client';
import { VALID_STATUS_TRANSITIONS } from '@muse/shared';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(private prisma: PrismaService) {}

  async promoteIdea(ideaId: string) {
    const idea = await this.prisma.contentIdea.findUnique({
      where: { id: ideaId },
      include: { contentPiece: true },
    });

    if (!idea) throw new NotFoundException('Idea not found');
    if (idea.contentPiece) throw new BadRequestException('Idea already promoted');

    return this.prisma.contentPiece.create({
      data: {
        ideaId,
        title: idea.title,
        format: idea.format,
        targetPlatform: idea.targetPlatform,
        status: 'IDEA',
        notes: idea.description,
      },
    });
  }

  async createContent(data: {
    title: string;
    format: ContentFormat;
    targetPlatform: Platform;
    body?: string;
    notes?: string;
  }) {
    return this.prisma.contentPiece.create({
      data: { ...data, status: 'IDEA' },
    });
  }

  async updateStatus(id: string, newStatus: ContentStatus) {
    const piece = await this.prisma.contentPiece.findUnique({
      where: { id },
    });
    if (!piece) throw new NotFoundException('Content piece not found');

    const currentStatus = piece.status as keyof typeof VALID_STATUS_TRANSITIONS;
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowed?.includes(newStatus as any)) {
      throw new BadRequestException(
        `Cannot transition from ${piece.status} to ${newStatus}`,
      );
    }

    return this.prisma.contentPiece.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newStatus === 'POSTED' ? { postedAt: new Date() } : {}),
      },
    });
  }

  async updateContent(
    id: string,
    data: { title?: string; body?: string; notes?: string },
  ) {
    return this.prisma.contentPiece.update({ where: { id }, data });
  }

  async scheduleContent(
    id: string,
    scheduledDate: Date,
    scheduledTime?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const piece = await tx.contentPiece.findUnique({
        where: { id },
      });
      if (!piece) throw new NotFoundException('Content piece not found');

      await tx.contentPiece.update({
        where: { id },
        data: { scheduledFor: scheduledDate },
      });

      return tx.contentCalendar.upsert({
        where: { contentPieceId: id },
        update: { scheduledDate, scheduledTime, platform: piece.targetPlatform },
        create: {
          contentPieceId: id,
          scheduledDate,
          scheduledTime,
          platform: piece.targetPlatform,
        },
      });
    });
  }

  async setPostedUrl(id: string, postedUrl: string) {
    return this.prisma.contentPiece.update({
      where: { id },
      data: { postedUrl },
    });
  }

  async listContent(options?: {
    status?: ContentStatus;
    platform?: Platform;
    format?: ContentFormat;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const where = {
      ...(options?.status && { status: options.status }),
      ...(options?.platform && { targetPlatform: options.platform }),
      ...(options?.format && { format: options.format }),
    };

    const [pieces, total] = await Promise.all([
      this.prisma.contentPiece.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { idea: true, calendarEntry: true, metrics: true },
      }),
      this.prisma.contentPiece.count({ where }),
    ]);

    return { pieces, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getContent(id: string) {
    return this.prisma.contentPiece.findUnique({
      where: { id },
      include: {
        idea: { include: { digest: true } },
        calendarEntry: true,
        metrics: { orderBy: { metricDate: 'desc' } },
      },
    });
  }

  async getCalendar(from: Date, to: Date) {
    return this.prisma.contentCalendar.findMany({
      where: {
        scheduledDate: { gte: from, lte: to },
      },
      include: { contentPiece: true },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async getKanban() {
    const statuses: ContentStatus[] = [
      'IDEA',
      'RESEARCHING',
      'CREATING',
      'READY',
      'POSTED',
    ];

    const columns = await Promise.all(
      statuses.map(async (status) => ({
        status,
        pieces: await this.prisma.contentPiece.findMany({
          where: { status },
          orderBy: { updatedAt: 'desc' },
          include: { calendarEntry: true },
        }),
      })),
    );

    return columns;
  }
}

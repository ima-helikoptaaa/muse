import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Platform } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackMetric(data: {
    contentPieceId: string;
    platform: Platform;
    metricDate: Date;
    impressions?: number;
    clicks?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    followers?: number;
    engagementRate?: number;
    rawData?: any;
  }) {
    return this.prisma.platformMetric.upsert({
      where: {
        contentPieceId_platform_metricDate: {
          contentPieceId: data.contentPieceId,
          platform: data.platform,
          metricDate: data.metricDate,
        },
      },
      update: {
        impressions: data.impressions,
        clicks: data.clicks,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        followers: data.followers,
        engagementRate: data.engagementRate,
        rawData: data.rawData,
      },
      create: data,
    });
  }

  async getContentMetrics(contentPieceId: string) {
    return this.prisma.platformMetric.findMany({
      where: { contentPieceId },
      orderBy: { metricDate: 'desc' },
    });
  }

  async getDashboardStats(from: Date, to: Date) {
    const metrics = await this.prisma.platformMetric.findMany({
      where: { metricDate: { gte: from, lte: to } },
    });

    const byPlatform: Record<string, any> = {};

    for (const m of metrics) {
      if (!byPlatform[m.platform]) {
        byPlatform[m.platform] = {
          impressions: 0,
          clicks: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        };
      }
      byPlatform[m.platform].impressions += m.impressions;
      byPlatform[m.platform].clicks += m.clicks;
      byPlatform[m.platform].likes += m.likes;
      byPlatform[m.platform].comments += m.comments;
      byPlatform[m.platform].shares += m.shares;
    }

    const contentCount = await this.prisma.contentPiece.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return { byPlatform, contentCount, totalMetrics: metrics.length };
  }

  async getTopContent(platform?: Platform, limit = 10) {
    return this.prisma.platformMetric.findMany({
      where: platform ? { platform } : {},
      orderBy: { likes: 'desc' },
      take: limit,
      include: { contentPiece: true },
    });
  }
}

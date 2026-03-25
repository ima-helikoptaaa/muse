import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Platform } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  trackMetric(
    @Body()
    body: {
      contentPieceId?: string;
      platform: Platform;
      metricDate: string;
      impressions?: number;
      clicks?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      followers?: number;
      engagementRate?: number;
    },
  ) {
    return this.analyticsService.trackMetric({
      ...body,
      metricDate: new Date(body.metricDate),
    });
  }

  @Get('dashboard')
  getDashboardStats(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.analyticsService.getDashboardStats(
      new Date(from),
      new Date(to),
    );
  }

  @Get('content/:id')
  getContentMetrics(@Param('id') id: string) {
    return this.analyticsService.getContentMetrics(id);
  }

  @Get('top')
  getTopContent(
    @Query('platform') platform?: Platform,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTopContent(
      platform,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}

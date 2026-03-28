import { Controller, Get, Post, Param, Query, Body, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Platform } from '@prisma/client';
import { TrackMetricDto } from './dto/track-metric.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  trackMetric(@Body() body: TrackMetricDto) {
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
    if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
      throw new BadRequestException('Valid "from" and "to" date params required');
    }
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

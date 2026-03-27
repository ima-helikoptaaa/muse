import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('schedule')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('trigger/discovery')
  triggerDiscovery() {
    return this.scheduleService.triggerDiscovery();
  }

  @Post('trigger/digest')
  triggerDigest(
    @Body('dateFrom') dateFrom?: string,
    @Body('dateTo') dateTo?: string,
  ) {
    return this.scheduleService.triggerDigest(dateFrom, dateTo);
  }

  @Get('runs')
  getPipelineRuns(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.prisma.pipelineRun.findMany({
      where: type ? { type } : {},
      orderBy: { startedAt: 'desc' },
      take: limit ? parseInt(limit, 10) : 20,
    });
  }
}

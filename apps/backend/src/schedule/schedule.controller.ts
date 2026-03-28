import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerDigestDto } from './dto/trigger-digest.dto';

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
  triggerDigest(@Body() body: TriggerDigestDto) {
    return this.scheduleService.triggerDigest(body.dateFrom, body.dateTo);
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

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentStatus, ContentFormat, Platform } from '@prisma/client';
import {
  CreateContentDto,
  UpdateContentDto,
  ScheduleContentDto,
} from './dto/create-content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  listContent(
    @Query('status') status?: ContentStatus,
    @Query('platform') platform?: Platform,
    @Query('format') format?: ContentFormat,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentService.listContent({
      status,
      platform,
      format,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('kanban')
  getKanban() {
    return this.contentService.getKanban();
  }

  @Get('calendar')
  getCalendar(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to || isNaN(Date.parse(from)) || isNaN(Date.parse(to))) {
      throw new BadRequestException('Valid "from" and "to" date params required');
    }
    return this.contentService.getCalendar(new Date(from), new Date(to));
  }

  @Get(':id')
  getContent(@Param('id') id: string) {
    return this.contentService.getContent(id);
  }

  @Post()
  createContent(@Body() body: CreateContentDto) {
    return this.contentService.createContent(body);
  }

  @Post('promote/:ideaId')
  promoteIdea(@Param('ideaId') ideaId: string) {
    return this.contentService.promoteIdea(ideaId);
  }

  @Patch(':id')
  updateContent(@Param('id') id: string, @Body() body: UpdateContentDto) {
    return this.contentService.updateContent(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ContentStatus,
  ) {
    return this.contentService.updateStatus(id, status);
  }

  @Patch(':id/schedule')
  scheduleContent(@Param('id') id: string, @Body() body: ScheduleContentDto) {
    if (isNaN(Date.parse(body.scheduledDate))) {
      throw new BadRequestException('Invalid scheduledDate');
    }
    return this.contentService.scheduleContent(
      id,
      new Date(body.scheduledDate),
      body.scheduledTime,
    );
  }

  @Patch(':id/posted-url')
  setPostedUrl(
    @Param('id') id: string,
    @Body('postedUrl') postedUrl: string,
  ) {
    return this.contentService.setPostedUrl(id, postedUrl);
  }
}

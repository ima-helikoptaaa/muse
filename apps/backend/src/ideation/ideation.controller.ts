import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { IdeationService } from './ideation.service';
import { ContentFormat, Platform } from '@prisma/client';

@Controller('ideas')
export class IdeationController {
  constructor(private readonly ideationService: IdeationService) {}

  @Get()
  listIdeas(
    @Query('format') format?: ContentFormat,
    @Query('platform') platform?: Platform,
    @Query('digestId') digestId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ideationService.listIdeas({
      format,
      platform,
      digestId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  getIdea(@Param('id') id: string) {
    return this.ideationService.getIdea(id);
  }

  @Post('generate')
  generateIdeas(@Body('digestId') digestId: string) {
    return this.ideationService.generateIdeas(digestId);
  }
}

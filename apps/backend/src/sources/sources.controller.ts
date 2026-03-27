import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourceType } from '@prisma/client';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  listSources() {
    return this.sourcesService.listSources();
  }

  @Post()
  createSource(
    @Body()
    body: {
      name: string;
      type: SourceType;
      url: string;
      fetchConfig?: any;
    },
  ) {
    return this.sourcesService.createSource(body);
  }

  @Patch(':id/toggle')
  toggleSource(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.sourcesService.toggleSource(id, enabled);
  }

  @Post('fetch')
  fetchAll() {
    return this.sourcesService.fetchAll();
  }

  @Post('fetch/:type')
  fetchByType(@Param('type') type: SourceType) {
    return this.sourcesService.fetchByType(type);
  }

  @Post('articles/ingest')
  ingestArticles(
    @Body() body: { sourceType: SourceType; articles: any[] },
  ) {
    return this.sourcesService.ingestArticles(body.sourceType, body.articles);
  }

  @Get('articles')
  getArticles(
    @Query('sourceType') sourceType?: SourceType,
    @Query('since') since?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sourcesService.getArticles({
      sourceType,
      since: since ? new Date(since) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}

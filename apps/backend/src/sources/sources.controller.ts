import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  ParseEnumPipe,
  BadRequestException,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourceType } from '@prisma/client';
import { IngestArticlesDto } from './dto/ingest-articles.dto';
import { CreateSourceDto } from './dto/create-source.dto';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  listSources() {
    return this.sourcesService.listSources();
  }

  @Post()
  createSource(@Body() body: CreateSourceDto) {
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
  fetchByType(
    @Param('type', new ParseEnumPipe(SourceType)) type: SourceType,
  ) {
    return this.sourcesService.fetchByType(type);
  }

  @Post('articles/ingest')
  ingestArticles(@Body() body: IngestArticlesDto) {
    return this.sourcesService.ingestArticles(body.sourceType, body.articles);
  }

  @Get('articles')
  getArticles(
    @Query('sourceType') sourceType?: SourceType,
    @Query('since') since?: string,
    @Query('limit') limit?: string,
  ) {
    if (since && isNaN(Date.parse(since))) {
      throw new BadRequestException('Invalid date format for "since"');
    }
    return this.sourcesService.getArticles({
      sourceType,
      since: since ? new Date(since) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}

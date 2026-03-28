import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { DigestService } from './digest.service';
import { GenerateDigestDto } from './dto/generate-digest.dto';

@Controller('digests')
export class DigestController {
  constructor(private readonly digestService: DigestService) {}

  @Get()
  listDigests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.digestService.listDigests(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  getDigest(@Param('id') id: string) {
    return this.digestService.getDigest(id);
  }

  @Post('generate')
  generateDigest(@Body() body: GenerateDigestDto) {
    return this.digestService.createDigest(
      body.dateFrom ? new Date(body.dateFrom) : undefined,
      body.dateTo ? new Date(body.dateTo) : undefined,
    );
  }
}

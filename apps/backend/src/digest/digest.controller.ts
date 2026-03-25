import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { DigestService } from './digest.service';

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
  generateDigest(
    @Body('dateFrom') dateFrom?: string,
    @Body('dateTo') dateTo?: string,
  ) {
    return this.digestService.createDigest(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }
}

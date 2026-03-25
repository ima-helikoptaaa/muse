import { Module } from '@nestjs/common';
import { DigestService } from './digest.service';
import { DigestController } from './digest.controller';
import { DedupService } from './dedup.service';
import { ScraperService } from './scraper.service';
import { TrendService } from './trend.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [DigestController],
  providers: [DigestService, DedupService, ScraperService, TrendService],
  exports: [DigestService],
})
export class DigestModule {}

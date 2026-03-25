import { Module } from '@nestjs/common';
import { IdeationService } from './ideation.service';
import { IdeationController } from './ideation.controller';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [IdeationController],
  providers: [IdeationService],
  exports: [IdeationService],
})
export class IdeationModule {}

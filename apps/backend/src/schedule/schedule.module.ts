import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { PipelineProcessor } from './processors/pipeline.processor';
import { SourcesModule } from '../sources/sources.module';
import { DigestModule } from '../digest/digest.module';
import { IdeationModule } from '../ideation/ideation.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'muse-pipeline' }),
    SourcesModule,
    DigestModule,
    IdeationModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, PipelineProcessor],
})
export class ScheduleConfigModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { LlmModule } from './llm/llm.module';
import { SourcesModule } from './sources/sources.module';
import { DigestModule } from './digest/digest.module';
import { IdeationModule } from './ideation/ideation.module';
import { ContentModule } from './content/content.module';
import { ScheduleConfigModule } from './schedule/schedule.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    PrismaModule,
    LlmModule,
    SourcesModule,
    DigestModule,
    IdeationModule,
    ContentModule,
    ScheduleConfigModule,
    AnalyticsModule,
    NotificationsModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { LlmModule } from './llm/llm.module';
import { SourcesModule } from './sources/sources.module';
import { DigestModule } from './digest/digest.module';
import { IdeationModule } from './ideation/ideation.module';
import { ContentModule } from './content/content.module';
import { ScheduleConfigModule } from './schedule/schedule.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ApiKeyGuard } from './common/guards';
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
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 60 },
    ]),
    PrismaModule,
    LlmModule,
    SourcesModule,
    DigestModule,
    IdeationModule,
    ContentModule,
    ScheduleConfigModule,
    AnalyticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

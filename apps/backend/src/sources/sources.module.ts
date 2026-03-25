import { Module } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourcesController } from './sources.controller';
import {
  ArxivFetcher,
  HackerNewsFetcher,
  RedditFetcher,
  GitHubTrendingFetcher,
  HuggingFaceFetcher,
  TechBlogsFetcher,
  ProductHuntFetcher,
  TwitterFetcher,
} from './fetchers';

@Module({
  controllers: [SourcesController],
  providers: [
    SourcesService,
    ArxivFetcher,
    HackerNewsFetcher,
    RedditFetcher,
    GitHubTrendingFetcher,
    HuggingFaceFetcher,
    TechBlogsFetcher,
    ProductHuntFetcher,
    TwitterFetcher,
  ],
  exports: [SourcesService],
})
export class SourcesModule {}

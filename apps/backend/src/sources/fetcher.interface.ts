import { Source } from '@prisma/client';
import { FetchedArticle } from '@muse/shared';

export interface ISourceFetcher {
  readonly sourceType: string;
  fetch(source: Source): Promise<FetchedArticle[]>;
}

export const SOURCE_FETCHERS = 'SOURCE_FETCHERS';

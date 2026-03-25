export enum SourceType {
  ARXIV = 'ARXIV',
  HACKER_NEWS = 'HACKER_NEWS',
  REDDIT = 'REDDIT',
  GITHUB_TRENDING = 'GITHUB_TRENDING',
  HUGGINGFACE = 'HUGGINGFACE',
  TECH_BLOG = 'TECH_BLOG',
  PRODUCT_HUNT = 'PRODUCT_HUNT',
  TWITTER = 'TWITTER',
}

export interface FetchedArticle {
  externalId: string;
  title: string;
  url?: string;
  authors: string[];
  summary?: string;
  content?: string;
  score?: number;
  tags: string[];
  publishedAt?: Date;
}

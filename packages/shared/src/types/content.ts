export enum ContentStatus {
  IDEA = 'IDEA',
  RESEARCHING = 'RESEARCHING',
  CREATING = 'CREATING',
  READY = 'READY',
  POSTED = 'POSTED',
  ARCHIVED = 'ARCHIVED',
}

export enum ContentFormat {
  BLOG_POST = 'BLOG_POST',
  YOUTUBE_VIDEO = 'YOUTUBE_VIDEO',
  LINKEDIN_POST = 'LINKEDIN_POST',
  TWITTER_POST = 'TWITTER_POST',
  MEME = 'MEME',
}

export const VALID_STATUS_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  [ContentStatus.IDEA]: [ContentStatus.RESEARCHING, ContentStatus.ARCHIVED],
  [ContentStatus.RESEARCHING]: [ContentStatus.CREATING, ContentStatus.ARCHIVED],
  [ContentStatus.CREATING]: [ContentStatus.READY, ContentStatus.ARCHIVED],
  [ContentStatus.READY]: [ContentStatus.POSTED, ContentStatus.ARCHIVED],
  [ContentStatus.POSTED]: [ContentStatus.ARCHIVED],
  [ContentStatus.ARCHIVED]: [],
};

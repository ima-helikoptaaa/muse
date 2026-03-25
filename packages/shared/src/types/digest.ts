export interface DigestItemData {
  rawArticleId: string;
  rank: number;
  relevanceScore: number;
  aiSummary: string;
  topicTags: string[];
  whyItMatters: string;
}

export interface DigestData {
  title: string;
  summary: string;
  items: DigestItemData[];
}

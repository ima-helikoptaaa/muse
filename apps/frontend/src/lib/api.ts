import axios from 'axios';
import type {
  SourceType,
  ContentStatus,
  ContentFormat,
  Platform,
} from '@muse/shared';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    ...(process.env.NEXT_PUBLIC_API_KEY
      ? { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY }
      : {}),
  },
  timeout: 30000,
});

// ── Response types ──────────────────────────────────────

export interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
  lastFetched: string | null;
  fetchConfig: Record<string, unknown> | null;
}

export interface RawArticle {
  id: string;
  title: string;
  url: string | null;
  authors: string[];
  summary: string | null;
  score: number | null;
  tags: string[];
  fetchedAt: string;
  source: Source;
}

export interface DigestSummary {
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  _count?: { items: number; contentIdeas: number };
}

export interface Digest extends DigestSummary {
  dateFrom: string;
  dateTo: string;
  items: DigestItem[];
  contentIdeas: ContentIdea[];
}

export interface DigestItem {
  id: string;
  rank: number;
  relevanceScore: number;
  aiSummary: string;
  topicTags: string[];
  whyItMatters: string;
  rawArticle: RawArticle;
}

export interface SourceAttribution {
  title: string;
  source: string;
  url: string;
  relevance: string;
}

export interface ContentCascade {
  article?: { headline: string; body: string };
  youtubeScript?: {
    hook: string;
    sections: { title: string; talkingPoints: string[]; visualNotes: string }[];
    cta: string;
    estimatedLength: string;
  };
  linkedinPost?: { body: string };
  twitterThread?: { tweets: string[] };
  instagramCarousel?: {
    slides: { text: string; visualDescription: string }[];
    caption: string;
    styleNotes: string;
  };
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  angle?: string | null;
  format: string;
  targetPlatform: string;
  researchSteps: string[];
  talkingPoints: string[];
  estimatedEffort: string;
  priority: number;
  cascade?: ContentCascade | null;
  sourceArticles?: SourceAttribution[] | null;
  contentPiece?: ContentPiece | null;
}

export interface ContentPiece {
  id: string;
  title: string;
  body: string | null;
  notes: string | null;
  format: string;
  targetPlatform: string;
  status: string;
  scheduledFor: string | null;
  postedAt: string | null;
  postedUrl: string | null;
  createdAt: string;
  updatedAt: string;
  idea?: ContentIdea | null;
  calendarEntry?: CalendarEntry | null;
  metrics?: PlatformMetric[];
}

export interface CalendarEntry {
  id: string;
  contentPieceId: string;
  scheduledDate: string;
  scheduledTime: string | null;
  platform: string;
  contentPiece?: ContentPiece;
}

export interface PlatformMetric {
  id: string;
  contentPieceId: string;
  platform: string;
  metricDate: string;
  impressions: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  contentPiece?: ContentPiece;
}

export interface KanbanColumn {
  status: string;
  pieces: ContentPiece[];
}

export interface PipelineRun {
  id: string;
  type: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  result: Record<string, unknown> | null;
}

export interface Paginated<T> {
  total: number;
  page: number;
  totalPages: number;
  [key: string]: T[] | number;
}

// ── API functions ───────────────────────────────────────

// Sources
export const getSources = (): Promise<Source[]> =>
  api.get('/sources').then((r) => r.data);
export const fetchAllSources = () =>
  api.post('/sources/fetch').then((r) => r.data);
export const getArticles = (params?: Record<string, string>): Promise<{ articles: RawArticle[]; total: number; page: number; totalPages: number }> =>
  api.get('/sources/articles', { params }).then((r) => r.data);

// Digests
export const getDigests = (page = 1): Promise<{ digests: DigestSummary[]; total: number; page: number; totalPages: number }> =>
  api.get('/digests', { params: { page } }).then((r) => r.data);
export const getDigest = (id: string): Promise<Digest> =>
  api.get(`/digests/${id}`).then((r) => r.data);
export const generateDigest = (dateFrom?: string, dateTo?: string) =>
  api.post('/digests/generate', { dateFrom, dateTo }).then((r) => r.data);

// Ideas
export const getIdeas = (params?: Record<string, string>): Promise<{ ideas: ContentIdea[]; total: number; page: number; totalPages: number }> =>
  api.get('/ideas', { params }).then((r) => r.data);
export const getIdea = (id: string): Promise<ContentIdea> =>
  api.get(`/ideas/${id}`).then((r) => r.data);
export const generateIdeas = (digestId: string) =>
  api.post('/ideas/generate', { digestId }).then((r) => r.data);

// Content
export const getContentList = (params?: Record<string, string>) =>
  api.get('/content', { params }).then((r) => r.data);
export const getKanban = (): Promise<KanbanColumn[]> =>
  api.get('/content/kanban').then((r) => r.data);
export const getContent = (id: string): Promise<ContentPiece> =>
  api.get(`/content/${id}`).then((r) => r.data);
export const createContent = (data: { title: string; format: string; targetPlatform: string; body?: string; notes?: string }) =>
  api.post('/content', data).then((r) => r.data);
export const promoteIdea = (ideaId: string) =>
  api.post(`/content/promote/${ideaId}`).then((r) => r.data);
export const updateContent = (id: string, data: { title?: string; body?: string; notes?: string }) =>
  api.patch(`/content/${id}`, data).then((r) => r.data);
export const updateContentStatus = (id: string, status: string) =>
  api.patch(`/content/${id}/status`, { status }).then((r) => r.data);
export const scheduleContent = (id: string, scheduledDate: string, scheduledTime?: string) =>
  api.patch(`/content/${id}/schedule`, { scheduledDate, scheduledTime }).then((r) => r.data);
export const getCalendar = (from: string, to: string): Promise<CalendarEntry[]> =>
  api.get('/content/calendar', { params: { from, to } }).then((r) => r.data);

// Analytics
export const getDashboardStats = (from: string, to: string) =>
  api.get('/analytics/dashboard', { params: { from, to } }).then((r) => r.data);
export const trackMetric = (data: { contentPieceId: string; platform: string; metricDate: string; [key: string]: unknown }) =>
  api.post('/analytics/track', data).then((r) => r.data);
export const getTopContent = (platform?: string): Promise<PlatformMetric[]> =>
  api.get('/analytics/top', { params: { platform } }).then((r) => r.data);

// Schedule
export const triggerDiscovery = () =>
  api.post('/schedule/trigger/discovery').then((r) => r.data);
export const triggerDigest = () =>
  api.post('/schedule/trigger/digest').then((r) => r.data);
export const getPipelineRuns = (limit = 20): Promise<PipelineRun[]> =>
  api.get('/schedule/runs', { params: { limit } }).then((r) => r.data);

export default api;

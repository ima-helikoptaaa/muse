import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Sources
export const getSources = () => api.get('/sources').then((r) => r.data);
export const fetchAllSources = () => api.post('/sources/fetch').then((r) => r.data);
export const getArticles = (params?: Record<string, string>) =>
  api.get('/sources/articles', { params }).then((r) => r.data);

// Digests
export const getDigests = (page = 1) =>
  api.get('/digests', { params: { page } }).then((r) => r.data);
export const getDigest = (id: string) =>
  api.get(`/digests/${id}`).then((r) => r.data);
export const generateDigest = (dateFrom?: string, dateTo?: string) =>
  api.post('/digests/generate', { dateFrom, dateTo }).then((r) => r.data);

// Ideas
export const getIdeas = (params?: Record<string, string>) =>
  api.get('/ideas', { params }).then((r) => r.data);
export const getIdea = (id: string) =>
  api.get(`/ideas/${id}`).then((r) => r.data);
export const generateIdeas = (digestId: string) =>
  api.post('/ideas/generate', { digestId }).then((r) => r.data);

// Content
export const getContentList = (params?: Record<string, string>) =>
  api.get('/content', { params }).then((r) => r.data);
export const getKanban = () => api.get('/content/kanban').then((r) => r.data);
export const getContent = (id: string) =>
  api.get(`/content/${id}`).then((r) => r.data);
export const createContent = (data: any) =>
  api.post('/content', data).then((r) => r.data);
export const promoteIdea = (ideaId: string) =>
  api.post(`/content/promote/${ideaId}`).then((r) => r.data);
export const updateContent = (id: string, data: any) =>
  api.patch(`/content/${id}`, data).then((r) => r.data);
export const updateContentStatus = (id: string, status: string) =>
  api.patch(`/content/${id}/status`, { status }).then((r) => r.data);
export const scheduleContent = (id: string, scheduledDate: string, scheduledTime?: string) =>
  api.patch(`/content/${id}/schedule`, { scheduledDate, scheduledTime }).then((r) => r.data);
export const getCalendar = (from: string, to: string) =>
  api.get('/content/calendar', { params: { from, to } }).then((r) => r.data);

// Analytics
export const getDashboardStats = (from: string, to: string) =>
  api.get('/analytics/dashboard', { params: { from, to } }).then((r) => r.data);
export const trackMetric = (data: any) =>
  api.post('/analytics/track', data).then((r) => r.data);
export const getTopContent = (platform?: string) =>
  api.get('/analytics/top', { params: { platform } }).then((r) => r.data);

// Notifications
export const getReminders = (params?: Record<string, string>) =>
  api.get('/notifications/reminders', { params }).then((r) => r.data);
export const createReminder = (data: any) =>
  api.post('/notifications/reminders', data).then((r) => r.data);
export const dismissReminder = (id: string) =>
  api.patch(`/notifications/reminders/${id}/dismiss`).then((r) => r.data);

// Schedule
export const triggerDiscovery = () =>
  api.post('/schedule/trigger/discovery').then((r) => r.data);
export const triggerDigest = () =>
  api.post('/schedule/trigger/digest').then((r) => r.data);
export const getPipelineRuns = (limit = 20) =>
  api.get('/schedule/runs', { params: { limit } }).then((r) => r.data);

export default api;

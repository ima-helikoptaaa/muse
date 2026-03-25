export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'claude',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleProjectId: process.env.GOOGLE_PROJECT_ID,
    googleLocation: process.env.GOOGLE_LOCATION || 'us-central1',
  },
  rsshub: {
    baseUrl: process.env.RSSHUB_URL || 'http://localhost:1200',
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    userAgent: process.env.REDDIT_USER_AGENT || 'muse:v1.0.0',
  },
  productHunt: {
    apiToken: process.env.PRODUCTHUNT_API_TOKEN,
  },
  cron: {
    discovery: process.env.DISCOVERY_CRON || '0 6 * * *',
    digest: process.env.DIGEST_CRON || '0 7 * * *',
    brandReminder: process.env.BRAND_REMINDER_CRON || '0 9,17 * * 1-5',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
});

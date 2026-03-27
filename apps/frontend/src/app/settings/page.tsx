'use client';

import { useQuery } from '@tanstack/react-query';
import { getSources, getPipelineRuns } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Settings, Database, Bot, Clock, Rss } from 'lucide-react';

export default function SettingsPage() {
  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings size={24} /> Settings
        </h1>
      </div>

      {/* LLM Configuration */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Bot size={18} /> LLM Provider
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Configure your LLM provider via the <code>.env</code> file:
        </p>
        <div className="bg-[var(--muted)] rounded-lg p-3 text-sm font-mono">
          <p>LLM_PROVIDER=claude|openai|gemini</p>
          <p>ANTHROPIC_API_KEY=sk-ant-...</p>
          <p>OPENAI_API_KEY=sk-...</p>
          <p>GEMINI_API_KEY=AI...</p>
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Clock size={18} /> Schedule Configuration
        </h2>
        <div className="bg-[var(--muted)] rounded-lg p-3 text-sm font-mono space-y-1">
          <p>DIGEST_CRON=0 7 * * *       # Daily at 7 AM (AWS)</p>
          <p># Discovery runs locally via launchd at midnight</p>
        </div>
      </div>

      {/* Content Sources */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Rss size={18} /> Content Sources
        </h2>
        <div className="space-y-2">
          {sources?.map((source: any) => (
            <div
              key={source.id}
              className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
            >
              <div>
                <span className="text-sm font-medium">{source.name}</span>
                <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                  {source.type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {source.lastFetched && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Last: {formatDate(source.lastFetched)}
                  </span>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-red-500'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys Info */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Database size={18} /> External API Keys
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Required for some sources. Set in your <code>.env</code> file:
        </p>
        <div className="bg-[var(--muted)] rounded-lg p-3 text-sm font-mono space-y-1">
          <p>REDDIT_CLIENT_ID=        # Reddit API</p>
          <p>REDDIT_CLIENT_SECRET=    # Reddit API</p>
          <p>PRODUCTHUNT_API_TOKEN=   # Product Hunt API</p>
        </div>
      </div>
    </div>
  );
}

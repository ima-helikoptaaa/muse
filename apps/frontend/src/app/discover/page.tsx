'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArticles, getSources, fetchAllSources, triggerDiscovery } from '@/lib/api';
import type { RawArticle, Source } from '@/lib/api';
import { SourceType } from '@muse/shared';
import { formatDate } from '@/lib/utils';
import { Search, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

const SOURCE_TYPES = Object.values(SourceType);

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const [sourceType, setSourceType] = useState<string>('');

  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['articles', sourceType],
    queryFn: () => getArticles(sourceType ? { sourceType } : {}),
  });

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
  });

  const fetchMutation = useMutation({
    mutationFn: fetchAllSources,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Raw articles from all sources
          </p>
        </div>
        <button
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          aria-label="Fetch all sources"
        >
          <RefreshCw
            size={16}
            className={fetchMutation.isPending ? 'animate-spin' : ''}
          />
          {fetchMutation.isPending ? 'Fetching...' : 'Fetch All Sources'}
        </button>
      </div>

      {fetchMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to fetch sources. Please try again.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Sources</option>
          {SOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <p className="text-[var(--muted-foreground)]">Loading articles...</p>
      ) : isError ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to load articles.
        </div>
      ) : (
        <div className="space-y-3">
          {articles?.map((article: RawArticle) => (
            <div
              key={article.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {article.source?.name || article.source?.type}
                    </span>
                    {article.score && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Score: {article.score}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium">{article.title}</h3>
                  {article.summary && (
                    <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                    {article.authors?.length > 0 && (
                      <span>{article.authors.join(', ')}</span>
                    )}
                    <span>{formatDate(article.fetchedAt)}</span>
                  </div>
                </div>
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    aria-label={`Open ${article.title}`}
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
          {articles?.length === 0 && (
            <p className="text-center text-[var(--muted-foreground)] py-8">
              No articles yet. Click &quot;Fetch All Sources&quot; to start discovering.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

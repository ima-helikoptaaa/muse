'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArticles, getSources, fetchAllSources, triggerDiscovery } from '@/lib/api';
import type { RawArticle, Source } from '@/lib/api';
import { SourceType } from '@muse/shared';
import { formatDate } from '@/lib/utils';
import { Search, RefreshCw, ExternalLink, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const SOURCE_TYPES = Object.values(SourceType);

const SOURCE_LABELS: Record<string, string> = {
  ARXIV: 'arXiv',
  HACKER_NEWS: 'Hacker News',
  REDDIT: 'Reddit',
  GITHUB_TRENDING: 'GitHub Trending',
  HUGGINGFACE: 'HuggingFace',
  TECH_BLOG: 'Tech Blogs',
  PRODUCT_HUNT: 'Product Hunt',
  TWITTER: 'X / Twitter',
};

const SCORE_OPTIONS = [
  { label: 'Any Score', value: '' },
  { label: '10+', value: '10' },
  { label: '50+', value: '50' },
  { label: '100+', value: '100' },
  { label: '500+', value: '500' },
];

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const [sourceType, setSourceType] = useState<string>('');
  const [sourceId, setSourceId] = useState<string>('');
  const [minScore, setMinScore] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: sources } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
  });

  // Sources that match the selected type (for sub-filter dropdown)
  const subSources = useMemo(() => {
    if (!sourceType || !sources) return [];
    return sources.filter((s: Source) => s.type === sourceType);
  }, [sourceType, sources]);

  const showSubFilter = subSources.length > 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['articles', sourceType, sourceId, minScore, page],
    queryFn: () =>
      getArticles({
        ...(sourceId ? { sourceId } : sourceType ? { sourceType } : {}),
        ...(minScore && { minScore }),
        page: String(page),
      }),
  });

  const articles = data?.articles;
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const fetchMutation = useMutation({
    mutationFn: fetchAllSources,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Raw articles from all sources
            {total > 0 && <span className="ml-1">({total} total)</span>}
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
      <div className="flex flex-wrap gap-2">
        <select
          value={sourceType}
          onChange={(e) => {
            setSourceType(e.target.value);
            setSourceId('');
            resetPage();
          }}
          className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Sources</option>
          {SOURCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {SOURCE_LABELS[type] || type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        {showSubFilter && (
          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              resetPage();
            }}
            className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All {SOURCE_LABELS[sourceType] || sourceType}</option>
            {subSources.map((s: Source) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={minScore}
          onChange={(e) => {
            setMinScore(e.target.value);
            resetPage();
          }}
          className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        >
          {SCORE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
        <>
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
                        {article.source?.name || SOURCE_LABELS[article.source?.type] || article.source?.type}
                      </span>
                      {article.score != null && (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--muted)]"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-[var(--muted-foreground)]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--muted)]"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

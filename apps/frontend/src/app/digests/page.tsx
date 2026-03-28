'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDigests, generateDigest } from '@/lib/api';
import type { DigestSummary } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, Sparkles, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DigestsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['digests', page],
    queryFn: () => getDigests(page),
  });

  const digests = data?.digests;
  const totalPages = data?.totalPages || 1;

  const generateMutation = useMutation({
    mutationFn: () => generateDigest(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digests'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Digests</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            AI-curated summaries of the latest developments
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {generateMutation.isPending ? 'Generating...' : 'Generate Digest'}
        </button>
      </div>

      {generateMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to generate digest. Please try again.
        </div>
      )}

      {isLoading ? (
        <p className="text-[var(--muted-foreground)]">Loading digests...</p>
      ) : isError ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to load digests.
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {digests?.map((digest: DigestSummary) => (
              <Link
                key={digest.id}
                href={`/digests/${digest.id}`}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{digest.title}</h3>
                    {digest.summary && (
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        {digest.summary}
                      </p>
                    )}
                  </div>
                  <BookOpen size={20} className="text-[var(--primary)]" />
                </div>
                <div className="flex gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
                  <span>{digest._count?.items || 0} items</span>
                  <span>{digest._count?.contentIdeas || 0} ideas</span>
                  <span>{formatDate(digest.createdAt)}</span>
                </div>
              </Link>
            ))}
            {digests?.length === 0 && (
              <p className="text-center text-[var(--muted-foreground)] py-8">
                No digests yet. Fetch articles first, then generate a digest.
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

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDigest, generateIdeas } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, ExternalLink, Tag } from 'lucide-react';

export default function DigestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: digest, isLoading } = useQuery({
    queryKey: ['digest', id],
    queryFn: () => getDigest(id),
  });

  const ideationMutation = useMutation({
    mutationFn: () => generateIdeas(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digest', id] });
    },
  });

  if (isLoading) return <p className="text-[var(--muted-foreground)]">Loading...</p>;
  if (!digest) return <p>Digest not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/digests" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{digest.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {formatDate(digest.dateFrom)} - {formatDate(digest.dateTo)}
          </p>
        </div>
        <button
          onClick={() => ideationMutation.mutate()}
          disabled={ideationMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles size={16} />
          {ideationMutation.isPending ? 'Generating...' : 'Generate Ideas'}
        </button>
      </div>

      {digest.summary && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-sm">{digest.summary}</p>
        </div>
      )}

      <div className="space-y-4">
        {digest.items?.map((item: any) => (
          <div
            key={item.id}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-[var(--primary)]">
                    #{item.rank}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                    {(item.relevanceScore * 100).toFixed(0)}% relevant
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {item.rawArticle?.source?.name}
                  </span>
                </div>
                <h3 className="font-semibold">{item.rawArticle?.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  {item.aiSummary}
                </p>
                {item.whyItMatters && (
                  <p className="text-sm text-[var(--accent)] mt-2 italic">
                    Why it matters: {item.whyItMatters}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.topicTags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {item.rawArticle?.url && (
                <a
                  href={item.rawArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIdeas, promoteIdea } from '@/lib/api';
import type { ContentIdea } from '@/lib/api';
import { formatDate, statusColor } from '@/lib/utils';
import Link from 'next/link';
import {
  Lightbulb,
  ArrowRight,
  FileText,
  Youtube,
  Linkedin,
  Twitter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const formatIcons: Record<string, typeof FileText> = {
  BLOG_POST: FileText,
  YOUTUBE_VIDEO: Youtube,
  LINKEDIN_POST: Linkedin,
  TWITTER_POST: Twitter,
};

export default function IdeasPage() {
  const queryClient = useQueryClient();
  const [format, setFormat] = useState('');
  const [platform, setPlatform] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ideas', format, platform, page],
    queryFn: () =>
      getIdeas({
        ...(format && { format }),
        ...(platform && { platform }),
        page: String(page),
      }),
  });

  const ideas = data?.ideas;
  const totalPages = data?.totalPages || 1;

  const promoteMutation = useMutation({
    mutationFn: promoteIdea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Ideas</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          AI-generated content ideas from your digests
        </p>
      </div>

      {promoteMutation.isError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to promote idea. Please try again.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={format}
          onChange={handleFilterChange(setFormat)}
          className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Formats</option>
          <option value="BLOG_POST">Blog Post</option>
          <option value="YOUTUBE_VIDEO">YouTube Video</option>
          <option value="LINKEDIN_POST">LinkedIn Post</option>
          <option value="TWITTER_POST">Twitter Post</option>
        </select>
        <select
          value={platform}
          onChange={handleFilterChange(setPlatform)}
          className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Platforms</option>
          <option value="BLOG">Blog</option>
          <option value="YOUTUBE">YouTube</option>
          <option value="LINKEDIN">LinkedIn</option>
          <option value="TWITTER">Twitter/X</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-[var(--muted-foreground)]">Loading ideas...</p>
      ) : isError ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to load ideas.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {ideas?.map((idea: ContentIdea) => {
              const Icon = formatIcons[idea.format] || FileText;
              return (
                <div
                  key={idea.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} className="text-[var(--primary)]" />
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {idea.format.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {idea.estimatedEffort}
                    </span>
                    <span className="ml-auto text-xs font-bold text-[var(--primary)]">
                      P{idea.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold">{idea.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
                    {idea.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <Link
                      href={`/ideas/${idea.id}`}
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      View Details
                    </Link>
                    {!idea.contentPiece && (
                      <button
                        onClick={() => promoteMutation.mutate(idea.id)}
                        disabled={promoteMutation.isPending}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        Promote <ArrowRight size={14} />
                      </button>
                    )}
                    {idea.contentPiece && (
                      <span className="text-xs text-green-400">
                        Promoted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {ideas?.length === 0 && (
              <p className="text-center text-[var(--muted-foreground)] py-8 col-span-2">
                No ideas yet. Generate ideas from a digest.
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

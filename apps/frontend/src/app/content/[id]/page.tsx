'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContent, updateContent, updateContentStatus, scheduleContent } from '@/lib/api';
import { formatDate, statusColor } from '@/lib/utils';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const NEXT_STATUSES: Record<string, string[]> = {
  IDEA: ['RESEARCHING'],
  RESEARCHING: ['CREATING'],
  CREATING: ['READY'],
  READY: ['POSTED'],
  POSTED: [],
};

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: piece, isLoading, isError } = useQuery({
    queryKey: ['content', id],
    queryFn: () => getContent(id),
  });

  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (piece) {
      setBody(piece.body || '');
      setNotes(piece.notes || '');
    }
  }, [piece]);

  const saveMutation = useMutation({
    mutationFn: () => updateContent(id, { body, notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content', id] }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateContentStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content', id] }),
  });

  if (isLoading) return <p className="text-[var(--muted-foreground)]">Loading...</p>;

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
        <AlertCircle size={16} />
        Failed to load content piece.
      </div>
    );
  }

  if (!piece) return <p>Content not found</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/content" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" aria-label="Back to content board">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{piece.title}</h1>
          <div className="flex gap-2 mt-1">
            <span className={`text-xs px-2 py-1 rounded font-medium ${statusColor(piece.status)}`}>
              {piece.status}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
              {piece.format.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {piece.targetPlatform}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {NEXT_STATUSES[piece.status]?.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => statusMutation.mutate(nextStatus)}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Move to {nextStatus}
            </button>
          ))}
        </div>
      </div>

      {(saveMutation.isError || statusMutation.isError) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          {saveMutation.isError ? 'Failed to save changes.' : 'Failed to update status.'}
        </div>
      )}

      {/* Notes */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold mb-2">Notes & Research</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg p-3 text-sm resize-y"
          placeholder="Add research notes, links, thoughts..."
        />
      </div>

      {/* Content Body */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold mb-2">Content</h2>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg p-3 text-sm font-mono resize-y"
          placeholder="Write your content here..."
        />
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        <Save size={16} />
        {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
      </button>

      {/* Posted URL */}
      {piece.postedUrl && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-sm">
            Posted at:{' '}
            <a
              href={piece.postedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              {piece.postedUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

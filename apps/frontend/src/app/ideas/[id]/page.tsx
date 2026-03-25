'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getIdea, promoteIdea } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: idea, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => getIdea(id),
  });

  const promoteMutation = useMutation({
    mutationFn: () => promoteIdea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] });
      router.push('/content');
    },
  });

  if (isLoading) return <p className="text-[var(--muted-foreground)]">Loading...</p>;
  if (!idea) return <p>Idea not found</p>;

  const researchSteps = idea.researchSteps as string[];
  const talkingPoints = idea.talkingPoints as string[];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/ideas" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{idea.title}</h1>
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
              {idea.format.replace(/_/g, ' ')}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
              {idea.targetPlatform}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Est: {idea.estimatedEffort}
            </span>
          </div>
        </div>
        {!idea.contentPiece && (
          <button
            onClick={() => promoteMutation.mutate()}
            disabled={promoteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Promote to Content <ArrowRight size={16} />
          </button>
        )}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-semibold mb-2">Description</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {idea.description}
        </p>
      </div>

      {researchSteps?.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">Research Steps</h2>
          <ol className="space-y-2">
            {researchSteps.map((step: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]"
              >
                <span className="text-[var(--primary)] font-mono text-xs mt-0.5">
                  {i + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {talkingPoints?.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">Talking Points</h2>
          <ul className="space-y-2">
            {talkingPoints.map((point: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[var(--muted-foreground)]"
              >
                <CheckCircle
                  size={14}
                  className="text-green-400 mt-0.5 shrink-0"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

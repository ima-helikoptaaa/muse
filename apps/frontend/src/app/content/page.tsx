'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKanban, updateContentStatus } from '@/lib/api';
import { statusColor } from '@/lib/utils';
import Link from 'next/link';
import { Kanban, GripVertical } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  IDEA: 'Ideas',
  RESEARCHING: 'Researching',
  CREATING: 'Creating',
  READY: 'Ready',
  POSTED: 'Posted',
};

export default function ContentPage() {
  const queryClient = useQueryClient();
  const { data: columns, isLoading } = useQuery({
    queryKey: ['kanban'],
    queryFn: getKanban,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateContentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });

  const statuses = ['IDEA', 'RESEARCHING', 'CREATING', 'READY', 'POSTED'];
  const nextStatus: Record<string, string> = {
    IDEA: 'RESEARCHING',
    RESEARCHING: 'CREATING',
    CREATING: 'READY',
    READY: 'POSTED',
  };

  if (isLoading) return <p className="text-[var(--muted-foreground)]">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Kanban size={24} /> Content Board
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Manage your content pipeline
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const column = columns?.find((c: any) => c.status === status);
          const pieces = column?.pieces || [];
          return (
            <div
              key={status}
              className="min-w-[280px] w-[280px] shrink-0"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${statusColor(status)}`}
                >
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {pieces.length}
                </span>
              </div>
              <div className="space-y-2">
                {pieces.map((piece: any) => (
                  <div
                    key={piece.id}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-3"
                  >
                    <Link
                      href={`/content/${piece.id}`}
                      className="font-medium text-sm hover:text-[var(--primary)]"
                    >
                      {piece.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                        {piece.format.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {piece.targetPlatform}
                      </span>
                    </div>
                    {nextStatus[status] && (
                      <button
                        onClick={() =>
                          statusMutation.mutate({
                            id: piece.id,
                            status: nextStatus[status],
                          })
                        }
                        className="mt-2 text-xs text-[var(--primary)] hover:underline"
                      >
                        Move to {STATUS_LABELS[nextStatus[status]]} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

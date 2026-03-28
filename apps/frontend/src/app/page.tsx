'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDigests, getPipelineRuns, getKanban } from '@/lib/api';
import type { PipelineRun, KanbanColumn } from '@/lib/api';
import { formatDate, statusColor } from '@/lib/utils';
import {
  BookOpen,
  Lightbulb,
  FileText,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: digests, isLoading: digestsLoading, isError: digestsError } = useQuery({
    queryKey: ['digests'],
    queryFn: () => getDigests(1),
  });
  const { data: runs, isLoading: runsLoading, isError: runsError } = useQuery({
    queryKey: ['pipeline-runs'],
    queryFn: () => getPipelineRuns(5),
  });
  const { data: kanban, isLoading: kanbanLoading, isError: kanbanError } = useQuery({
    queryKey: ['kanban'],
    queryFn: getKanban,
  });

  const contentCounts = useMemo(
    () =>
      kanban?.reduce(
        (acc: Record<string, number>, col: KanbanColumn) => {
          acc[col.status] = col.pieces?.length || 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [kanban],
  );

  const isLoading = digestsLoading || runsLoading || kanbanLoading;

  if (isLoading) {
    return <p className="text-[var(--muted-foreground)]">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Your AI content engine at a glance
        </p>
      </div>

      {(digestsError || runsError || kanbanError) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          <AlertCircle size={16} />
          Failed to load some dashboard data. Please try refreshing.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} />}
          label="Digests"
          value={digests?.total || 0}
        />
        <StatCard
          icon={<Lightbulb size={20} />}
          label="Ideas"
          value={contentCounts?.IDEA || 0}
        />
        <StatCard
          icon={<FileText size={20} />}
          label="In Progress"
          value={
            (contentCounts?.RESEARCHING || 0) +
            (contentCounts?.CREATING || 0)
          }
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Ready to Post"
          value={contentCounts?.READY || 0}
        />
      </div>

      {/* Recent Pipeline Runs */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity size={18} /> Recent Pipeline Runs
        </h2>
        {runs?.length === 0 ? (
          <p className="text-[var(--muted-foreground)] text-sm">
            No pipeline runs yet. Trigger a discovery to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {runs?.map((run: PipelineRun) => (
              <div
                key={run.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      run.status === 'completed'
                        ? 'bg-green-500'
                        : run.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-sm font-medium">{run.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Clock size={14} />
                  {formatDate(run.startedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest Digest Preview */}
      {digests?.digests?.[0] && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <BookOpen size={18} /> Latest Digest
          </h2>
          <h3 className="font-medium">{digests.digests[0].title}</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {digests.digests[0].summary}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            {digests.digests[0]._count?.items || 0} items |{' '}
            {digests.digests[0]._count?.contentIdeas || 0} ideas generated
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

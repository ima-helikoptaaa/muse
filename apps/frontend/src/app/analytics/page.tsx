'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getTopContent } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

export default function AnalyticsPage() {
  const from = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const to = format(new Date(), 'yyyy-MM-dd');

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', from, to],
    queryFn: () => getDashboardStats(from, to),
  });

  const { data: topContent } = useQuery({
    queryKey: ['top-content'],
    queryFn: () => getTopContent(),
  });

  const platforms = stats?.byPlatform
    ? Object.entries(stats.byPlatform)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={24} /> Analytics
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Last 30 days performance
        </p>
      </div>

      {/* Platform Stats */}
      {platforms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platforms.map(([platform, data]: [string, any]) => (
            <div
              key={platform}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5"
            >
              <h3 className="font-semibold text-sm mb-3">{platform}</h3>
              <div className="space-y-2">
                <MetricRow icon={<Eye size={14} />} label="Impressions" value={data.impressions} />
                <MetricRow icon={<Heart size={14} />} label="Likes" value={data.likes} />
                <MetricRow icon={<MessageCircle size={14} />} label="Comments" value={data.comments} />
                <MetricRow icon={<Share2 size={14} />} label="Shares" value={data.shares} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center">
          <p className="text-[var(--muted-foreground)]">
            No analytics data yet. Start tracking metrics for your posted content.
          </p>
        </div>
      )}

      {/* Content by Status */}
      {stats?.contentCount && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3">Content by Status</h2>
          <div className="flex gap-6">
            {stats.contentCount.map((item: any) => (
              <div key={item.status}>
                <p className="text-2xl font-bold">{item._count.id}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {item.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Content */}
      {topContent?.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={18} /> Top Performing Content
          </h2>
          <div className="space-y-2">
            {topContent.map((metric: any) => (
              <div
                key={metric.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <span className="text-sm">
                  {metric.contentPiece?.title || 'Unknown'}
                </span>
                <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
                  <span>{metric.likes} likes</span>
                  <span>{metric.impressions} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
        {icon} {label}
      </span>
      <span className="font-medium">{value.toLocaleString()}</span>
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReminders, dismissReminder, createReminder } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import { Bell, Check, X, Plus } from 'lucide-react';

export default function RemindersPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: pending } = useQuery({
    queryKey: ['reminders', 'PENDING'],
    queryFn: () => getReminders({ status: 'PENDING' }),
  });

  const { data: sent } = useQuery({
    queryKey: ['reminders', 'SENT'],
    queryFn: () => getReminders({ status: 'SENT' }),
  });

  const dismissMutation = useMutation({
    mutationFn: dismissReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={24} /> Reminders
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Posting reminders and brand activities
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
        >
          <Plus size={16} /> New Reminder
        </button>
      </div>

      {showCreate && <CreateReminderForm onClose={() => setShowCreate(false)} />}

      {/* Pending Reminders */}
      <div>
        <h2 className="font-semibold mb-3">
          Pending ({pending?.total || 0})
        </h2>
        <div className="space-y-2">
          {pending?.reminders?.map((r: any) => (
            <div
              key={r.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    {r.type.replace(/_/g, ' ')}
                  </span>
                  {r.platform && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {r.platform}
                    </span>
                  )}
                </div>
                <h3 className="font-medium">{r.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {r.message}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Scheduled: {formatDate(r.scheduledAt)}
                </p>
              </div>
              <button
                onClick={() => dismissMutation.mutate(r.id)}
                className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {(!pending?.reminders || pending.reminders.length === 0) && (
            <p className="text-sm text-[var(--muted-foreground)]">
              No pending reminders
            </p>
          )}
        </div>
      </div>

      {/* Sent Reminders */}
      <div>
        <h2 className="font-semibold mb-3">
          Recent ({sent?.total || 0})
        </h2>
        <div className="space-y-2">
          {sent?.reminders?.slice(0, 10).map((r: any) => (
            <div
              key={r.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 opacity-60"
            >
              <div className="flex items-center gap-2 mb-1">
                <Check size={14} className="text-green-400" />
                <span className="text-xs text-[var(--muted-foreground)]">
                  {r.type.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 className="font-medium text-sm">{r.title}</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Sent: {formatDate(r.sentAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateReminderForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('CUSTOM');
  const [platform, setPlatform] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createReminder({
        type,
        title,
        message,
        platform: platform || undefined,
        scheduledAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      onClose();
    },
  });

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      >
        <option value="CUSTOM">Custom</option>
        <option value="POST_CONTENT">Post Content</option>
        <option value="BRAND_MEME">Brand Meme</option>
        <option value="ENGAGEMENT">Engagement</option>
      </select>
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      >
        <option value="">No Platform</option>
        <option value="TWITTER">Twitter/X</option>
        <option value="LINKEDIN">LinkedIn</option>
        <option value="YOUTUBE">YouTube</option>
        <option value="BLOG">Blog</option>
      </select>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Reminder title"
        className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Reminder message"
        rows={3}
        className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-y"
      />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={!title || !message || mutation.isPending}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          Create
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-lg text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

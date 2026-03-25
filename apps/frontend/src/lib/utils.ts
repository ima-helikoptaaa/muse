import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function statusColor(status: string) {
  const colors: Record<string, string> = {
    IDEA: 'bg-blue-500/20 text-blue-400',
    RESEARCHING: 'bg-yellow-500/20 text-yellow-400',
    CREATING: 'bg-purple-500/20 text-purple-400',
    READY: 'bg-green-500/20 text-green-400',
    POSTED: 'bg-emerald-500/20 text-emerald-400',
    ARCHIVED: 'bg-zinc-500/20 text-zinc-400',
  };
  return colors[status] || 'bg-zinc-500/20 text-zinc-400';
}

export function platformIcon(platform: string) {
  const icons: Record<string, string> = {
    BLOG: 'FileText',
    YOUTUBE: 'Youtube',
    LINKEDIN: 'Linkedin',
    TWITTER: 'Twitter',
  };
  return icons[platform] || 'Globe';
}

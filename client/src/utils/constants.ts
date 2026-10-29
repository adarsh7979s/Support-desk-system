import type { TicketStatus, TicketPriority } from '../types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_ON_CUSTOMER: 'Waiting on Customer',
  RESOLVED: 'Resolved',
};

export const STATUS_COLORS: Record<TicketStatus, { bg: string; text: string; dot: string; border: string }> = {
  OPEN: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]',
    border: 'border-blue-500/30',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    border: 'border-amber-500/30',
  },
  WAITING_ON_CUSTOMER: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]',
    border: 'border-purple-500/30',
  },
  RESOLVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    border: 'border-emerald-500/30',
  },
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const PRIORITY_COLORS: Record<TicketPriority, { bg: string; text: string; border: string; dot: string }> = {
  LOW: {
    bg: 'bg-zinc-800/60',
    text: 'text-zinc-400',
    border: 'border-zinc-700/50',
    dot: 'bg-zinc-400',
  },
  MEDIUM: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]',
  },
  HIGH: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
  },
  URGENT: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/40',
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
  },
};

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function isOverdue(createdAt: string, status: TicketStatus): boolean {
  if (status === 'RESOLVED') return false;
  const created = new Date(createdAt);
  const now = new Date();
  return now.getTime() - created.getTime() > 24 * 60 * 60 * 1000;
}

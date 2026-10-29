import type { TicketStatus, TicketPriority } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../utils/constants';
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export function StatusBadge({ status }: { status: TicketStatus }) {
  const conf = STATUS_COLORS[status] || STATUS_COLORS.OPEN;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg} ${conf.text} ${conf.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const conf = PRIORITY_COLORS[priority] || PRIORITY_COLORS.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.bg} ${conf.text} ${conf.border}`}
    >
      {priority === 'URGENT' ? (
        <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      )}
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
      <Clock className="w-3 h-3 text-rose-400" />
      Overdue
    </span>
  );
}

export function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-2 border-pink-500/10 border-b-pink-500 animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
        />
      </div>
      {label && <p className="text-xs text-zinc-400 animate-pulse">{label}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        <AlertCircle className="w-7 h-7 text-purple-400" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400 max-w-sm">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 text-xs font-medium rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/50 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 backdrop-blur-md p-4 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-rose-200">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Avatar({
  name,
  size = 'md',
  className = '',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Consistent color hash
  const colors = [
    'from-purple-600 to-indigo-600 text-white',
    'from-pink-600 to-rose-600 text-white',
    'from-cyan-600 to-blue-600 text-white',
    'from-emerald-600 to-teal-600 text-white',
    'from-amber-600 to-orange-600 text-white',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length];

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
  };

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-medium shadow-sm flex-shrink-0 border border-white/10 ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}

export function Toast({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  const bg =
    type === 'success'
      ? 'border-emerald-500/40 bg-[#121916]/95 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
      : type === 'error'
      ? 'border-rose-500/40 bg-[#1e1215]/95 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
      : 'border-purple-500/40 bg-[#151221]/95 text-purple-200 shadow-[0_0_25px_rgba(139,92,246,0.2)]';

  const icon =
    type === 'success' ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    ) : type === 'error' ? (
      <AlertCircle className="w-4 h-4 text-rose-400" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-purple-400" />
    );

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-xl animate-fade-in ${bg}`}
    >
      {icon}
      <span className="text-xs font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-zinc-400 hover:text-white text-xs">
        ✕
      </button>
    </div>
  );
}

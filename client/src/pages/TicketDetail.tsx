import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { TicketDetail as TicketDetailType, Agent, TicketStatus, TicketPriority, CommentType } from '../types';
import {
  StatusBadge,
  PriorityBadge,
  OverdueBadge,
  LoadingSpinner,
  ErrorMessage,
  Avatar,
  Toast,
} from '../components/ui';
import { STATUS_LABELS, PRIORITY_LABELS, formatDate, formatRelativeTime, isOverdue } from '../utils/constants';
import {
  ArrowLeft,
  Copy,
  Check,
  Send,
  Lock,
  MessageSquare,
  Clock,
  History,
  Mail,
} from 'lucide-react';

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED'];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const QUICK_MACROS = [
  {
    label: 'Request diagnostic logs',
    text: 'Hello, could you please provide your browser console logs and a screenshot of the error so our technical team can reproduce this issue?',
  },
  {
    label: 'Investigating with engineering',
    text: 'Thank you for providing the details. I have escalated this report to our core engineering team and we are currently investigating.',
  },
  {
    label: 'Issue verified & resolved',
    text: 'A fix has been deployed to production and verified. Please refresh your browser and confirm if the issue is now resolved on your end.',
  },
];

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetailType | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Comment form state
  const [commentContent, setCommentContent] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('REPLY');
  const [commentAuthor, setCommentAuthor] = useState('Sarah Chen');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'conversation' | 'activity'>('conversation');

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ticketData, agentsData] = await Promise.all([
        api.getTicket(id),
        api.getAgents(),
      ]);
      setTicket(ticketData);
      setAgents(agentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyTicketId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.id);
    setCopiedId(true);
    showToast('Ticket ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleFieldUpdate = async (field: string, value: string | null) => {
    if (!ticket || !id) return;
    const currentValue = ticket[field as keyof typeof ticket];
    if (value === currentValue) return;

    setUpdating(true);
    try {
      await api.updateTicket(id, {
        [field]: value,
        performedBy: commentAuthor || 'Sarah Chen',
      });
      const fullTicket = await api.getTicket(id);
      setTicket(fullTicket);
      showToast(`${field === 'assigneeId' ? 'Assignee' : field.charAt(0).toUpperCase() + field.slice(1)} updated`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update field');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !commentContent.trim()) {
      setCommentError('Please enter a message or note before sending');
      return;
    }

    setSubmittingComment(true);
    setCommentError(null);
    try {
      await api.addComment(id, {
        content: commentContent.trim(),
        type: commentType,
        authorName: commentAuthor,
      });
      setCommentContent('');
      const fullTicket = await api.getTicket(id);
      setTicket(fullTicket);
      showToast(commentType === 'NOTE' ? 'Internal note added' : 'Reply sent to customer');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to post message');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" label="Loading ticket conversation..." />;
  if (error || !ticket)
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <ErrorMessage
          message={error || 'Ticket not found'}
          onRetry={fetchTicket}
        />
        <button
          onClick={() => navigate('/tickets')}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-zinc-300 border border-white/[0.08]"
        >
          ← Back to Tickets
        </button>
      </div>
    );

  const overdue = isOverdue(ticket.createdAt, ticket.status);

  // Time calculations for SLA
  const createdDate = new Date(ticket.createdAt);
  const now = new Date();
  const ageHours = Math.round((now.getTime() - createdDate.getTime()) / 3600000);
  const slaRemainingHours = Math.max(0, 24 - ageHours);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Toast popup */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono">TICKET</span>
              <button
                onClick={copyTicketId}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-purple-300 border border-purple-500/30 transition-all"
                title="Click to copy full ID"
              >
                <span>#{ticket.id.slice(0, 8)}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400" />
                )}
              </button>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {overdue && <OverdueBadge />}
            </div>
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-white mt-1">
              {ticket.subject}
            </h1>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {ticket.status !== 'RESOLVED' ? (
            <button
              onClick={() => handleFieldUpdate('status', 'RESOLVED')}
              disabled={updating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Resolve Ticket</span>
            </button>
          ) : (
            <button
              onClick={() => handleFieldUpdate('status', 'IN_PROGRESS')}
              disabled={updating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all"
            >
              <History className="w-3.5 h-3.5" />
              <span>Reopen Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Customer Info, Issue Description, Discussion */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Issue Description Card */}
          <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={ticket.customerName} size="lg" />
                <div>
                  <h3 className="text-sm font-bold text-white">{ticket.customerName}</h3>
                  <a
                    href={`mailto:${ticket.customerEmail}`}
                    className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 hover:underline mt-0.5"
                  >
                    <Mail className="w-3 h-3" />
                    <span>{ticket.customerEmail}</span>
                  </a>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-zinc-500 block font-mono">Submitted</span>
                <span className="text-xs text-zinc-300 font-medium">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Problem Description
              </h4>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Conversation & Activity Tabs */}
          <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] overflow-hidden shadow-xl">
            {/* Tab Switcher */}
            <div className="px-6 py-3 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('conversation')}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'conversation'
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion ({ticket.comments.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'activity'
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit History ({ticket.activities.length})</span>
                </button>
              </div>
            </div>

            {/* Conversation Feed */}
            {activeTab === 'conversation' ? (
              <div className="p-6 space-y-6">
                {ticket.comments.length === 0 ? (
                  <div className="py-10 text-center">
                    <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">No replies yet</p>
                    <p className="text-[11px] text-zinc-600">Be the first to reply or add an internal note</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ticket.comments.map((comment) => {
                      const isInternal = comment.type === 'NOTE';
                      return (
                        <div
                          key={comment.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isInternal
                              ? 'bg-amber-500/[0.04] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                              : 'bg-white/[0.02] border-white/[0.07]'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04]">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={comment.authorName} size="sm" />
                              <span className="text-xs font-semibold text-white">
                                {comment.authorName}
                              </span>
                              {isInternal ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  <Lock className="w-2.5 h-2.5" />
                                  Internal Note
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Public Reply
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Response Composer */}
                <div className="p-4 rounded-2xl bg-[#161524] border border-white/[0.08] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                    {/* Toggle Reply vs Note */}
                    <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setCommentType('REPLY')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          commentType === 'REPLY'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Public Reply</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCommentType('NOTE')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          commentType === 'NOTE'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Internal Note</span>
                      </button>
                    </div>

                    {/* Agent Identity */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500">Replying as:</span>
                      <select
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-[#181726] border border-white/[0.08] text-zinc-200 focus:outline-none cursor-pointer"
                      >
                        <option value="Sarah Chen">Sarah Chen (Lead)</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name} ({a.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Macros Chips */}
                  {commentType === 'REPLY' && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex-shrink-0">
                        Quick Templates:
                      </span>
                      {QUICK_MACROS.map((macro, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCommentContent(macro.text)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.03] text-zinc-300 border border-white/[0.06] hover:bg-white/[0.07] hover:text-white whitespace-nowrap transition-colors"
                        >
                          {macro.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input Textarea */}
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      placeholder={
                        commentType === 'REPLY'
                          ? 'Write a public response to the customer... (Ctrl+Enter to send)'
                          : 'Write a private note visible only to support staff...'
                      }
                      className="w-full p-3 text-xs rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                    />
                  </div>

                  {commentError && (
                    <p className="text-xs text-rose-400 font-medium">{commentError}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-zinc-500">
                      Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/[0.06] rounded">Ctrl+Enter</kbd> to submit
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAddComment()}
                      disabled={submittingComment || !commentContent.trim()}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md ${
                        commentType === 'REPLY'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(139,92,246,0.35)]'
                          : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {submittingComment ? (
                        <span>Posting...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{commentType === 'REPLY' ? 'Send Reply' : 'Add Note'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Chronological Activity / Audit Log */
              <div className="p-6 space-y-4">
                {ticket.activities.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No activity logged yet.</p>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
                    {ticket.activities.map((act) => (
                      <div key={act.id} className="relative group">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-[#12111D]" />
                        <div className="flex items-center justify-between text-xs">
                          <p className="font-semibold text-white">
                            {act.action.replace('_', ' ')}
                            {act.field && (
                              <span className="text-zinc-400 font-normal">
                                {' '}
                                ({act.field})
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {formatRelativeTime(act.createdAt)}
                          </span>
                        </div>
                        {act.oldValue && act.newValue && (
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                            <span className="line-through text-zinc-500">{act.oldValue}</span>
                            <span>→</span>
                            <span className="text-purple-300 font-semibold">{act.newValue}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Performed by {act.performedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Ticket Controls & Metadata */}
        <div className="space-y-6">
          {/* Quick Properties Card */}
          <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-white/[0.06]">
              Ticket Details
            </h3>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Current Status
              </label>
              <select
                value={ticket.status}
                onChange={(e) => handleFieldUpdate('status', e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#181726] border border-white/[0.1] text-white focus:outline-none focus:border-purple-500/60 cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Priority Level
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handleFieldUpdate('priority', e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#181726] border border-white/[0.1] text-white focus:outline-none focus:border-purple-500/60 cursor-pointer"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Assigned Specialist
              </label>
              <select
                value={ticket.assigneeId || ''}
                onChange={(e) => handleFieldUpdate('assigneeId', e.target.value || null)}
                disabled={updating}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#181726] border border-white/[0.1] text-white focus:outline-none focus:border-purple-500/60 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SLA Performance Card */}
          <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-white/[0.06] flex items-center justify-between">
              <span>SLA Target</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-400">Response SLA (24h)</span>
                <span className={overdue ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {overdue ? 'Breached' : `${slaRemainingHours}h remaining`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    overdue
                      ? 'bg-rose-500 w-full shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, (ageHours / 24) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.05] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Created At</span>
                <span className="text-zinc-300 font-mono">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Last Modified</span>
                <span className="text-zinc-300 font-mono">{formatDate(ticket.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

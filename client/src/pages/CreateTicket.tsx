import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Agent, TicketPriority, CreateTicketData } from '../types';
import { ErrorMessage, PriorityBadge, Avatar } from '../components/ui';
import {
  ArrowLeft,
  Sparkles,
  Send,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

const PRIORITIES: { key: TicketPriority; label: string; desc: string; color: string }[] = [
  {
    key: 'LOW',
    label: 'Low',
    desc: 'Minor inquiry or cosmetic suggestion',
    color: 'hover:border-zinc-500 peer-checked:border-zinc-500 peer-checked:bg-zinc-800/40',
  },
  {
    key: 'MEDIUM',
    label: 'Medium',
    desc: 'Standard question or non-blocking bug',
    color: 'hover:border-cyan-500 peer-checked:border-cyan-500 peer-checked:bg-cyan-950/30',
  },
  {
    key: 'HIGH',
    label: 'High',
    desc: 'Core workflow impaired or customer degraded',
    color: 'hover:border-amber-500 peer-checked:border-amber-500 peer-checked:bg-amber-950/30',
  },
  {
    key: 'URGENT',
    label: 'Urgent',
    desc: 'Critical production outage or revenue blocker',
    color: 'hover:border-rose-500 peer-checked:border-rose-500 peer-checked:bg-rose-950/40',
  },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CreateTicketData>({
    subject: '',
    customerName: '',
    customerEmail: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: null,
  });

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
  }, []);

  const fillSampleData = () => {
    setForm({
      subject: 'Critical: SSO SAML Authentication failing for enterprise users',
      customerName: 'Marcus Vance',
      customerEmail: 'marcus.vance@enterprise-corp.com',
      description:
        'Users attempting to authenticate through Okta SSO receive a 403 Forbidden handshake response starting at 14:00 UTC. Multiple team leads cannot access their workspaces.',
      priority: 'URGENT',
      assigneeId: agents[0]?.id || null,
    });
    setFieldErrors({});
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.subject.trim()) errors.subject = 'Subject summary is required';
    if (!form.customerName.trim()) errors.customerName = 'Customer contact name is required';
    if (!form.customerEmail.trim()) {
      errors.customerEmail = 'Customer email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      errors.customerEmail = 'Please provide a valid email address';
    }
    if (!form.description.trim()) errors.description = 'Issue description is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    try {
      const ticket = await api.createTicket(form);
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      const apiErr = err as Error & { details?: Record<string, string> };
      if (apiErr.details) setFieldErrors(apiErr.details);
      setError(apiErr.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof CreateTicketData, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const selectedAgent = agents.find((a) => a.id === form.assigneeId);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
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
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Create Support Ticket</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Log an incoming customer inquiry, issue, or request into DeskPulse.
            </p>
          </div>
        </div>

        {/* Fill Sample Data Pill */}
        <button
          type="button"
          onClick={fillSampleData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Fill Sample Data</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* 2-Column Layout: Form (Left) & Real-time Ticket Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] p-6 shadow-xl space-y-5">
            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Ticket Subject <span className="text-rose-400">*</span>
              </label>
              <input
                id="subject"
                type="text"
                value={form.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                placeholder="e.g., Unable to connect payment gateway in EU region"
                className={`w-full px-4 py-2.5 text-xs rounded-xl bg-white/[0.03] border text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                  fieldErrors.subject
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/40 bg-rose-950/10'
                    : 'border-white/[0.08] focus:border-purple-500/60 focus:ring-purple-500/40'
                }`}
              />
              {fieldErrors.subject && (
                <p className="mt-1 text-xs text-rose-400">{fieldErrors.subject}</p>
              )}
            </div>

            {/* Customer Name & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Customer Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  placeholder="e.g., Alex Rivera"
                  className={`w-full px-4 py-2.5 text-xs rounded-xl bg-white/[0.03] border text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.customerName
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/40 bg-rose-950/10'
                      : 'border-white/[0.08] focus:border-purple-500/60 focus:ring-purple-500/40'
                  }`}
                />
                {fieldErrors.customerName && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.customerName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customerEmail"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  Customer Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="e.g., alex@acme.inc"
                  className={`w-full px-4 py-2.5 text-xs rounded-xl bg-white/[0.03] border text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                    fieldErrors.customerEmail
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/40 bg-rose-950/10'
                      : 'border-white/[0.08] focus:border-purple-500/60 focus:ring-purple-500/40'
                  }`}
                />
                {fieldErrors.customerEmail && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.customerEmail}</p>
                )}
              </div>
            </div>

            {/* Interactive Priority Selector Cards */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Priority Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => {
                  const isSelected = form.priority === p.key;
                  return (
                    <div
                      key={p.key}
                      onClick={() => updateField('priority', p.key)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? p.key === 'URGENT'
                            ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                            : p.key === 'HIGH'
                            ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : p.key === 'MEDIUM'
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : 'bg-zinc-800/40 border-zinc-500'
                          : 'bg-white/[0.02] border-white/[0.07] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{p.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight">{p.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assignee Specialist */}
            <div>
              <label
                htmlFor="assigneeId"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Assign Support Specialist
              </label>
              <select
                id="assigneeId"
                value={form.assigneeId || ''}
                onChange={(e) => updateField('assigneeId', e.target.value || null)}
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#181726] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-purple-500/60 cursor-pointer"
              >
                <option value="">Leave unassigned (Auto-queue)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Detailed Problem Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the steps to reproduce, impact, error logs, and expected behavior..."
                className={`w-full p-4 text-xs rounded-xl bg-white/[0.03] border text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all resize-none ${
                  fieldErrors.description
                    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/40 bg-rose-950/10'
                    : 'border-white/[0.08] focus:border-purple-500/60 focus:ring-purple-500/40'
                }`}
              />
              {fieldErrors.description && (
                <p className="mt-1 text-xs text-rose-400">{fieldErrors.description}</p>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all disabled:opacity-40"
              >
                {submitting ? (
                  <span>Submitting Ticket...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Create Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Right Col: Live Ticket Card Preview */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Live Ticket Preview
              </span>
              <span className="text-[10px] text-zinc-500">Auto-updating</span>
            </div>

            {/* Simulated Ticket Card */}
            <div className="p-4 rounded-xl bg-[#181726] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <PriorityBadge priority={form.priority || 'MEDIUM'} />
                <span className="text-[10px] font-mono text-zinc-500">Just now</span>
              </div>

              <h4 className="text-xs font-bold text-white">
                {form.subject || 'Ticket subject summary will appear here...'}
              </h4>

              <p className="text-[11px] text-zinc-400 line-clamp-3">
                {form.description || 'Description details will be rendered here in real time as you write...'}
              </p>

              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={form.customerName || 'Customer'} size="sm" />
                  <div>
                    <p className="text-xs font-medium text-white">
                      {form.customerName || 'Customer Name'}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {form.customerEmail || 'email@example.com'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block">Assignee</span>
                  <span className="text-[11px] text-purple-300 font-medium">
                    {selectedAgent ? selectedAgent.name : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/[0.05] border border-purple-500/20 text-[11px] text-purple-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>
                New tickets immediately enter the queue with a 24-hour response SLA and an initial status of <strong>Open</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

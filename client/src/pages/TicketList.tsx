import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Ticket, Agent, TicketFilters as Filters, TicketStatus, TicketPriority } from '../types';
import { StatusBadge, PriorityBadge, OverdueBadge, LoadingSpinner, EmptyState, ErrorMessage, Avatar } from '../components/ui';
import { STATUS_LABELS, PRIORITY_LABELS, formatRelativeTime, isOverdue } from '../utils/constants';
import {
  Search,
  PlusCircle,
  LayoutGrid,
  List,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED'];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TicketList() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode: 'table' or 'board'
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    priority: '',
    assigneeId: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 15,
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTickets(filters);
      setTickets(data.tickets);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      assigneeId: '',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 15,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.assigneeId
  );

  const totalPages = Math.ceil(total / (filters.limit ?? 15));

  // Group tickets by status for Kanban Board View
  const ticketsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tickets.filter((t) => t.status === status);
    return acc;
  }, {} as Record<TicketStatus, Ticket[]>);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Tickets Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {total} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Search, filter, track and prioritize all customer conversations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#12111D] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'board'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-[#12111D] border border-white/[0.08] shadow-lg space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by subject, customer, or email..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-2">
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#181726] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-purple-500/60 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Select */}
          <div className="flex items-center gap-2">
            <select
              value={filters.priority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#181726] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-purple-500/60 cursor-pointer"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Select */}
          <div className="flex items-center gap-2">
            <select
              value={filters.assigneeId}
              onChange={(e) => updateFilter('assigneeId', e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#181726] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-purple-500/60 cursor-pointer"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [
                  'updatedAt' | 'priority',
                  'asc' | 'desc'
                ];
                setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
              }}
              className="px-3 py-2 text-xs rounded-xl bg-[#181726] border border-white/[0.08] text-zinc-200 focus:outline-none focus:border-purple-500/60 cursor-pointer"
            >
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="updatedAt-asc">Oldest First</option>
              <option value="priority-desc">Priority: High → Low</option>
              <option value="priority-asc">Priority: Low → High</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.08] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Quick Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05] overflow-x-auto pb-1">
          <button
            onClick={() => updateFilter('status', '')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filters.status === ''
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            All Tickets
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateFilter('status', s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filters.status === s
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Table or Board */}
      {loading ? (
        <LoadingSpinner size="lg" label="Retrieving tickets queue..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTickets} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets found"
          message="No support tickets matched your current search and filter criteria."
          action={
            hasActiveFilters
              ? { label: 'Clear Filters', onClick: resetFilters }
              : { label: 'Create New Ticket', onClick: () => navigate('/tickets/new') }
          }
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Subject & Context
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-right">
                    Updated
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate max-w-sm">
                          {ticket.subject}
                        </span>
                        {isOverdue(ticket.createdAt, ticket.status) && <OverdueBadge />}
                      </div>
                      <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5 max-w-md">
                        {ticket.description}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={ticket.customerName} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-white">{ticket.customerName}</p>
                          <p className="text-[11px] text-zinc-300 truncate max-w-[140px]">
                            {ticket.customerEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>

                    <td className="px-6 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="px-6 py-4">
                      {ticket.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={ticket.assignee.name} size="sm" />
                          <span className="text-xs text-zinc-200">{ticket.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-zinc-300 font-mono">
                        {formatRelativeTime(ticket.updatedAt)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
            <p className="text-xs text-zinc-300">
              Page <span className="font-semibold text-white">{filters.page}</span> of{' '}
              <span className="font-semibold text-white">{totalPages || 1}</span> (
              {total} total records)
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }))
                }
                disabled={(filters.page ?? 1) <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/[0.04] text-zinc-300 border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, (prev.page ?? 1) + 1),
                  }))
                }
                disabled={(filters.page ?? 1) >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-white/[0.04] text-zinc-300 border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {STATUSES.map((status) => {
            const list = ticketsByStatus[status] || [];
            return (
              <div
                key={status}
                className="rounded-2xl bg-[#12111D] border border-white/[0.08] p-4 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{STATUS_LABELS[status]}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-zinc-300">
                    {list.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500 italic">
                      No tickets in this column
                    </div>
                  ) : (
                    list.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="p-3.5 rounded-xl bg-[#181726] border border-white/[0.06] hover:border-purple-500/40 hover:bg-[#1E1C30] cursor-pointer transition-all shadow-sm group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <PriorityBadge priority={ticket.priority} />
                          {isOverdue(ticket.createdAt, ticket.status) && <OverdueBadge />}
                        </div>

                        <h4 className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                          {ticket.subject}
                        </h4>

                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                          {ticket.description}
                        </p>

                        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Avatar name={ticket.customerName} size="sm" />
                            <span className="text-[11px] text-zinc-300 truncate max-w-[80px]">
                              {ticket.customerName}
                            </span>
                          </div>

                          <span className="text-[10px] text-zinc-500 font-mono">
                            {formatRelativeTime(ticket.updatedAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

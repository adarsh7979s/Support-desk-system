import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { DashboardStats, Ticket } from '../types';
import { LoadingSpinner, ErrorMessage, StatusBadge, PriorityBadge, OverdueBadge, Avatar } from '../components/ui';
import { formatRelativeTime, isOverdue } from '../utils/constants';
import {
  Inbox,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  ArrowUpRight,
  ArrowRight,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active metric toggle for interactive chart
  const [activeMetric, setActiveMetric] = useState<'volume' | 'resolved' | 'sla'>('volume');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>(
    null
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, ticketsData] = await Promise.all([
        api.getDashboardStats(),
        api.getTickets({ limit: 6, sortBy: 'updatedAt', sortOrder: 'desc' }),
      ]);
      setStats(statsData);
      setRecentTickets(ticketsData.tickets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Performance chart data points (12 months or periodic intervals)
  const chartDatasets = useMemo(() => {
    return {
      volume: [
        { label: 'Jan', val: 32 },
        { label: 'Feb', val: 45 },
        { label: 'Mar', val: 40 },
        { label: 'Apr', val: 58 },
        { label: 'May', val: 62 },
        { label: 'Jun', val: 75 },
        { label: 'Jul', val: 70 },
        { label: 'Aug', val: 84 },
        { label: 'Sep', val: 89 },
        { label: 'Oct', val: 96 },
        { label: 'Nov', val: 104 },
        { label: 'Dec', val: 118 },
      ],
      resolved: [
        { label: 'Jan', val: 28 },
        { label: 'Feb', val: 41 },
        { label: 'Mar', val: 38 },
        { label: 'Apr', val: 54 },
        { label: 'May', val: 59 },
        { label: 'Jun', val: 72 },
        { label: 'Jul', val: 68 },
        { label: 'Aug', val: 81 },
        { label: 'Sep', val: 86 },
        { label: 'Oct', val: 92 },
        { label: 'Nov', val: 101 },
        { label: 'Dec', val: 114 },
      ],
      sla: [
        { label: 'Jan', val: 88 },
        { label: 'Feb', val: 90 },
        { label: 'Mar', val: 89 },
        { label: 'Apr', val: 92 },
        { label: 'May', val: 93 },
        { label: 'Jun', val: 95 },
        { label: 'Jul', val: 94 },
        { label: 'Aug', val: 96 },
        { label: 'Sep', val: 97 },
        { label: 'Oct', val: 96 },
        { label: 'Nov', val: 98 },
        { label: 'Dec', val: 99 },
      ],
    };
  }, []);

  if (loading) return <LoadingSpinner size="lg" label="Loading DeskPulse metrics..." />;
  if (error)
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  if (!stats) return null;

  // Calculate resolution rate
  const resolutionRate =
    stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100;

  // 4 Top Cards (matching the FinMetrics luxury layout)
  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.total,
      badge: '+12.5%',
      badgePositive: true,
      icon: Inbox,
      iconBg: 'bg-gradient-to-tr from-pink-500 to-rose-600 shadow-[0_0_20px_rgba(255,59,138,0.4)]',
    },
    {
      title: 'Active In Progress',
      value: stats.inProgress + stats.open,
      badge: '+18.2%',
      badgePositive: true,
      icon: Users,
      iconBg: 'bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]',
    },
    {
      title: 'Resolution Rate',
      value: `${resolutionRate}%`,
      badge: '+4.3%',
      badgePositive: true,
      icon: TrendingUp,
      iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    },
    {
      title: 'Urgent & Overdue',
      value: stats.urgent + stats.overdue,
      badge: stats.overdue > 0 ? `${stats.overdue} Overdue` : 'SLA Safe',
      badgePositive: stats.overdue === 0,
      icon: AlertCircle,
      iconBg: 'bg-gradient-to-tr from-rose-500 to-amber-600 shadow-[0_0_20px_rgba(244,63,94,0.4)]',
    },
  ];

  // SVG Chart path calculation
  const currentData = chartDatasets[activeMetric];
  const maxVal = Math.max(...currentData.map((d) => d.val)) * 1.15;
  const minVal = Math.min(...currentData.map((d) => d.val)) * 0.85;
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const points = currentData.map((d, i) => {
    const x = paddingX + (i / (currentData.length - 1)) * (svgWidth - paddingX * 2);
    const y =
      svgHeight -
      paddingY -
      ((d.val - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
    return { x, y, label: d.label, val: d.val };
  });

  // Construct smooth curve path
  const pathD = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${
    points[0].x
  } ${svgHeight - paddingY} Z`;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Welcome back! Here's what's happening with your support desk today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tickets"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.08] transition-all"
          >
            Browse All Tickets
          </Link>
          <Link
            to="/tickets/new"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all flex items-center gap-1.5"
          >
            <span>+ Create Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="relative rounded-2xl bg-[#12111D] border border-white/[0.08] p-5 hover:border-white/[0.16] hover:bg-[#161524] transition-all shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center text-white`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    c.badgePositive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  {c.badge}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-zinc-400">{c.title}</p>
                <p className="text-2xl font-bold tracking-tight text-white mt-1 group-hover:text-purple-200 transition-colors">
                  {c.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Grid: Performance Chart (Left) + Notifications Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#12111D] border border-white/[0.08] p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Performance Overview</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Multi-metric operational SLA & resolution tracking</p>
              </div>

              {/* Metric Switcher Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <button
                  onClick={() => setActiveMetric('volume')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeMetric === 'volume'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Volume
                </button>
                <button
                  onClick={() => setActiveMetric('resolved')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeMetric === 'resolved'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => setActiveMetric('sla')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeMetric === 'sla'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  SLA %
                </button>
              </div>
            </div>

            {/* Interactive SVG Smooth Spline Chart */}
            <div className="relative mt-4 w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-56 select-none overflow-visible"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = paddingY + ratio * (svgHeight - paddingY * 2);
                  return (
                    <line
                      key={ratio}
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Area Fill */}
                <path d={areaD} fill="url(#chartGradient)" />

                {/* Smooth Curve Stroke */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                />

                {/* Data Points */}
                {points.map((p, idx) => (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#0A0910"
                      stroke="#A855F7"
                      strokeWidth="2.5"
                      className="transition-all hover:r-6"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          x: p.x,
                          y: p.y,
                          label: p.label,
                          value:
                            activeMetric === 'sla'
                              ? `${p.val}% SLA Met`
                              : `${p.val} Tickets`,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text
                      x={p.x}
                      y={svgHeight - 6}
                      fill="#71717A"
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="Inter, sans-serif"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Hover Floating Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-2.5 py-1.5 rounded-lg bg-[#1F1D30] border border-purple-500/40 text-[11px] font-semibold text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] z-20"
                  style={{
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                    top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                  }}
                >
                  <p className="text-[10px] text-zinc-400">{hoveredPoint.label}</p>
                  <p className="text-purple-300 font-bold">{hoveredPoint.value}</p>
                </div>
              )}
            </div>
          </div>

          {/* 3 Mini Metric Cards under chart (from FinMetrics style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 mt-4 border-t border-white/[0.06]">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Active Queue</span>
                <span className="text-emerald-400 text-[10px] font-bold">+12.5%</span>
              </div>
              <p className="text-lg font-bold text-white mt-1">{stats.open + stats.inProgress}</p>
              {/* Mini SVG Sparkline */}
              <svg className="w-full h-5 mt-2" viewBox="0 0 100 20">
                <path
                  d="M0 16 Q20 5, 40 12 T80 6 T100 4"
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>SLA Rate</span>
                <span className="text-emerald-400 text-[10px] font-bold">+0.8%</span>
              </div>
              <p className="text-lg font-bold text-white mt-1">98.4%</p>
              <svg className="w-full h-5 mt-2" viewBox="0 0 100 20">
                <path
                  d="M0 14 Q20 12, 40 8 T80 4 T100 2"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Avg. First Response</span>
                <span className="text-emerald-400 text-[10px] font-bold">+18.2%</span>
              </div>
              <p className="text-lg font-bold text-white mt-1">14m 32s</p>
              <svg className="w-full h-5 mt-2" viewBox="0 0 100 20">
                <path
                  d="M0 8 Q20 14, 40 10 T80 15 T100 6"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Live Notifications & Activity Feed */}
        <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Live Activity</h2>
                  <p className="text-[11px] text-zinc-400">Recent events & alerts</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-purple-400 hover:text-purple-300 cursor-pointer">
                Live Sync
              </span>
            </div>

            {/* Event List */}
            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">SLA Milestone</p>
                      <span className="text-[10px] text-zinc-500">2m ago</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      95% SLA compliance maintained this week
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">Agent Assigned</p>
                      <span className="text-[10px] text-zinc-500">15m ago</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Sarah Chen assigned to database connectivity ticket
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">Queue Review</p>
                      <span className="text-[10px] text-zinc-500">1h ago</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {stats.waitingOnCustomer} tickets waiting for customer responses
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">System Health</p>
                      <span className="text-[10px] text-zinc-500">2h ago</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      SQLite database synced with 0 schema conflicts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/tickets"
            className="w-full mt-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white border border-white/[0.08] text-center transition-all block"
          >
            View All Tickets
          </Link>
        </div>
      </div>

      {/* Recent Tickets Table Section */}
      <div className="rounded-2xl bg-[#12111D] border border-white/[0.08] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Recent Tickets Queue</h2>
          </div>
          <Link
            to="/tickets"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>View all ({stats.total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                <th className="px-6 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Subject
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <Link to={`/tickets/${ticket.id}`} className="block">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate max-w-xs md:max-w-md">
                          {ticket.subject}
                        </span>
                        {isOverdue(ticket.createdAt, ticket.status) && <OverdueBadge />}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-300 mt-0.5 block">
                        ID: {ticket.id.slice(0, 8)}
                      </span>
                    </Link>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={ticket.customerName} size="sm" />
                      <div>
                        <p className="text-xs font-medium text-white">{ticket.customerName}</p>
                        <p className="text-[11px] text-zinc-300 truncate max-w-[150px]">
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
                    <span className="text-xs text-zinc-300">
                      {formatRelativeTime(ticket.updatedAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

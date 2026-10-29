import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  Search,
  Bell,
  Menu,
  X,
  Sparkles,
  Command,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Avatar } from './ui';
import { api } from '../api/client';
import type { Ticket } from '../types';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick ticket search inside command palette
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getTickets({ search: searchQuery, limit: 5 });
        setSearchResults(res.tickets);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/tickets',
      label: 'All Tickets',
      icon: Inbox,
    },
    {
      to: '/tickets/new',
      label: 'New Ticket',
      icon: PlusCircle,
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0A0910] text-[#F3F4F6] overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile slide-over) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#11101A] border-r border-white/[0.08] flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white">DeskPulse</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Support Operations</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/25 to-pink-600/10 text-white border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-purple-400' : 'text-zinc-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System Health Status Badge */}
        <div className="p-4 border-t border-white/[0.08] space-y-3">
          <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-zinc-200">System Ready</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-300">v2.4 LTS</span>
          </div>

          {/* Current Agent Info */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="relative">
              <Avatar name="Sarah Chen" size="md" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#11101A] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Sarah Chen</p>
              <p className="text-[11px] text-zinc-300 truncate">Lead Support Engineer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 px-6 border-b border-white/[0.08] bg-[#11101A]/80 backdrop-blur-xl flex items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-white p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Command / Search Bar */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-xs text-zinc-400 transition-all w-64 md:w-80 text-left cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <span className="flex-1 truncate">Search tickets, customers, ID...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/[0.06] border border-white/[0.1] rounded">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* New Ticket CTA */}
            <NavLink
              to="/tickets/new"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Ticket</span>
            </NavLink>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(255,59,138,0.7)]">
                  3
                </span>
              </button>

              {/* Notification Popup Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#151421] border border-white/[0.12] shadow-2xl p-4 z-50 animate-fade-in backdrop-blur-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="text-xs font-semibold text-white">Notifications</span>
                    <span className="text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer">
                      Mark all read
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-start gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">SLA Goal Reached</p>
                        <p className="text-[11px] text-zinc-400">94.2% resolution rate achieved this week</p>
                        <span className="text-[10px] text-zinc-500 mt-1 block">5m ago</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">High Priority Ticket</p>
                        <p className="text-[11px] text-zinc-400">Database connection timeouts reported</p>
                        <span className="text-[10px] text-zinc-500 mt-1 block">18m ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/[0.08]">
              <Avatar name="Sarah Chen" size="sm" />
              <div className="hidden md:block text-left">
                <span className="block text-xs font-semibold text-white leading-tight">Sarah Chen</span>
                <span className="block text-[10px] text-zinc-400 leading-tight">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K Modal) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md">
          <div
            className="w-full max-w-lg rounded-2xl bg-[#13121F] border border-white/[0.15] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
              <Search className="w-4 h-4 text-purple-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type to search tickets or customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-white bg-white/[0.06] rounded"
              >
                ESC
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-72 overflow-y-auto p-2">
              {isSearching ? (
                <div className="py-6 text-center text-xs text-zinc-500">Searching tickets...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setCommandPaletteOpen(false);
                        setSearchQuery('');
                        navigate(`/tickets/${t.id}`);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer group transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                          {t.subject}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {t.customerName} · <span className="font-mono text-zinc-500">{t.id.slice(0, 8)}</span>
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 ml-2" />
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="py-6 text-center text-xs text-zinc-500">No tickets found</div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs font-medium text-zinc-400">Quick Actions</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setCommandPaletteOpen(false);
                        navigate('/tickets/new');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
                    >
                      + Create Ticket
                    </button>
                    <button
                      onClick={() => {
                        setCommandPaletteOpen(false);
                        navigate('/tickets');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-zinc-300 border border-white/[0.08] hover:bg-white/[0.08]"
                    >
                      Browse Tickets
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

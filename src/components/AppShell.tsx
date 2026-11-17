import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  Calculator,
  FileSpreadsheet,
  GitCompare,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  UserCircle2,
  X,
} from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { THEMES_CATALOG } from '../utils/calculations';

interface NavRouteItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const RAIL_ROUTES: NavRouteItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/recommendations', label: 'Quick Wins', icon: Sparkles },
  { to: '/history', label: 'History', icon: History },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
  { to: '/about', label: 'Methodology', icon: BookOpen },
  { to: '/account', label: 'Account', icon: UserCircle2 },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    localSession,
    isDemoMode,
    isAuthenticated,
    profile,
    activeAudit,
    shellEntranceKey,
    toggleDarkLight,
    toggleUnitSystem,
    signOutHousehold,
    pendingUndoAudit,
    undoDeleteAudit,
    dismissUndo,
  } = useEcoTrack();
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentThemeMeta = THEMES_CATALOG.find((t) => t.id === profile.theme);
  const isDark = currentThemeMeta?.mode === 'dark';

  const handleLogout = async () => {
    await signOutHousehold();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Minimal Clean Top Header */}
      <motion.header
        key={`header-${shellEntranceKey}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="sticky top-0 z-30 surface-glass-header px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 no-print"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] btn-press"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            <span className="w-8 h-8 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4" />
            </span>
            <span>EcoTrack V22</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-xs text-[var(--text-muted)] pl-3 border-l border-[var(--border-subtle)] truncate">
            <span className="font-medium text-[var(--text-secondary)] truncate max-w-[180px]">
              {profile.householdName}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums whitespace-nowrap">
              {activeAudit.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleDarkLight}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)] flex items-center justify-center btn-press"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className="h-9 px-3.5 rounded-lg bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-xs font-semibold flex items-center gap-2 hover:opacity-90 whitespace-nowrap shrink-0 btn-press"
          >
            <UserCircle2 className="w-4 h-4" />
            <span>
              {user
                ? user.displayName?.split(' ')[0] || 'Profile'
                : localSession
                ? localSession.householdName.split(' ')[0] || 'Profile'
                : isDemoMode
                ? 'Demo Profile'
                : 'Sign In'}
            </span>
          </Link>
        </div>
      </motion.header>

      {/* Main Layout with Left Sticky Floating Vertical Pill Rail */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 gap-6">
        <motion.aside
          key={`rail-${shellEntranceKey}`}
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="hidden lg:flex flex-col items-center justify-between sticky top-24 h-[calc(100vh-7.5rem)] w-[72px] shrink-0 py-3 px-2 rounded-[34px] text-[var(--rail-text)] border border-white/10 shadow-xl z-20 no-print"
          style={{
            backgroundColor: 'var(--rail-bg)',
            backdropFilter: 'blur(20px) saturate(160%)',
          }}
        >
          {/* Top Quick-Log + Button */}
          <Link
            to="/calculator"
            title="Quick Log Audit"
            aria-label="Quick Log Audit"
            className="w-11 h-11 rounded-full bg-[#fcd34d] text-[#132a26] flex items-center justify-center shadow-md hover:brightness-105 btn-press"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </Link>

          {/* 8 Route Icons with Gliding Active Indicator */}
          <nav className="flex flex-col items-center gap-1.5 my-auto" aria-label="Main navigation">
            {RAIL_ROUTES.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === '/dashboard' && location.pathname === '/');
              return (
                <div
                  key={item.to}
                  className="relative flex items-center"
                  onMouseEnter={() => setHoveredRoute(item.to)}
                  onMouseLeave={() => setHoveredRoute(null)}
                >
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-colors btn-press ${
                      isActive ? 'text-[#132a26]' : 'text-emerald-100/75 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="railActiveCircle"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-[#fcd34d]"
                      />
                    )}
                    <Icon className="relative z-10 w-[19px] h-[19px]" />
                  </NavLink>

                  <AnimatePresence>
                    {hoveredRoute === item.to && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.14 }}
                        className="pointer-events-none absolute left-14 z-50 px-3 py-1.5 rounded-lg bg-[#132a26]/95 border border-emerald-400/20 text-white text-xs font-medium whitespace-nowrap shadow-xl backdrop-blur-md"
                      >
                        {item.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Bottom Unit Toggle & Log Out */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleUnitSystem}
              title={`Switch units (Current: ${profile.unitSystem === 'metric' ? 'Metric SI' : 'Imperial US'})`}
              className="w-11 h-9 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 text-[11px] font-mono font-semibold text-white flex items-center justify-center btn-press"
            >
              {profile.unitSystem === 'metric' ? 'SI' : 'US'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log Out"
              className="w-11 h-11 rounded-full text-emerald-100/75 hover:text-rose-300 hover:bg-white/10 flex items-center justify-center btn-press"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </motion.aside>

        {/* Main Workspace Content */}
        <motion.main
          key={`main-${shellEntranceKey}`}
          initial={{ opacity: 0, y: 20, scale: 0.975 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26, staggerChildren: 0.05 }}
          className="flex-1 min-w-0 pb-12"
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden no-print"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 h-full bg-[#132a26] text-white p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 font-bold">
                    <BarChart3 className="w-5 h-5 text-[#fcd34d]" />
                    <span>EcoTrack V22</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {RAIL_ROUTES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[#fcd34d] text-[#132a26]'
                              : 'text-emerald-100/80 hover:bg-white/10'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={toggleUnitSystem}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/10 text-xs font-mono flex items-center justify-between"
                >
                  <span>Unit System</span>
                  <span className="text-[#fcd34d]">
                    {profile.unitSystem === 'metric' ? 'Metric (SI)' : 'Imperial (US)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void handleLogout();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/20 text-rose-200 text-xs font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10-Second Undo Delete Snackbar */}
      <AnimatePresence>
        {pendingUndoAudit && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#132a26] text-white border border-emerald-400/30 shadow-2xl no-print"
          >
            <span className="text-sm">
              Removed <strong className="font-mono">{pendingUndoAudit.label}</strong>
            </span>
            <button
              type="button"
              onClick={undoDeleteAudit}
              className="px-3 py-1 rounded-lg bg-[#fcd34d] text-[#132a26] text-xs font-bold flex items-center gap-1.5 hover:brightness-105 btn-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              type="button"
              onClick={dismissUndo}
              aria-label="Dismiss notification"
              className="p-1 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutGrid,
  Calculator,
  Sparkles,
  History,
  GitCompare,
  FileCheck2,
  BookOpen,
  User,
  Scale,
  Plus,
  LogIn,
  UserPlus,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCarbon } from '../context/CarbonContext';
import { formatEmissionMass } from '../utils/calculations';
import { isSoundEnabled, setSoundEnabled, playUiSound } from '../utils/soundEffects';
import { WelcomeEntryModal } from './WelcomeEntryModal';
import { UndoDeletePopup } from './UndoDeletePopup';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    profile,
    theme,
    setTheme,
    records,
    adoptedSavings,
    t,
    locale,
    toggleUnitSystem,
    logout,
    lastDeletedRecord,
    undoDeleteAuditRecord,
    dismissUndoPopup,
  } = useCarbon();
  const navigate = useNavigate();
  const location = useLocation();
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

  const latestRecord = records[records.length - 1];
  const currentResult = latestRecord.result;
  const unitShort = profile.unitSystem === 'imperial' ? 'lbs' : 'kg';

  const handleLogout = async () => {
    playUiSound('click');
    await logout();
    navigate('/login');
  };

  const handleToggleDark = () => {
    const nextTheme = theme.isDark ? 'sage' : 'obsidian';
    setTheme(nextTheme);
    playUiSound('click');
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playUiSound('ding');
  };

  const railItems = [
    {
      path: '/dashboard',
      label: t.navDashboard,
      sub: `${formatEmissionMass(currentResult.perCapitaKgCO2e, profile.unitSystem, locale)} ${unitShort}/person`,
      icon: LayoutGrid,
    },
    {
      path: '/calculator',
      label: t.navCalculator,
      sub: '8 Activity Streams',
      icon: Calculator,
    },
    {
      path: '/recommendations',
      label: t.navRecommendations,
      sub: `${adoptedSavings.count} Active Quick Wins`,
      icon: Sparkles,
    },
    {
      path: '/history',
      label: t.navHistory,
      sub: `${records.length} Monthly Audits`,
      icon: History,
    },
    {
      path: '/compare',
      label: t.navCompare,
      sub: 'Month-over-Month Variance',
      icon: GitCompare,
    },
    {
      path: '/reports',
      label: t.navReports,
      sub: 'Certified PDF Report',
      icon: FileCheck2,
    },
    {
      path: '/about',
      label: t.navMethodology,
      sub: 'IPCC & Paris 1.5°C Factors',
      icon: BookOpen,
    },
    {
      path: '/login',
      label: profile.isGuest ? 'Login / Register' : 'Account & Profile',
      sub: profile.isGuest
        ? 'Guest Mode · Click to Sign In'
        : `${profile.householdName} (${profile.email})`,
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen v22-canvas p-2 sm:p-4 lg:p-5 flex flex-col">
      {/* Outer Super-App Glassmorphic Workspace Frame */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 v22-frame backdrop-blur-2xl rounded-[32px] p-3 sm:p-5 flex flex-col lg:flex-row gap-5">
        {/* Dashboard V22 Floating Vertical Pill Navigation Rail (Floating Capsule Dock / Gliding Icon Rail) */}
        <aside
          aria-label="Dashboard V22 Floating Vertical Pill Navigation Rail"
          className="no-print sticky top-2 sm:top-4 lg:top-5 z-50 lg:self-start lg:h-[calc(100vh-2.5rem)] bg-[#132a26] text-white rounded-[34px] lg:w-[76px] w-full px-4 py-3 lg:px-0 lg:py-5 flex lg:flex-col items-center justify-between shrink-0 shadow-[0_20px_50px_rgba(19,42,38,0.32)] border border-white/10 overflow-visible"
        >
          {/* Top Quick-Log Action Circle with Floating Dark-Forest Glass Tooltip */}
          <div className="relative group flex items-center justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                playUiSound('click');
                navigate('/calculator');
              }}
              aria-label="Log Monthly Usage"
              className="w-11 h-11 rounded-full bg-amber-300/15 hover:bg-amber-300/25 border border-amber-300/40 text-amber-300 flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </motion.button>

            <div
              role="tooltip"
              className="pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 hidden lg:flex flex-col left-[84px] absolute z-50 bg-[#132a26]/95 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 shadow-2xl whitespace-nowrap"
            >
              <span className="text-xs font-bold text-white">Log Monthly Usage</span>
              <span className="text-[10px] font-medium text-amber-300">
                8 Household Activity Streams
              </span>
            </div>
          </div>

          {/* Gliding Icon Rail Navigation */}
          <nav
            aria-label="Gliding Icon Rail"
            className="flex lg:flex-col items-center gap-1.5 sm:gap-2 my-auto"
          >
            {railItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/dashboard' && location.pathname === '/' && !profile.isGuest) ||
                (item.path === '/login' &&
                  ((location.pathname === '/' && profile.isGuest) ||
                    ['/register', '/verify-email', '/verify-phone', '/forgot-password', '/reset-password'].includes(
                      location.pathname
                    )));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => playUiSound('whoosh')}
                  aria-label={item.label}
                  className="relative group flex items-center justify-center w-12 h-12 rounded-full transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="railActiveCircle"
                      className="absolute inset-0 rounded-full bg-[#eef1ec] shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 28,
                      }}
                    />
                  )}

                  <Icon
                    className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                      isActive
                        ? 'text-[#132a26]'
                        : 'text-white/65 group-hover:text-amber-300'
                    }`}
                  />

                  <div
                    role="tooltip"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 hidden lg:flex flex-col left-[84px] absolute z-50 bg-[#132a26]/95 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 shadow-2xl whitespace-nowrap"
                  >
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    <span className="text-[10px] font-mono font-medium text-amber-300">
                      {item.sub}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Unit Toggle & Quick Auth Action in Rail */}
          <div className="hidden lg:flex flex-col items-center gap-2">
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  playUiSound('click');
                  toggleUnitSystem();
                }}
                aria-label="Toggle Metric or Imperial Units"
                className="w-10 h-10 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex flex-col items-center justify-center transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[8px] font-mono font-bold text-amber-300 mt-0.5">
                  {profile.unitSystem === 'metric' ? 'SI' : 'US'}
                </span>
              </button>

              <div
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 hidden lg:flex flex-col left-[84px] absolute z-50 bg-[#132a26]/95 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 shadow-2xl whitespace-nowrap"
              >
                <span className="text-xs font-bold text-white">
                  Unit System: {profile.unitSystem === 'metric' ? 'Metric (SI)' : 'Imperial (US)'}
                </span>
                <span className="text-[10px] font-mono text-amber-300">
                  Click to toggle kg/kWh/km ↔ lbs/gal/mi
                </span>
              </div>
            </div>

            {!profile.isGuest && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log Out"
                  className="w-10 h-10 rounded-full bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/30 text-rose-300 flex items-center justify-center transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <div
                  role="tooltip"
                  className="pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 hidden lg:flex flex-col left-[84px] absolute z-50 bg-[#132a26]/95 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 shadow-2xl whitespace-nowrap"
                >
                  <span className="text-xs font-bold text-white">Log Out</span>
                  <span className="text-[10px] font-mono text-amber-300">
                    Signed in as {profile.email}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-5">
          {/* Header with Brand, Household Status, Sound/Dark Mode toggles, and Register / Login / Logout controls */}
          <header className="no-print v22-card rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm font-extrabold tracking-tight flex items-center gap-1.5"
              >
                <span className="text-emerald-600 dark:text-emerald-400">EcoTrack</span>
                <span className="text-amber-600 dark:text-amber-300 font-mono text-xs">
                  V22
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-mono opacity-80 flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    profile.isGuest ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="hidden sm:inline">
                  {profile.householdName} · {latestRecord.label}
                </span>
                <span className="px-2 py-0.5 rounded-md v22-subcard text-[10px] font-bold uppercase">
                  {profile.isGuest ? 'Guest' : profile.email}
                </span>
              </div>

              {/* Sound Design Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                title={soundOn ? 'Mute UI Sounds' : 'Enable Subtle UI Sounds'}
                aria-label="Toggle UI Sound Effects"
                className="p-1.5 rounded-xl v22-subcard hover:opacity-90 transition-opacity"
              >
                {soundOn ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 opacity-60" />
                )}
              </button>

              {/* Floating Dark / Light Mode Toggle with Rotation */}
              <button
                type="button"
                onClick={handleToggleDark}
                title={theme.isDark ? 'Switch to Botanical Sage Light' : 'Switch to Obsidian Dark Mode'}
                aria-label="Toggle Dark Mode"
                className="p-1.5 rounded-xl v22-subcard hover:opacity-90 transition-transform duration-300"
              >
                {theme.isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400 rotate-0 transition-transform duration-300" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-[#132a26] rotate-0 transition-transform duration-300" />
                )}
              </button>

              {profile.isGuest ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl v22-subcard hover:opacity-90 text-xs font-bold transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#132a26] hover:bg-[#1b3b35] text-[#fcd34d] text-xs font-bold transition-colors shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Register
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl v22-subcard hover:opacity-90 text-xs font-semibold transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#132a26] hover:bg-[#1b3b35] text-[#fcd34d] text-xs font-bold transition-colors shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main Route Viewport */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>

      {/* Post-Login Welcome Entry Modal */}
      <WelcomeEntryModal />

      {/* Accidental Deletion Undo Bar */}
      <UndoDeletePopup
        deletedRecord={lastDeletedRecord}
        onUndo={undoDeleteAuditRecord}
        onDismiss={dismissUndoPopup}
      />
    </div>
  );
};

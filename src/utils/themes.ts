export type AppThemeId = 'sapphire' | 'obsidian' | 'sage' | 'aurora' | 'alabaster' | 'nordic';

export interface AppThemeConfig {
  id: AppThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  swatches: [string, string, string];
  chartPrimary: string;
  chartSecondary: string;
  chartAccent: string;
  chartGrid: string;
  chartText: string;
  tooltipBg: string;
  tooltipBorder: string;
}

export const APP_THEMES: Record<AppThemeId, AppThemeConfig> = {
  sapphire: {
    id: 'sapphire',
    name: 'V22 Blue & White',
    tagline: 'Glowing Blue Accents & Frosted White Glass',
    isDark: false,
    swatches: ['#e8f1ff', '#1e3a8a', '#3b82f6'],
    chartPrimary: '#2563eb',
    chartSecondary: '#06b6d4',
    chartAccent: '#6366f1',
    chartGrid: '#e2e8f0',
    chartText: '#475569',
    tooltipBg: 'rgba(255, 255, 255, 0.96)',
    tooltipBorder: 'rgba(59, 130, 246, 0.3)',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Emerald Obsidian',
    tagline: 'Dark Frosted Glass & Neon Mint',
    isDark: true,
    swatches: ['#071310', '#112923', '#34d399'],
    chartPrimary: '#34d399',
    chartSecondary: '#38bdf8',
    chartAccent: '#fb923c',
    chartGrid: 'rgba(255, 255, 255, 0.08)',
    chartText: '#9ca3af',
    tooltipBg: '#0d211d',
    tooltipBorder: 'rgba(52, 211, 153, 0.25)',
  },
  sage: {
    id: 'sage',
    name: 'Botanical Sage',
    tagline: 'V22 Soft Mint & Forest Teal',
    isDark: false,
    swatches: ['#e6ece9', '#132a26', '#10b981'],
    chartPrimary: '#059669',
    chartSecondary: '#2563eb',
    chartAccent: '#e07a5f',
    chartGrid: '#e5e7eb',
    chartText: '#4b5563',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e5e7eb',
  },
  aurora: {
    id: 'aurora',
    name: 'Midnight Aurora',
    tagline: 'Deep Cyber Blue & Electric Cyan',
    isDark: true,
    swatches: ['#090d16', '#1e3a8a', '#38bdf8'],
    chartPrimary: '#38bdf8',
    chartSecondary: '#818cf8',
    chartAccent: '#2dd4bf',
    chartGrid: 'rgba(255, 255, 255, 0.08)',
    chartText: '#94a3b8',
    tooltipBg: '#0f172a',
    tooltipBorder: 'rgba(56, 189, 248, 0.3)',
  },
  alabaster: {
    id: 'alabaster',
    name: 'Warm Alabaster',
    tagline: 'Editorial Sand, Espresso & Terracotta',
    isDark: false,
    swatches: ['#f3efe6', '#26211d', '#d97706'],
    chartPrimary: '#b45309',
    chartSecondary: '#0d9488',
    chartAccent: '#e11d48',
    chartGrid: '#e7e2d8',
    chartText: '#57534e',
    tooltipBg: '#fffdf9',
    tooltipBorder: '#e7e2d8',
  },
  nordic: {
    id: 'nordic',
    name: 'Nordic Frost',
    tagline: 'Crisp Arctic Slate & Deep Navy',
    isDark: false,
    swatches: ['#eef2f6', '#0f172a', '#0284c7'],
    chartPrimary: '#0284c7',
    chartSecondary: '#059669',
    chartAccent: '#6366f1',
    chartGrid: '#e2e8f0',
    chartText: '#475569',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
  },
};

export const THEME_LIST: AppThemeConfig[] = Object.values(APP_THEMES);

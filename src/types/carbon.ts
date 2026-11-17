export type ThemeId =
  | 'botanical-sage'
  | 'emerald-obsidian'
  | 'v22-blue-white'
  | 'midnight-aurora'
  | 'warm-alabaster'
  | 'nordic-frost';

export type UnitSystem = 'metric' | 'imperial';

export type RegionId =
  | 'IN'
  | 'GLOBAL'
  | 'US'
  | 'EU'
  | 'UK'
  | 'FR'
  | 'BR_NO'
  | 'AU'
  | 'AFR';

export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'BRL'
  | 'KES'
  | 'NGN';

export type StreamKey =
  | 'electricity'
  | 'lpg'
  | 'petrol'
  | 'diesel'
  | 'airTravel'
  | 'png'
  | 'water'
  | 'waste';

export interface ActivityInputs {
  electricityKwh: number;
  lpgKg: number;
  petrolL: number;
  dieselL: number;
  airTravelKm: number;
  pngM3: number;
  waterM3: number;
  wasteKg: number;
  compostKg: number;
  evKm: number;
  motorcycleKm: number;
  transitKm: number;
  biomassKg: number;
  heatPumpKwh?: number;
}

export interface HouseholdProfile {
  uid: string;
  householdName: string;
  members: number;
  regionId: RegionId;
  currency: CurrencyCode;
  unitSystem: UnitSystem;
  theme: ThemeId;
  solarOffsetPct: number;
  monthlyTargetKg: number;
}

export interface CarbonAudit extends ActivityInputs {
  id: string;
  uid: string;
  month: string; // YYYY-MM
  label: string;
  regionId: RegionId;
  members: number;
  solarOffsetPct: number;
  totalKgCo2e: number;
  notes?: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface StreamBreakdownItem {
  key: StreamKey;
  label: string;
  emoji: string;
  color: string;
  kgCo2e: number;
  sharePct: number;
  rawDisplay: string;
}

export interface AuditComputationResult {
  totalKgCo2e: number;
  perPersonKg: number;
  parisTargetTotalKg: number;
  parisTargetPerPersonKg: number;
  vsParisPct: number;
  vsRegionalAvgPct: number;
  treesNeededPerYear: number;
  solarSavedKg: number;
  compostSavedKg: number;
  peakStream: StreamBreakdownItem;
  streams: StreamBreakdownItem[];
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  mode: 'light' | 'dark';
  description: string;
  swatches: [string, string, string];
}

export interface QuickWinAction {
  id: string;
  title: string;
  category: StreamKey | 'all';
  difficulty: 'Zero Cost' | 'Low Cost' | 'Upgrade';
  annualSavingsKg: number;
  annualSavingsUsd: number;
  summary: string;
  steps: [string, string, string];
}

export interface HabitItem {
  id: string;
  label: string;
  impactKgDay: number;
  stream: StreamKey;
}

import {
  ActivityInputsMetric,
  CalculationResult,
  CurrencyCode,
  UnitSystem,
  calculateHouseholdFootprint,
  getRegionPreset,
} from '../utils/calculations';
import { SupportedLanguage } from '../utils/i18n';
import { QUICK_WINS_CATALOG } from '../utils/quickWins';
import { AppThemeId } from '../utils/themes';

export type HomeType =
  | 'Apartment'
  | 'Independent House'
  | 'Detached House'
  | 'Row Home'
  | 'Villa'
  | 'Rural Homestead';

export interface HouseholdProfile {
  id: string;
  email: string;
  householdName: string;
  country: string;
  stateRegion: string;
  members: number;
  homeType: HomeType;
  sizeM2: number;
  unitSystem: UnitSystem;
  currency: CurrencyCode;
  language: SupportedLanguage;
  theme?: AppThemeId;
  easyVisualMode: boolean;
  isGuest: boolean;
  authProvider?: 'google' | 'password' | 'demo' | 'guest';
  createdAt: string;
}

export interface StoredAccountEntry {
  profile: HouseholdProfile;
  password?: string;
  records: MonthlyAuditRecord[];
}

export interface MonthlyAuditRecord {
  id: string;
  month: string; // YYYY-MM
  label: string; // e.g. "October 2026"
  createdAt: string;
  inputs: ActivityInputsMetric;
  result: CalculationResult;
  notes?: string;
  restoredAt?: number;
}

export type GoalPresetType = 'modest_10' | 'standard_15' | 'paris_25' | 'custom';

export interface GoalSettings {
  preset: GoalPresetType;
  customCapKg: number;
}

export interface DailyTipState {
  tipIndex: number;
  streakDays: number;
  completedStepIndexes: number[];
  lastCompletedDate: string;
}

export const STORAGE_KEYS = {
  PROFILE: 'hct_user',
  RECORDS: 'hct_records',
  DRAFT_INPUTS: 'hct_draft_inputs_v1',
  ADOPTED_WINS: 'hct_adopted_quick_wins',
  GOAL_SETTINGS: 'hct_goal_settings',
  DAILY_STREAK: 'hct_daily_tip_state',
  DELETED_RECORDS: 'hct_deleted_records',
  WELCOME_SEEN: 'show_login_welcome',
  ACCOUNTS_REGISTRY: 'hct_registered_accounts_v1',
};

const IDB_NAME = 'EcoTrackOfflineDB';
const IDB_STORE = 'kvStore';

function syncToIndexedDB(key: string, value: unknown): void {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  try {
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
    };
  } catch {
    // Fallback silently to localStorage
  }
}

export const DEFAULT_GUEST_PROFILE: HouseholdProfile = {
  id: 'guest-household',
  email: 'guest@ecotrack.local',
  householdName: 'Greenfield Family Residence',
  country: 'IN',
  stateRegion: 'Bengaluru, Karnataka',
  members: 4,
  homeType: 'Apartment',
  sizeM2: 115,
  unitSystem: 'metric',
  currency: 'INR',
  language: 'en',
  theme: 'sage',
  easyVisualMode: false,
  isGuest: true,
  authProvider: 'guest',
  createdAt: '2026-05-01T08:00:00.000Z',
};

export const DEMO_ACCOUNT_PROFILE: HouseholdProfile = {
  id: 'demo-household-001',
  email: 'demo@carbontracker.org',
  householdName: 'Sharma & Rivera Eco-Household',
  country: 'IN',
  stateRegion: 'Mumbai, Maharashtra',
  members: 4,
  homeType: 'Apartment',
  sizeM2: 128,
  unitSystem: 'metric',
  currency: 'INR',
  language: 'en',
  theme: 'sage',
  easyVisualMode: false,
  isGuest: false,
  authProvider: 'demo',
  createdAt: '2026-05-01T08:00:00.000Z',
};

export function createSeededRecords(
  regionId = 'IN',
  members = 4,
  unitSystem: UnitSystem = 'metric'
): MonthlyAuditRecord[] {
  const months: Array<{
    month: string;
    label: string;
    elec: number;
    solar: number;
    lpg: number;
    png: number;
    petrol: number;
    diesel: number;
    ev: number;
    transit: number;
    aviation: number;
    water: number;
    waste: number;
    compost: number;
    notes: string;
  }> = [
    {
      month: '2026-05',
      label: 'May 2026',
      elec: 540,
      solar: 20,
      lpg: 14.2,
      png: 18,
      petrol: 88,
      diesel: 22,
      ev: 60,
      transit: 120,
      aviation: 650,
      water: 22,
      waste: 56,
      compost: 6,
      notes: 'Peak summer AC load + 1 domestic round-trip flight.',
    },
    {
      month: '2026-06',
      label: 'June 2026',
      elec: 495,
      solar: 35,
      lpg: 14.2,
      png: 16,
      petrol: 82,
      diesel: 18,
      ev: 90,
      transit: 150,
      aviation: 0,
      water: 21,
      waste: 52,
      compost: 10,
      notes: 'Monsoon onset reduced AC hours; zero air travel.',
    },
    {
      month: '2026-07',
      label: 'July 2026',
      elec: 420,
      solar: 45,
      lpg: 13.5,
      png: 15,
      petrol: 74,
      diesel: 12,
      ev: 120,
      transit: 190,
      aviation: 0,
      water: 19,
      waste: 48,
      compost: 15,
      notes: 'AC set to 24°C + ceiling fan pairing adopted.',
    },
    {
      month: '2026-08',
      label: 'August 2026',
      elec: 385,
      solar: 55,
      lpg: 12.8,
      png: 14,
      petrol: 64,
      diesel: 8,
      ev: 150,
      transit: 220,
      aviation: 0,
      water: 18,
      waste: 44,
      compost: 18,
      notes: '2-day/week metro commute + pressure cooking routine active.',
    },
    {
      month: '2026-09',
      label: 'September 2026',
      elec: 340,
      solar: 65,
      lpg: 11.8,
      png: 14,
      petrol: 55,
      diesel: 5,
      ev: 180,
      transit: 250,
      aviation: 0,
      water: 16,
      waste: 40,
      compost: 22,
      notes: 'Low-flow tap aerators installed; wet kitchen composting scaled.',
    },
    {
      month: '2026-10',
      label: 'October 2026',
      elec: 295,
      solar: 75,
      lpg: 10.6,
      png: 12,
      petrol: 46,
      diesel: 0,
      ev: 210,
      transit: 280,
      aviation: 0,
      water: 15,
      waste: 36,
      compost: 24,
      notes: 'Full LED transition + phantom standby cut-off; zero diesel generator use.',
    },
  ];

  return months.map((m, idx) => {
    const inputs: ActivityInputsMetric = {
      regionId,
      customGridFactorKgPerKwh: null,
      solarOffsetPercent: 10,
      electricityKwh: m.elec,
      solarNetMeteringKwh: m.solar,
      lpgKg: m.lpg,
      naturalGasM3: m.png,
      heatingOilKeroseneLitres: 0,
      biomassFirewoodKg: 0,
      heatPumpInductionKwh: 0,
      petrolLitres: m.petrol,
      dieselLitres: m.diesel,
      evKm: m.ev,
      motorcycleKm: 0,
      publicTransitKm: m.transit,
      aviationKm: m.aviation,
      waterM3: m.water,
      solidWasteKg: m.waste,
      compostedWasteKg: m.compost,
      householdMembers: members,
    };
    const result = calculateHouseholdFootprint(inputs, unitSystem);
    return {
      id: `audit-${m.month}-${idx}`,
      month: m.month,
      label: m.label,
      createdAt: `${m.month}-28T12:00:00.000Z`,
      inputs,
      result,
      notes: m.notes,
    };
  });
}

export const carbonApi = {
  getAccountsRegistry(): Record<string, StoredAccountEntry> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS_REGISTRY);
      if (raw) {
        return JSON.parse(raw) as Record<string, StoredAccountEntry>;
      }
    } catch {
      // ignore
    }
    return {};
  },

  saveAccountToRegistry(
    profile: HouseholdProfile,
    records: MonthlyAuditRecord[],
    password?: string
  ): void {
    const registry = this.getAccountsRegistry();
    const key = profile.email.trim().toLowerCase();
    const existing = registry[key];
    registry[key] = {
      profile,
      password: password ?? existing?.password,
      records,
    };
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS_REGISTRY, JSON.stringify(registry));
    syncToIndexedDB(STORAGE_KEYS.ACCOUNTS_REGISTRY, registry);
  },

  getProfile(): HouseholdProfile {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEYS.PROFILE) ||
        localStorage.getItem('hct_household_profile_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as HouseholdProfile;
        return parsed;
      }
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_GUEST_PROFILE));
    syncToIndexedDB(STORAGE_KEYS.PROFILE, DEFAULT_GUEST_PROFILE);
    return DEFAULT_GUEST_PROFILE;
  },

  saveProfile(profile: HouseholdProfile): HouseholdProfile {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    syncToIndexedDB(STORAGE_KEYS.PROFILE, profile);
    const records = this.getRecords();
    const updated = records.map((rec) => {
      const newInputs: ActivityInputsMetric = {
        ...rec.inputs,
        regionId: profile.country,
        householdMembers: profile.members,
      };
      return {
        ...rec,
        inputs: newInputs,
        result: calculateHouseholdFootprint(newInputs, profile.unitSystem),
      };
    });
    this.saveRecords(updated);
    if (!profile.isGuest) {
      this.saveAccountToRegistry(profile, updated);
    }
    return profile;
  },

  getRecords(): MonthlyAuditRecord[] {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEYS.RECORDS) ||
        localStorage.getItem('hct_monthly_records_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as MonthlyAuditRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure streams are computed on every record
          const prof = this.getProfile();
          return parsed
            .map((r) => ({
              ...r,
              result: r.result?.streams
                ? r.result
                : calculateHouseholdFootprint(r.inputs, prof.unitSystem),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
        }
      }
    } catch {
      // ignore
    }
    const profile = this.getProfile();
    const seeded = createSeededRecords(profile.country, profile.members, profile.unitSystem);
    this.saveRecords(seeded);
    return seeded;
  },

  saveRecords(records: MonthlyAuditRecord[]): void {
    const sorted = [...records].sort((a, b) => a.month.localeCompare(b.month));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(sorted));
    syncToIndexedDB(STORAGE_KEYS.RECORDS, sorted);
  },

  upsertRecord(record: MonthlyAuditRecord): MonthlyAuditRecord[] {
    const current = this.getRecords();
    const existingIdx = current.findIndex((r) => r.id === record.id || r.month === record.month);
    let next: MonthlyAuditRecord[];
    if (existingIdx >= 0) {
      next = [...current];
      next[existingIdx] = record;
    } else {
      next = [...current, record];
    }
    this.saveRecords(next);
    const prof = this.getProfile();
    if (!prof.isGuest) {
      this.saveAccountToRegistry(prof, next);
    }
    return next.sort((a, b) => a.month.localeCompare(b.month));
  },

  getDeletedRecordsBuffer(): MonthlyAuditRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELETED_RECORDS);
      if (raw) {
        return JSON.parse(raw) as MonthlyAuditRecord[];
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveDeletedRecordsBuffer(buffer: MonthlyAuditRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.DELETED_RECORDS, JSON.stringify(buffer));
  },

  deleteRecord(id: string): { updated: MonthlyAuditRecord[]; deleted: MonthlyAuditRecord | null } {
    const current = this.getRecords();
    const target = current.find((r) => r.id === id) || null;
    const updated = current.filter((r) => r.id !== id);
    this.saveRecords(updated);
    if (target) {
      const buffer = this.getDeletedRecordsBuffer().filter((r) => r.id !== target.id);
      this.saveDeletedRecordsBuffer([target, ...buffer]);
    }
    const prof = this.getProfile();
    if (!prof.isGuest) {
      this.saveAccountToRegistry(prof, updated);
    }
    return { updated, deleted: target };
  },

  purgeDeletedRecord(id: string): void {
    const buffer = this.getDeletedRecordsBuffer().filter((r) => r.id !== id);
    this.saveDeletedRecordsBuffer(buffer);
  },

  restoreRecord(record: MonthlyAuditRecord): MonthlyAuditRecord[] {
    this.purgeDeletedRecord(record.id);
    const restored: MonthlyAuditRecord = {
      ...record,
      restoredAt: Date.now(),
    };
    return this.upsertRecord(restored);
  },

  getDraftInputs(): ActivityInputsMetric {
    try {
      const sessionRaw = sessionStorage.getItem(STORAGE_KEYS.DRAFT_INPUTS);
      if (sessionRaw) {
        return JSON.parse(sessionRaw) as ActivityInputsMetric;
      }
      const raw = localStorage.getItem(STORAGE_KEYS.DRAFT_INPUTS);
      if (raw) {
        return JSON.parse(raw) as ActivityInputsMetric;
      }
    } catch {
      // ignore
    }
    const records = this.getRecords();
    const latest = records[records.length - 1];
    return latest.inputs;
  },

  saveDraftInputs(inputs: ActivityInputsMetric): void {
    try {
      sessionStorage.setItem(STORAGE_KEYS.DRAFT_INPUTS, JSON.stringify(inputs));
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEYS.DRAFT_INPUTS, JSON.stringify(inputs));
    syncToIndexedDB(STORAGE_KEYS.DRAFT_INPUTS, inputs);
  },

  getAdoptedQuickWins(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADOPTED_WINS);
      if (raw) {
        return JSON.parse(raw) as string[];
      }
    } catch {
      // ignore
    }
    const defaultAdopted = ['elec-thermostat-setpoint', 'cook-pressure-lid'];
    localStorage.setItem(STORAGE_KEYS.ADOPTED_WINS, JSON.stringify(defaultAdopted));
    return defaultAdopted;
  },

  toggleQuickWin(actionId: string): string[] {
    const current = this.getAdoptedQuickWins();
    const next = current.includes(actionId)
      ? current.filter((id) => id !== actionId)
      : [...current, actionId];
    localStorage.setItem(STORAGE_KEYS.ADOPTED_WINS, JSON.stringify(next));
    syncToIndexedDB(STORAGE_KEYS.ADOPTED_WINS, next);
    return next;
  },

  getAdoptedSavingsSummary(adoptedIds?: string[]): {
    totalMonthlyKgSaved: number;
    totalMonthlyUsdSaved: number;
    totalMonthlyInrSaved: number;
    annualTreesEquivalent: number;
    count: number;
  } {
    const ids = adoptedIds ?? this.getAdoptedQuickWins();
    const matched = QUICK_WINS_CATALOG.filter((q) => ids.includes(q.id));
    const totalMonthlyKgSaved = matched.reduce((acc, item) => acc + item.monthlyKgSaved, 0);
    const totalMonthlyUsdSaved = matched.reduce((acc, item) => acc + item.monthlyUsdSaved, 0);
    const totalMonthlyInrSaved = matched.reduce((acc, item) => acc + item.monthlyCostSavedInr, 0);
    const annualTreesEquivalent = Number(((totalMonthlyKgSaved * 12) / 22).toFixed(1));
    return {
      totalMonthlyKgSaved: Number(totalMonthlyKgSaved.toFixed(1)),
      totalMonthlyUsdSaved: Number(totalMonthlyUsdSaved.toFixed(2)),
      totalMonthlyInrSaved: Math.round(totalMonthlyInrSaved),
      annualTreesEquivalent,
      count: matched.length,
    };
  },

  getGoalSettings(baselineKg = 550): GoalSettings {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEYS.GOAL_SETTINGS) ||
        localStorage.getItem('hct_goal_settings_v1');
      if (raw) {
        return JSON.parse(raw) as GoalSettings;
      }
    } catch {
      // ignore
    }
    const initial: GoalSettings = {
      preset: 'standard_15',
      customCapKg: Math.round(baselineKg * 0.85),
    };
    localStorage.setItem(STORAGE_KEYS.GOAL_SETTINGS, JSON.stringify(initial));
    return initial;
  },

  saveGoalSettings(settings: GoalSettings): GoalSettings {
    localStorage.setItem(STORAGE_KEYS.GOAL_SETTINGS, JSON.stringify(settings));
    syncToIndexedDB(STORAGE_KEYS.GOAL_SETTINGS, settings);
    return settings;
  },

  loginDemoHousehold(): { profile: HouseholdProfile; records: MonthlyAuditRecord[] } {
    const demoRecords = createSeededRecords(
      DEMO_ACCOUNT_PROFILE.country,
      DEMO_ACCOUNT_PROFILE.members,
      DEMO_ACCOUNT_PROFILE.unitSystem
    );
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEMO_ACCOUNT_PROFILE));
    this.saveRecords(demoRecords);
    this.saveDraftInputs(demoRecords[demoRecords.length - 1].inputs);
    this.saveAccountToRegistry(DEMO_ACCOUNT_PROFILE, demoRecords, 'Demo@12345');
    try {
      sessionStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, 'true');
    } catch {
      // ignore
    }
    return { profile: DEMO_ACCOUNT_PROFILE, records: demoRecords };
  },

  loginWithCredentials(
    email: string,
    password?: string
  ): { profile: HouseholdProfile; records: MonthlyAuditRecord[] } {
    const normalized = email.trim().toLowerCase();
    if (normalized === 'demo@carbontracker.org') {
      return this.loginDemoHousehold();
    }
    const registry = this.getAccountsRegistry();
    const entry = registry[normalized];
    if (entry) {
      if (entry.password && password && entry.password !== password) {
        throw new Error('Incorrect password for this registered household account.');
      }
      const signedInProfile: HouseholdProfile = {
        ...entry.profile,
        isGuest: false,
      };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(signedInProfile));
      this.saveRecords(entry.records);
      this.saveDraftInputs(entry.records[entry.records.length - 1].inputs);
      try {
        sessionStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, 'true');
      } catch {
        // ignore
      }
      return { profile: signedInProfile, records: entry.records };
    }
    throw new Error(
      'No household account found with that email. Please register a new account or use 1-Click Demo.'
    );
  },

  registerOrMigrateHousehold(params: {
    id?: string;
    email: string;
    password?: string;
    householdName: string;
    country: string;
    stateRegion: string;
    members: number;
    homeType: HomeType;
    sizeM2: number;
    unitSystem: UnitSystem;
    currency: CurrencyCode;
    migrateGuestData: boolean;
    authProvider?: 'google' | 'password' | 'demo';
  }): { profile: HouseholdProfile; records: MonthlyAuditRecord[] } {
    const preset = getRegionPreset(params.country);
    const newProfile: HouseholdProfile = {
      id: params.id || `hh-${Date.now()}`,
      email: params.email.trim(),
      householdName: params.householdName.trim() || 'Registered Household',
      country: params.country,
      stateRegion: params.stateRegion.trim() || preset.name,
      members: Math.max(1, params.members),
      homeType: params.homeType,
      sizeM2: params.sizeM2 || 110,
      unitSystem: params.unitSystem,
      currency: params.currency,
      language: this.getProfile().language || 'en',
      theme: this.getProfile().theme || 'sage',
      easyVisualMode: false,
      isGuest: false,
      authProvider: params.authProvider || 'password',
      createdAt: new Date().toISOString(),
    };

    let records = this.getRecords();
    if (params.migrateGuestData && records.length > 0) {
      records = records.map((rec) => {
        const updatedInputs: ActivityInputsMetric = {
          ...rec.inputs,
          regionId: newProfile.country,
          householdMembers: newProfile.members,
        };
        return {
          ...rec,
          inputs: updatedInputs,
          result: calculateHouseholdFootprint(updatedInputs, newProfile.unitSystem),
        };
      });
    } else {
      records = createSeededRecords(newProfile.country, newProfile.members, newProfile.unitSystem);
    }

    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
    this.saveRecords(records);
    this.saveDraftInputs(records[records.length - 1].inputs);
    this.saveAccountToRegistry(newProfile, records, params.password);
    try {
      sessionStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, 'true');
    } catch {
      // ignore
    }
    return { profile: newProfile, records };
  },

  logoutHousehold(): { profile: HouseholdProfile; records: MonthlyAuditRecord[] } {
    const guestProfile: HouseholdProfile = {
      ...DEFAULT_GUEST_PROFILE,
      theme: this.getProfile().theme || 'sage',
      language: this.getProfile().language || 'en',
    };
    const guestRecords = createSeededRecords(
      guestProfile.country,
      guestProfile.members,
      guestProfile.unitSystem
    );
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(guestProfile));
    this.saveRecords(guestRecords);
    this.saveDraftInputs(guestRecords[guestRecords.length - 1].inputs);
    return { profile: guestProfile, records: guestRecords };
  },

  hasSeenWelcomeModal(): boolean {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.WELCOME_SEEN) !== 'true';
    } catch {
      return true;
    }
  },

  markWelcomeModalSeen(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.WELCOME_SEEN);
    } catch {
      // ignore
    }
  },
};

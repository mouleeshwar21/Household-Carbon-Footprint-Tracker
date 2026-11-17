import {
  ActivityInputs,
  AuditComputationResult,
  CarbonAudit,
  CurrencyCode,
  HabitItem,
  QuickWinAction,
  RegionId,
  StreamBreakdownItem,
  StreamKey,
  ThemeMeta,
  UnitSystem,
} from '../types/carbon';

export const PARIS_TARGET_PER_PERSON_KG = 167;
export const TREE_ABSORPTION_KG_PER_YEAR = 22;

export const STREAM_META: Record<
  StreamKey,
  {
    label: string;
    shortLabel: string;
    emoji: string;
    color: string;
    metricUnit: string;
    imperialUnit: string;
  }
> = {
  electricity: {
    label: 'Electricity',
    shortLabel: 'Power',
    emoji: '⚡',
    color: '#F59E0B',
    metricUnit: 'kWh',
    imperialUnit: 'kWh',
  },
  lpg: {
    label: 'Cooking Gas / LPG',
    shortLabel: 'LPG',
    emoji: '🔥',
    color: '#EF4444',
    metricUnit: 'kg',
    imperialUnit: 'lbs',
  },
  petrol: {
    label: 'Petrol',
    shortLabel: 'Petrol',
    emoji: '⛽',
    color: '#8B5CF6',
    metricUnit: 'L',
    imperialUnit: 'gal',
  },
  diesel: {
    label: 'Diesel',
    shortLabel: 'Diesel',
    emoji: '🚛',
    color: '#6366F1',
    metricUnit: 'L',
    imperialUnit: 'gal',
  },
  airTravel: {
    label: 'Air Travel',
    shortLabel: 'Flights',
    emoji: '✈️',
    color: '#06B6D4',
    metricUnit: 'km',
    imperialUnit: 'mi',
  },
  png: {
    label: 'Piped Natural Gas',
    shortLabel: 'PNG',
    emoji: '🔶',
    color: '#F97316',
    metricUnit: 'm³',
    imperialUnit: 'ft³',
  },
  water: {
    label: 'Water',
    shortLabel: 'Water',
    emoji: '💧',
    color: '#3B82F6',
    metricUnit: 'm³',
    imperialUnit: 'gal',
  },
  waste: {
    label: 'Household Waste',
    shortLabel: 'Waste',
    emoji: '♻️',
    color: '#84CC16',
    metricUnit: 'kg',
    imperialUnit: 'lbs',
  },
};

export interface RegionalPreset {
  id: RegionId;
  name: string;
  shortName: string;
  gridKgPerKwh: number;
  avgPerPersonMonthlyKg: number;
  defaultCurrency: CurrencyCode;
  sourceLabel: string;
}

export const REGIONAL_PRESETS: Record<RegionId, RegionalPreset> = {
  IN: {
    id: 'IN',
    name: 'India (CEA Grid)',
    shortName: 'India',
    gridKgPerKwh: 0.82,
    avgPerPersonMonthlyKg: 195,
    defaultCurrency: 'INR',
    sourceLabel: 'CEA CO₂ Baseline v19',
  },
  GLOBAL: {
    id: 'GLOBAL',
    name: 'Global Average',
    shortName: 'Global',
    gridKgPerKwh: 0.475,
    avgPerPersonMonthlyKg: 390,
    defaultCurrency: 'USD',
    sourceLabel: 'IEA World Energy Outlook',
  },
  US: {
    id: 'US',
    name: 'United States (eGRID)',
    shortName: 'USA',
    gridKgPerKwh: 0.386,
    avgPerPersonMonthlyKg: 1180,
    defaultCurrency: 'USD',
    sourceLabel: 'US EPA eGRID',
  },
  EU: {
    id: 'EU',
    name: 'European Union',
    shortName: 'EU-27',
    gridKgPerKwh: 0.256,
    avgPerPersonMonthlyKg: 520,
    defaultCurrency: 'EUR',
    sourceLabel: 'EEA Carbon Intensity',
  },
  UK: {
    id: 'UK',
    name: 'United Kingdom',
    shortName: 'UK',
    gridKgPerKwh: 0.207,
    avgPerPersonMonthlyKg: 440,
    defaultCurrency: 'GBP',
    sourceLabel: 'UK DESNZ / DEFRA',
  },
  FR: {
    id: 'FR',
    name: 'France (Nuclear + Renewables)',
    shortName: 'France',
    gridKgPerKwh: 0.056,
    avgPerPersonMonthlyKg: 380,
    defaultCurrency: 'EUR',
    sourceLabel: 'RTE France',
  },
  BR_NO: {
    id: 'BR_NO',
    name: 'Brazil / Norway (Hydro)',
    shortName: 'Hydro Grid',
    gridKgPerKwh: 0.072,
    avgPerPersonMonthlyKg: 240,
    defaultCurrency: 'BRL',
    sourceLabel: 'IEA Hydro Benchmark',
  },
  AU: {
    id: 'AU',
    name: 'Australia',
    shortName: 'Australia',
    gridKgPerKwh: 0.656,
    avgPerPersonMonthlyKg: 1220,
    defaultCurrency: 'USD',
    sourceLabel: 'DCCEEW Australia',
  },
  AFR: {
    id: 'AFR',
    name: 'East / West Africa',
    shortName: 'Africa',
    gridKgPerKwh: 0.49,
    avgPerPersonMonthlyKg: 110,
    defaultCurrency: 'KES',
    sourceLabel: 'IRENA Regional Factors',
  },
};

export const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { symbol: string; rateFromUsd: number; locale: string; label: string }
> = {
  INR: { symbol: '₹', rateFromUsd: 84.0, locale: 'en-IN', label: 'INR (₹)' },
  USD: { symbol: '$', rateFromUsd: 1.0, locale: 'en-US', label: 'USD ($)' },
  EUR: { symbol: '€', rateFromUsd: 0.92, locale: 'de-DE', label: 'EUR (€)' },
  GBP: { symbol: '£', rateFromUsd: 0.79, locale: 'en-GB', label: 'GBP (£)' },
  JPY: { symbol: '¥', rateFromUsd: 154.0, locale: 'ja-JP', label: 'JPY (¥)' },
  BRL: { symbol: 'R$', rateFromUsd: 5.75, locale: 'pt-BR', label: 'BRL (R$)' },
  KES: { symbol: 'KSh', rateFromUsd: 129.0, locale: 'en-KE', label: 'KES (KSh)' },
  NGN: { symbol: '₦', rateFromUsd: 1650.0, locale: 'en-NG', label: 'NGN (₦)' },
};

export const THEMES_CATALOG: ThemeMeta[] = [
  {
    id: 'botanical-sage',
    name: 'Botanical Sage',
    mode: 'light',
    description: 'Soft mint & deep forest with warm gold accents',
    swatches: ['#f2f7f4', '#132a26', '#fcd34d'],
  },
  {
    id: 'emerald-obsidian',
    name: 'Emerald Obsidian',
    mode: 'dark',
    description: 'Dark frosted glass & luminous mint',
    swatches: ['#071411', '#0d211c', '#34d399'],
  },
  {
    id: 'v22-blue-white',
    name: 'V22 Blue & White',
    mode: 'light',
    description: 'Crisp sapphire & frosted porcelain glass',
    swatches: ['#f3f7fc', '#1d4ed8', '#ffffff'],
  },
  {
    id: 'midnight-aurora',
    name: 'Midnight Aurora',
    mode: 'dark',
    description: 'Deep cyber indigo & electric cyan',
    swatches: ['#060d1f', '#0d1834', '#22d3ee'],
  },
  {
    id: 'warm-alabaster',
    name: 'Warm Alabaster',
    mode: 'light',
    description: 'Editorial sand, espresso & terracotta',
    swatches: ['#f8f5ef', '#29211c', '#c2410c'],
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    mode: 'light',
    description: 'Arctic slate & deep maritime navy',
    swatches: ['#eef3f7', '#0f2942', '#0284c7'],
  },
];

export const FACTORS = {
  lpgKg: 2.98,
  petrolL: 2.31,
  dieselL: 2.68,
  airTravelKm: 0.115,
  pngM3: 2.02,
  waterM3: 0.344,
  wasteKg: 0.52,
  compostCreditKg: 0.4,
  evKwhPerKm: 0.16,
  motorcycleKm: 0.084,
  transitKm: 0.041,
  biomassKg: 0.12,
  heatPumpCopDivisor: 2.8,
};

const KG_TO_LB = 2.20462262;
const L_TO_GAL = 0.264172052;
const KM_TO_MI = 0.621371192;
const M3_TO_FT3 = 35.3146667;
const M3_TO_GAL = 264.172052;

export function toDisplayAmount(
  metricVal: number,
  kind: 'kwh' | 'mass' | 'liquidFuel' | 'distance' | 'gasVol' | 'waterVol',
  unitSystem: UnitSystem
): number {
  if (unitSystem === 'metric') return metricVal;
  switch (kind) {
    case 'kwh':
      return metricVal;
    case 'mass':
      return metricVal * KG_TO_LB;
    case 'liquidFuel':
      return metricVal * L_TO_GAL;
    case 'distance':
      return metricVal * KM_TO_MI;
    case 'gasVol':
      return metricVal * M3_TO_FT3;
    case 'waterVol':
      return metricVal * M3_TO_GAL;
  }
}

export function fromDisplayAmount(
  displayVal: number,
  kind: 'kwh' | 'mass' | 'liquidFuel' | 'distance' | 'gasVol' | 'waterVol',
  unitSystem: UnitSystem
): number {
  if (unitSystem === 'metric') return displayVal;
  switch (kind) {
    case 'kwh':
      return displayVal;
    case 'mass':
      return displayVal / KG_TO_LB;
    case 'liquidFuel':
      return displayVal / L_TO_GAL;
    case 'distance':
      return displayVal / KM_TO_MI;
    case 'gasVol':
      return displayVal / M3_TO_FT3;
    case 'waterVol':
      return displayVal / M3_TO_GAL;
  }
}

export function formatMass(kg: number, unitSystem: UnitSystem, decimals = 1): string {
  const val = unitSystem === 'metric' ? kg : kg * KG_TO_LB;
  const unit = unitSystem === 'metric' ? 'kg' : 'lbs';
  return `${val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${unit}`;
}

export function formatCurrencyFromUsd(usdAmount: number, currency: CurrencyCode): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const converted = usdAmount * cfg.rateFromUsd;
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' || currency === 'INR' || currency === 'NGN' ? 0 : 2,
  }).format(converted);
}

export function computeAuditBreakdown(
  inputs: ActivityInputs,
  regionId: RegionId,
  members: number,
  solarOffsetPct: number,
  unitSystem: UnitSystem = 'metric'
): AuditComputationResult {
  const safeMembers = Math.max(1, Math.round(members || 1));
  const safeSolar = Math.min(100, Math.max(0, solarOffsetPct || 0));
  const gridFactor = REGIONAL_PRESETS[regionId]?.gridKgPerKwh ?? REGIONAL_PRESETS.IN.gridKgPerKwh;

  const grossElectricityKg = Math.max(0, inputs.electricityKwh) * gridFactor;
  const netElectricityKg = grossElectricityKg * (1 - safeSolar / 100);
  const heatPumpKg =
    Math.max(0, inputs.heatPumpKwh || 0) * (gridFactor / FACTORS.heatPumpCopDivisor);
  const evKg = Math.max(0, inputs.evKm || 0) * FACTORS.evKwhPerKm * gridFactor * (1 - safeSolar / 200);
  const electricityTotalKg = netElectricityKg + heatPumpKg + evKg;
  const solarSavedKg = grossElectricityKg - netElectricityKg;

  const lpgKgCo2 =
    Math.max(0, inputs.lpgKg) * FACTORS.lpgKg +
    Math.max(0, inputs.biomassKg || 0) * FACTORS.biomassKg;
  const petrolKgCo2 =
    Math.max(0, inputs.petrolL) * FACTORS.petrolL +
    Math.max(0, inputs.motorcycleKm || 0) * FACTORS.motorcycleKm;
  const dieselKgCo2 =
    Math.max(0, inputs.dieselL) * FACTORS.dieselL +
    Math.max(0, inputs.transitKm || 0) * FACTORS.transitKm;
  const airKgCo2 = Math.max(0, inputs.airTravelKm) * FACTORS.airTravelKm;
  const pngKgCo2 = Math.max(0, inputs.pngM3) * FACTORS.pngM3;
  const waterKgCo2 = Math.max(0, inputs.waterM3) * FACTORS.waterM3;

  const grossWasteKg = Math.max(0, inputs.wasteKg) * FACTORS.wasteKg;
  const compostCredit = Math.max(0, inputs.compostKg) * FACTORS.compostCreditKg;
  const wasteKgCo2 = Math.max(0, grossWasteKg - compostCredit);
  const compostSavedKg = Math.min(grossWasteKg, compostCredit);

  const rawValues: Record<StreamKey, { kg: number; rawDisplay: string }> = {
    electricity: {
      kg: electricityTotalKg,
      rawDisplay: `${Math.round(inputs.electricityKwh)} kWh`,
    },
    lpg: {
      kg: lpgKgCo2,
      rawDisplay: `${toDisplayAmount(inputs.lpgKg, 'mass', unitSystem).toFixed(1)} ${
        STREAM_META.lpg[unitSystem === 'metric' ? 'metricUnit' : 'imperialUnit']
      }`,
    },
    petrol: {
      kg: petrolKgCo2,
      rawDisplay: `${toDisplayAmount(inputs.petrolL, 'liquidFuel', unitSystem).toFixed(1)} ${
        STREAM_META.petrol[unitSystem === 'metric' ? 'metricUnit' : 'imperialUnit']
      }`,
    },
    diesel: {
      kg: dieselKgCo2,
      rawDisplay: `${toDisplayAmount(inputs.dieselL, 'liquidFuel', unitSystem).toFixed(1)} ${
        STREAM_META.diesel[unitSystem === 'metric' ? 'metricUnit' : 'imperialUnit']
      }`,
    },
    airTravel: {
      kg: airKgCo2,
      rawDisplay: `${Math.round(toDisplayAmount(inputs.airTravelKm, 'distance', unitSystem))} ${
        STREAM_META.airTravel[unitSystem === 'metric' ? 'metricUnit' : 'imperialUnit']
      }`,
    },
    png: {
      kg: pngKgCo2,
      rawDisplay: `${toDisplayAmount(inputs.pngM3, 'gasVol', unitSystem).toFixed(1)} ${
        STREAM_META.png[unitSystem === 'metric' ? 'metricUnit' : 'imperialUnit']
      }`,
    },
    water: {
      kg: waterKgCo2,
      rawDisplay: `${toDisplayAmount(inputs.waterM3, 'waterVol', unitSystem).toFixed(1)} ${
        STREAM_META.water[unitSystem === 'metric' ? 'metricUnit' : 'imperialUnit']
      }`,
    },
    waste: {
      kg: wasteKgCo2,
      rawDisplay: `${toDisplayAmount(inputs.wasteKg, 'mass', unitSystem).toFixed(1)} ${
        STREAM_META.waste[unitSystem === 'metric' ? 'metricUnit' : 'imperialUnit']
      }`,
    },
  };

  const totalKgCo2e = Object.values(rawValues).reduce((sum, item) => sum + item.kg, 0);

  const streams: StreamBreakdownItem[] = (Object.keys(STREAM_META) as StreamKey[]).map((key) => {
    const meta = STREAM_META[key];
    const kgCo2e = Number(rawValues[key].kg.toFixed(2));
    const sharePct = totalKgCo2e > 0 ? Number(((kgCo2e / totalKgCo2e) * 100).toFixed(1)) : 0;
    return {
      key,
      label: meta.label,
      emoji: meta.emoji,
      color: meta.color,
      kgCo2e,
      sharePct,
      rawDisplay: rawValues[key].rawDisplay,
    };
  });

  const sorted = [...streams].sort((a, b) => b.kgCo2e - a.kgCo2e);
  const peakStream = sorted[0];

  const perPersonKg = totalKgCo2e / safeMembers;
  const parisTargetTotalKg = PARIS_TARGET_PER_PERSON_KG * safeMembers;
  const vsParisPct = ((perPersonKg - PARIS_TARGET_PER_PERSON_KG) / PARIS_TARGET_PER_PERSON_KG) * 100;
  const regionalAvg = REGIONAL_PRESETS[regionId]?.avgPerPersonMonthlyKg ?? 195;
  const vsRegionalAvgPct = ((perPersonKg - regionalAvg) / regionalAvg) * 100;
  const treesNeededPerYear = Math.ceil((totalKgCo2e * 12) / TREE_ABSORPTION_KG_PER_YEAR);

  return {
    totalKgCo2e: Number(totalKgCo2e.toFixed(1)),
    perPersonKg: Number(perPersonKg.toFixed(1)),
    parisTargetTotalKg,
    parisTargetPerPersonKg: PARIS_TARGET_PER_PERSON_KG,
    vsParisPct: Number(vsParisPct.toFixed(1)),
    vsRegionalAvgPct: Number(vsRegionalAvgPct.toFixed(1)),
    treesNeededPerYear,
    solarSavedKg: Number(solarSavedKg.toFixed(1)),
    compostSavedKg: Number(compostSavedKg.toFixed(1)),
    peakStream,
    streams,
  };
}

export const CALCULATOR_PRESETS: Record<
  'minimal' | 'moderate' | 'heavy',
  { label: string; subtitle: string; inputs: ActivityInputs }
> = {
  minimal: {
    label: 'Minimal Solar Eco',
    subtitle: 'LEDs, transit commute, zero flights',
    inputs: {
      electricityKwh: 165,
      lpgKg: 9.5,
      petrolL: 12,
      dieselL: 0,
      airTravelKm: 0,
      pngM3: 4,
      waterM3: 11,
      wasteKg: 18,
      compostKg: 12,
      evKm: 180,
      motorcycleKm: 0,
      transitKm: 240,
      biomassKg: 0,
      heatPumpKwh: 20,
    },
  },
  moderate: {
    label: 'Moderate Urban',
    subtitle: '3-person household, mixed commute',
    inputs: {
      electricityKwh: 320,
      lpgKg: 14.2,
      petrolL: 42,
      dieselL: 8,
      airTravelKm: 350,
      pngM3: 14,
      waterM3: 18,
      wasteKg: 34,
      compostKg: 10,
      evKm: 90,
      motorcycleKm: 60,
      transitKm: 120,
      biomassKg: 0,
      heatPumpKwh: 0,
    },
  },
  heavy: {
    label: 'High-Consumption',
    subtitle: '2 vehicles, central AC & frequent flights',
    inputs: {
      electricityKwh: 740,
      lpgKg: 21,
      petrolL: 115,
      dieselL: 45,
      airTravelKm: 2100,
      pngM3: 32,
      waterM3: 32,
      wasteKg: 62,
      compostKg: 0,
      evKm: 0,
      motorcycleKm: 0,
      transitKm: 20,
      biomassKg: 0,
      heatPumpKwh: 0,
    },
  },
};

export const QUICK_WINS_CATALOG: QuickWinAction[] = [
  {
    id: 'ac-24c',
    title: 'Raise AC Thermostat by 2°C & Enable Eco Timer',
    category: 'electricity',
    difficulty: 'Zero Cost',
    annualSavingsKg: 420,
    annualSavingsUsd: 165,
    summary: 'Setting split ACs to 24–25°C instead of 21°C cuts compressor draw by 18–24% without sacrificing thermal comfort.',
    steps: [
      'Set main living-room and bedroom split units to 24°C with ceiling fans on low.',
      'Clean mesh dust filters every 30 days to recover lost airflow efficiency.',
      'Schedule a 2:00 AM auto-sleep ramp so compressors cycle down before dawn.',
    ],
  },
  {
    id: 'induction-lpg',
    title: 'Shift Morning Boiling & Simmering to Induction',
    category: 'lpg',
    difficulty: 'Low Cost',
    annualSavingsKg: 185,
    annualSavingsUsd: 78,
    summary: 'Induction cooktops transfer 84% of energy directly to cookware vs. ~40% on open LPG flame.',
    steps: [
      'Use an induction kettle or single-zone induction hob for tea, coffee, and boiling water.',
      'Cover pots with tight-fitting lids to trim cooking duration by up to 30%.',
      'Batch-cook lentils and grains with a pressure cooker twice weekly.',
    ],
  },
  {
    id: 'transit-twice-weekly',
    title: 'Swap 2 Solo Car Commutes Weekly for Metro / Carpool',
    category: 'petrol',
    difficulty: 'Zero Cost',
    annualSavingsKg: 540,
    annualSavingsUsd: 310,
    summary: 'Replacing ~45 km/week of urban petrol driving with metro rail or shared rides slashes tailpipe CO₂e by over 75%.',
    steps: [
      'Identify two recurring mid-week trips within 12 km of a metro or bus corridor.',
      'Maintain tire pressure at manufacturer PSI monthly to save 3–4% on remaining drives.',
      'Combine weekend errands into a single warm-engine loop.',
    ],
  },
  {
    id: 'home-compost',
    title: 'Divert Kitchen Organics into Balcony Aerobic Composting',
    category: 'waste',
    difficulty: 'Low Cost',
    annualSavingsKg: 192,
    annualSavingsUsd: 42,
    summary: 'Diverting wet food scraps prevents anaerobic landfill methane and earns -0.40 kg CO₂e/kg soil carbon credit.',
    steps: [
      'Keep a covered 5L countertop caddy for fruit peels, coffee grounds, and vegetable trimmings.',
      'Layer greens with dry shredded cardboard or cocopeat in a two-tier aerated bin.',
      'Harvest dark nutrient-rich compost every 45 days for balcony or courtyard planters.',
    ],
  },
  {
    id: 'rooftop-solar-3kw',
    title: 'Install 3 kW Grid-Tied Rooftop Solar Array',
    category: 'electricity',
    difficulty: 'Upgrade',
    annualSavingsKg: 2880,
    annualSavingsUsd: 620,
    summary: 'Generates ~360 kWh/month on average, offsetting 65–95% of daytime household grid demand.',
    steps: [
      'Audit south-facing unshaded roof area (~25 m² needed for 3 kW monocrystalline panels).',
      'Apply for residential net-metering approval through your local electricity utility.',
      'Monitor hourly generation vs. evening load to run laundry and dishwashing at solar peak.',
    ],
  },
  {
    id: 'train-short-haul',
    title: 'Replace 1 Short-Haul Flight per Year with High-Speed Rail',
    category: 'airTravel',
    difficulty: 'Zero Cost',
    annualSavingsKg: 260,
    annualSavingsUsd: 95,
    summary: 'Intercity trips under 700 km emit up to 5x less CO₂e per passenger by electric rail than short-haul jet flights.',
    steps: [
      'Check overnight or express rail corridors for regional business or family trips.',
      'Book direct non-stop flights when flying long-haul to avoid high-burn takeoffs.',
      'Bundle multi-city visits into a single itinerary.',
    ],
  },
  {
    id: 'aerators-cold-wash',
    title: 'Fit Low-Flow Tap Aerators & Wash Laundry Cold',
    category: 'water',
    difficulty: 'Low Cost',
    annualSavingsKg: 148,
    annualSavingsUsd: 88,
    summary: '90% of washing machine electricity goes to heating water; 30°C cycles plus 4 L/min aerators save both water and kWh.',
    steps: [
      'Screw 4 L/min laminar aerators onto kitchen and bathroom faucets in under 10 minutes.',
      'Default washing machine cycles to 20°C–30°C cold eco-wash with full drum loads.',
      'Capture RO purifier reject water for floor mopping and garden irrigation.',
    ],
  },
  {
    id: 'vampire-standby',
    title: 'Eliminate Phantom Standby Loads with Smart Power Strips',
    category: 'electricity',
    difficulty: 'Low Cost',
    annualSavingsKg: 195,
    annualSavingsUsd: 72,
    summary: 'Set-top boxes, gaming consoles, desktop monitors, and chargers draw 7–11% of total residential electricity while idle.',
    steps: [
      'Group entertainment center and home-office peripherals onto master-controlled power strips.',
      'Enable automatic laptop/desktop hibernation after 15 minutes of inactivity.',
      'Swap remaining halogen or CFL bulbs for 9W warm-white LEDs.',
    ],
  },
];

export const DAILY_HABITS: HabitItem[] = [
  { id: 'ac-eco', label: 'Keep AC at 24°C+ & open cross-ventilation', impactKgDay: 1.4, stream: 'electricity' },
  { id: 'unplug-standby', label: 'Switch off standby plugs before sleep', impactKgDay: 0.6, stream: 'electricity' },
  { id: 'green-commute', label: 'Walk, cycle, or take transit for errands', impactKgDay: 2.1, stream: 'petrol' },
  { id: 'compost-scraps', label: 'Separate kitchen organics for compost bin', impactKgDay: 0.5, stream: 'waste' },
  { id: 'cold-laundry', label: 'Run cold-water full-load laundry wash', impactKgDay: 0.8, stream: 'water' },
  { id: 'lid-cooking', label: 'Use pressure lid & batch cooking on stove', impactKgDay: 0.4, stream: 'lpg' },
];

export function buildSeedAudits(uid: string, regionId: RegionId = 'IN'): CarbonAudit[] {
  const baseMonths: Array<{
    month: string;
    label: string;
    solarOffsetPct: number;
    members: number;
    inputs: ActivityInputs;
    notes: string;
  }> = [
    {
      month: '2026-06',
      label: 'June 2026',
      solarOffsetPct: 10,
      members: 3,
      inputs: {
        electricityKwh: 410,
        lpgKg: 16.5,
        petrolL: 58,
        dieselL: 10,
        airTravelKm: 620,
        pngM3: 15,
        waterM3: 22,
        wasteKg: 42,
        compostKg: 4,
        evKm: 0,
        motorcycleKm: 80,
        transitKm: 60,
        biomassKg: 0,
      },
      notes: 'Summer cooling peak with regional short-haul flight.',
    },
    {
      month: '2026-07',
      label: 'July 2026',
      solarOffsetPct: 15,
      members: 3,
      inputs: {
        electricityKwh: 385,
        lpgKg: 15.8,
        petrolL: 52,
        dieselL: 8,
        airTravelKm: 0,
        pngM3: 14,
        waterM3: 20,
        wasteKg: 38,
        compostKg: 8,
        evKm: 40,
        motorcycleKm: 65,
        transitKm: 90,
        biomassKg: 0,
      },
      notes: 'Started home kitchen composting and shifted 1 commute/week to metro.',
    },
    {
      month: '2026-08',
      label: 'August 2026',
      solarOffsetPct: 20,
      members: 3,
      inputs: {
        electricityKwh: 355,
        lpgKg: 14.2,
        petrolL: 46,
        dieselL: 6,
        airTravelKm: 0,
        pngM3: 12,
        waterM3: 19,
        wasteKg: 35,
        compostKg: 11,
        evKm: 80,
        motorcycleKm: 50,
        transitKm: 115,
        biomassKg: 0,
      },
      notes: 'AC set to 24°C baseline; added smart plugs for office desk.',
    },
    {
      month: '2026-09',
      label: 'September 2026',
      solarOffsetPct: 25,
      members: 3,
      inputs: {
        electricityKwh: 328,
        lpgKg: 14.0,
        petrolL: 39,
        dieselL: 4,
        airTravelKm: 410,
        pngM3: 11,
        waterM3: 18,
        wasteKg: 32,
        compostKg: 13,
        evKm: 110,
        motorcycleKm: 45,
        transitKm: 130,
        biomassKg: 0,
      },
      notes: 'Family rail-plus-flight autumn trip; strong solar generation.',
    },
    {
      month: '2026-10',
      label: 'October 2026',
      solarOffsetPct: 30,
      members: 3,
      inputs: {
        electricityKwh: 295,
        lpgKg: 12.8,
        petrolL: 34,
        dieselL: 0,
        airTravelKm: 0,
        pngM3: 10,
        waterM3: 16,
        wasteKg: 29,
        compostKg: 15,
        evKm: 145,
        motorcycleKm: 35,
        transitKm: 160,
        biomassKg: 0,
      },
      notes: 'Festival month — zero diesel deliveries and 30% rooftop solar offset.',
    },
    {
      month: '2026-11',
      label: 'November 2026',
      solarOffsetPct: 35,
      members: 3,
      inputs: {
        electricityKwh: 268,
        lpgKg: 11.9,
        petrolL: 28,
        dieselL: 0,
        airTravelKm: 0,
        pngM3: 9,
        waterM3: 15,
        wasteKg: 26,
        compostKg: 16,
        evKm: 170,
        motorcycleKm: 25,
        transitKm: 190,
        biomassKg: 0,
      },
      notes: 'Active billing cycle tracking well below regional average.',
    },
  ];

  return baseMonths.map((item) => {
    const calc = computeAuditBreakdown(item.inputs, regionId, item.members, item.solarOffsetPct);
    const ts = `${item.month}-15T10:00:00.000Z`;
    return {
      id: `audit_${item.month.replace('-', '_')}`,
      uid,
      month: item.month,
      label: item.label,
      regionId,
      members: item.members,
      solarOffsetPct: item.solarOffsetPct,
      ...item.inputs,
      totalKgCo2e: calc.totalKgCo2e,
      notes: item.notes,
      createdAtIso: ts,
      updatedAtIso: ts,
    };
  });
}

export function buildEmptyAudit(
  uid: string,
  regionId: RegionId = 'IN',
  members = 3,
  solarOffsetPct = 0
): CarbonAudit {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const nowIso = now.toISOString();
  return {
    id: `audit_${month.replace('-', '_')}`,
    uid,
    month,
    label,
    regionId,
    members: Math.max(1, members),
    solarOffsetPct: Math.min(100, Math.max(0, solarOffsetPct)),
    electricityKwh: 0,
    lpgKg: 0,
    petrolL: 0,
    dieselL: 0,
    airTravelKm: 0,
    pngM3: 0,
    waterM3: 0,
    wasteKg: 0,
    compostKg: 0,
    evKm: 0,
    motorcycleKm: 0,
    transitKm: 0,
    biomassKg: 0,
    heatPumpKwh: 0,
    totalKgCo2e: 0,
    notes: '',
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}


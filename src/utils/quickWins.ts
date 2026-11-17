import { ActivityStreamKey, EmissionCategoryKey } from './calculations';

export type CostTier = 'Zero Cost' | 'Low Cost';
export type EffortTier = 'Instant Tweak' | 'Habit';

export interface QuickWinAction {
  id: string;
  title: string;
  stream: ActivityStreamKey;
  category: EmissionCategoryKey;
  costTier: CostTier;
  effortTier: EffortTier;
  categorySavingPercent: number;
  monthlyKgSaved: number;
  monthlyUsdSaved: number;
  monthlyCostSavedInr: number;
  annualTreesEquivalent: number;
  climateContext: string;
  settlementContext: string;
  mechanism: string;
  verificationMetric: string;
  steps: [string, string, string];
}

function treesEq(monthlyKg: number): number {
  return Number(((monthlyKg * 12) / 22).toFixed(1));
}

export const QUICK_WINS_CATALOG: QuickWinAction[] = [
  // 1. Electricity
  {
    id: 'elec-thermostat-setpoint',
    title: 'Set AC to 24°C + Pair with Ceiling Fan → Saves ~20% Cooling Electricity',
    stream: 'electricity',
    category: 'electricity',
    costTier: 'Zero Cost',
    effortTier: 'Instant Tweak',
    categorySavingPercent: 20,
    monthlyKgSaved: 42.5,
    monthlyUsdSaved: 18.0,
    monthlyCostSavedInr: 1500,
    annualTreesEquivalent: treesEq(42.5),
    climateContext: 'Tropical, Arid & Continental Grids',
    settlementContext: 'Urban & Suburban Homes',
    mechanism:
      'Setting cooling to 24–26°C paired with a 25W ceiling fan creates a 3°C wind-chill effect and trims compressor duty cycles by ~20%.',
    verificationMetric: '-95 kWh/mo grid draw (~20% cooling reduction)',
    steps: [
      'Set all room AC units to 24°C or 25°C default temperature.',
      'Run the ceiling fan on speed 2 to circulate cool air evenly.',
      'Clean the AC mesh filter every 14 days to prevent airflow throttling.',
    ],
  },
  {
    id: 'elec-phantom-load',
    title: 'Eliminate Phantom Standby Loads (Switch Off at Plug) → Saves ~8%',
    stream: 'electricity',
    category: 'electricity',
    costTier: 'Zero Cost',
    effortTier: 'Habit',
    categorySavingPercent: 8,
    monthlyKgSaved: 19.8,
    monthlyUsdSaved: 9.5,
    monthlyCostSavedInr: 790,
    annualTreesEquivalent: treesEq(19.8),
    climateContext: 'Universal Global Grids',
    settlementContext: 'All Household Types',
    mechanism:
      'Disconnecting idle TVs, entertainment consoles, microwaves, and chargers removes continuous 35–65W vampire power draw across 24-hour cycles.',
    verificationMetric: '-45 kWh/mo continuous load (~8% electricity saved)',
    steps: [
      'Group TV, set-top box, and speakers onto a single master switch strip.',
      'Switch off microwave, water purifier display, and laptop bricks overnight.',
      'Unplug phone chargers once batteries reach 100%.',
    ],
  },
  {
    id: 'elec-led-transition',
    title: 'Switch All Bulbs to LED + Use Natural Daylight → Saves ~12%',
    stream: 'electricity',
    category: 'electricity',
    costTier: 'Low Cost',
    effortTier: 'Instant Tweak',
    categorySavingPercent: 12,
    monthlyKgSaved: 26.4,
    monthlyUsdSaved: 11.2,
    monthlyCostSavedInr: 935,
    annualTreesEquivalent: treesEq(26.4),
    climateContext: 'Universal Global Grids',
    settlementContext: 'Urban, Suburban & Rural',
    mechanism:
      'Replacing remaining fluorescent tube lights or halogens with 9W high-efficacy LEDs cuts lighting electricity consumption by up to 75%.',
    verificationMetric: '-60 kWh/mo lighting load (~12% total electricity)',
    steps: [
      'Replace legacy 40W tube lights with 9W–18W 5-star LED battens.',
      'Open curtains and blinds during 08:00–17:00 for natural task lighting.',
      'Install motion sensors in corridors, balconies, and washrooms.',
    ],
  },

  // 2. Cooking Gas (LPG)
  {
    id: 'cook-pressure-lid',
    title: 'Use Pressure Cooker for Dal/Rice + Always Cook with Lids On → Saves ~25% LPG',
    stream: 'cookingGas',
    category: 'cookingHeating',
    costTier: 'Zero Cost',
    effortTier: 'Habit',
    categorySavingPercent: 25,
    monthlyKgSaved: 16.5,
    monthlyUsdSaved: 8.5,
    monthlyCostSavedInr: 710,
    annualTreesEquivalent: treesEq(16.5),
    climateContext: 'Universal Global',
    settlementContext: 'LPG & PNG Kitchens',
    mechanism:
      'Cooking grains and legumes under sealed steam pressure reduces burner runtime by 50–70% while lid-on simmering prevents latent heat escape.',
    verificationMetric: '-5.5 kg LPG/mo (~25% cylinder extension)',
    steps: [
      'Pre-soak rice, dal, and chickpeas for 30 minutes before cooking.',
      'Always place a tight-fitting lid on pans and kadhais while simmering.',
      'Drop flame to simmer once the pressure cooker reaches full steam.',
    ],
  },
  {
    id: 'cook-burner-maintenance',
    title: 'Regular Burner Maintenance + Blue Flame Calibration → Saves ~10% LPG',
    stream: 'cookingGas',
    category: 'cookingHeating',
    costTier: 'Zero Cost',
    effortTier: 'Instant Tweak',
    categorySavingPercent: 10,
    monthlyKgSaved: 11.2,
    monthlyUsdSaved: 5.8,
    monthlyCostSavedInr: 485,
    annualTreesEquivalent: treesEq(11.2),
    climateContext: 'Universal Global',
    settlementContext: 'All Household Types',
    mechanism:
      'Clearing clogged gas ports restores stoichiometric blue-flame combustion instead of soot-producing yellow flames, boosting thermal transfer by 10–15%.',
    verificationMetric: '+10% thermal fuel efficiency',
    steps: [
      'Clean brass burner jets monthly with warm water and a soft brush.',
      'Verify flame color is crisp blue rather than yellow/orange.',
      'Use flat-bottomed cookware that matches the burner ring diameter.',
    ],
  },

  // 3. Petrol (Car/Bike)
  {
    id: 'mob-transit-carpool-swap',
    title: 'Replace 2 Car Trips/Week with Public Transit, Cycling, or Walking → Saves ~25%',
    stream: 'petrol',
    category: 'mobility',
    costTier: 'Zero Cost',
    effortTier: 'Habit',
    categorySavingPercent: 25,
    monthlyKgSaved: 64.0,
    monthlyUsdSaved: 38.0,
    monthlyCostSavedInr: 3170,
    annualTreesEquivalent: treesEq(64.0),
    climateContext: 'Universal Global',
    settlementContext: 'Urban & Suburban Corridors',
    mechanism:
      'Replacing 2 solo car round-trips per week (160 km/mo) with metro/bus (0.035 kg/pkm) or cycling avoids ~28 litres of petrol combustion.',
    verificationMetric: '-160 km solo ICE driving/mo (~25% fuel cut)',
    steps: [
      'Designate Tuesday and Thursday as Metro / Bus / Carpool commute days.',
      'Walk or cycle for all neighbourhood errands under 2.5 km.',
      'Batch grocery and school errands into a single warm-engine trip.',
    ],
  },
  {
    id: 'mob-ecodriving-tires',
    title: 'Maintain Tire Pressure at Spec + Smooth Acceleration → Saves ~15% Fuel',
    stream: 'petrol',
    category: 'mobility',
    costTier: 'Zero Cost',
    effortTier: 'Instant Tweak',
    categorySavingPercent: 15,
    monthlyKgSaved: 24.5,
    monthlyUsdSaved: 16.5,
    monthlyCostSavedInr: 1380,
    annualTreesEquivalent: treesEq(24.5),
    climateContext: 'Universal Global',
    settlementContext: 'All Vehicle-Owning Households',
    mechanism:
      'Maintaining manufacturer tire pressure (32–35 PSI) reduces rolling resistance by 4%, while avoiding aggressive acceleration saves 10–15% fuel.',
    verificationMetric: '-10.5 L petrol/mo (~15% mileage improvement)',
    steps: [
      'Check tire pressure every 2 weeks when tires are cold (32–35 PSI).',
      'Shift up early and maintain steady 50–70 km/h cruising speeds.',
      'Switch off ignition at traffic signals longer than 25 seconds.',
    ],
  },

  // 4. Diesel (Car/Generator)
  {
    id: 'diesel-generator-inverter-shift',
    title: 'Shift Backup Power from Diesel Generator to Battery/Solar Inverter → Saves ~30%',
    stream: 'diesel',
    category: 'mobility',
    costTier: 'Low Cost',
    effortTier: 'Instant Tweak',
    categorySavingPercent: 30,
    monthlyKgSaved: 32.0,
    monthlyUsdSaved: 21.0,
    monthlyCostSavedInr: 1750,
    annualTreesEquivalent: treesEq(32.0),
    climateContext: 'Grid-Intermittent Regions',
    settlementContext: 'Apartments, Villas & Row Homes',
    mechanism:
      'Avoiding 12 litres/month of diesel generator runtime (2.68 kg CO₂e/L) and optimizing diesel SUV highway cruise cuts diesel emissions by 30%.',
    verificationMetric: '-12 L diesel/mo (~30% diesel reduction)',
    steps: [
      'Disable heavy AC/geyser loads during power cuts to run on lithium inverter.',
      'Service diesel fuel injectors and air filters every 10,000 km.',
      'Use cruise control on highway segments to prevent turbo boost spikes.',
    ],
  },

  // 5. Air Travel
  {
    id: 'mob-rail-over-shorthaul',
    title: 'Offset 1 Flight/Year with Intercity Rail + Choose Direct Flights → Saves ~20%',
    stream: 'airTravel',
    category: 'mobility',
    costTier: 'Low Cost',
    effortTier: 'Habit',
    categorySavingPercent: 20,
    monthlyKgSaved: 52.0,
    monthlyUsdSaved: 25.0,
    monthlyCostSavedInr: 2085,
    annualTreesEquivalent: treesEq(52.0),
    climateContext: 'Regional Corridors',
    settlementContext: 'All Household Types',
    mechanism:
      'Takeoff and climb consume 25% of short-haul jet fuel; choosing non-stop flights and substituting 1 regional trip with electrified rail slashes aviation CO₂.',
    verificationMetric: '-450 p-km high-altitude RFI aviation/mo',
    steps: [
      'Book non-stop direct flights to eliminate extra takeoff/landing cycles.',
      'Choose Vande Bharat / intercity express rail for journeys under 600 km.',
      'Fly economy class (business class occupies 3× floor space per passenger).',
    ],
  },

  // 6. Piped Natural Gas (PNG)
  {
    id: 'cook-solar-water-preheat',
    title: 'Set Gas Geyser to 45°C & Use Cold-Wash Laundry Cycle → Saves ~30% PNG',
    stream: 'naturalGas',
    category: 'cookingHeating',
    costTier: 'Zero Cost',
    effortTier: 'Habit',
    categorySavingPercent: 30,
    monthlyKgSaved: 28.4,
    monthlyUsdSaved: 13.5,
    monthlyCostSavedInr: 1125,
    annualTreesEquivalent: treesEq(28.4),
    climateContext: 'High-Irradiance & Temperate',
    settlementContext: 'Detached House, Villa & Apartment',
    mechanism:
      'Washing laundry on cold/30°C instead of 60°C and lowering gas geyser thermostat to 45°C cuts domestic PNG consumption by 30%.',
    verificationMetric: '-14 m³ piped natural gas/mo',
    steps: [
      'Dial gas geyser thermostat down from 65°C to 45°C.',
      'Run washing machine on Cold / Eco 30°C cycle for daily clothes.',
      'Insulate exposed hot-water pipes to prevent standing heat loss.',
    ],
  },

  // 7. Water Consumption
  {
    id: 'water-aerator-retrofit',
    title: 'Install Low-Flow Tap Aerators + 5-Minute Shower Timer → Saves ~30% Water',
    stream: 'water',
    category: 'waterWaste',
    costTier: 'Low Cost',
    effortTier: 'Instant Tweak',
    categorySavingPercent: 30,
    monthlyKgSaved: 14.2,
    monthlyUsdSaved: 9.0,
    monthlyCostSavedInr: 750,
    annualTreesEquivalent: treesEq(14.2),
    climateContext: 'Water-Stressed & Municipal Grids',
    settlementContext: 'Urban, Suburban & Rural',
    mechanism:
      'Pressure-compensating aerators mix air into the water stream, cutting municipal water volume and pumping energy by 30–35%.',
    verificationMetric: '-8.5 m³ municipal water/mo (~30% saved)',
    steps: [
      'Screw ₹150 mesh aerators onto kitchen and washbasin faucets.',
      'Fix dripping taps immediately (1 drip/sec = 10,000 litres/year wasted).',
      'Reuse RO water purifier reject water for mopping and balcony plants.',
    ],
  },

  // 8. Household Waste
  {
    id: 'waste-organic-composting',
    title: 'Compost All Kitchen/Wet Waste at Home → Diverts ~60% from Landfill',
    stream: 'waste',
    category: 'waterWaste',
    costTier: 'Low Cost',
    effortTier: 'Habit',
    categorySavingPercent: 60,
    monthlyKgSaved: 22.8,
    monthlyUsdSaved: 4.5,
    monthlyCostSavedInr: 375,
    annualTreesEquivalent: treesEq(22.8),
    climateContext: 'Universal Global',
    settlementContext: 'All Household Types (Bin or Balcony)',
    mechanism:
      'Diverting 25 kg/mo of wet kitchen scraps from anaerobic landfill decomposition prevents methane (CH₄) release and earns a -0.40 kg CO₂e/kg credit.',
    verificationMetric: '25 kg/mo wet waste diverted (~60% landfill cut)',
    steps: [
      'Keep a dedicated green countertop bin for vegetable peels and food scraps.',
      'Layer wet scraps with dry coco-peat or dry leaves in a balcony composter.',
      'Carry reusable cloth bags and refuse single-use plastic packaging.',
    ],
  },
];

export interface DailyTip {
  id: string;
  category: EmissionCategoryKey;
  stream: ActivityStreamKey;
  title: string;
  impactKgPerMonth: number;
  steps: [string, string, string];
}

export const DAILY_CLIMATE_TIPS: DailyTip[] = [
  {
    id: 'tip-elec-1',
    category: 'electricity',
    stream: 'electricity',
    title: 'AC 24°C + Ceiling Fan & Filter Cleanse',
    impactKgPerMonth: 18.4,
    steps: [
      'Clean HVAC / AC mesh filters today to reduce fan motor resistance by 11%.',
      'Set AC to 24°C paired with ceiling fan speed 2 (~20% cooling electricity saved).',
      'Switch off entertainment & microwave standby plugs before sleep.',
    ],
  },
  {
    id: 'tip-cook-1',
    category: 'cookingHeating',
    stream: 'cookingGas',
    title: 'Pressure Cooking & Lid-On Thermal Routine',
    impactKgPerMonth: 14.2,
    steps: [
      'Soak dal, rice, and legumes for 30 minutes prior to pressure cooking.',
      'Match pot base diameter strictly to burner ring size to prevent 25% side heat loss.',
      'Switch off gas or induction burners 2 minutes early using residual pan heat.',
    ],
  },
  {
    id: 'tip-mob-1',
    category: 'mobility',
    stream: 'petrol',
    title: 'Tire Pressure & Zero-Idling Commute Protocol',
    impactKgPerMonth: 26.8,
    steps: [
      'Turn off vehicle ignition whenever stationary for more than 20 seconds.',
      'Chain errands into a single warm-engine loop rather than separate cold starts.',
      'Verify tires are inflated to manufacturer spec (32–35 PSI) for +15% fuel economy.',
    ],
  },
  {
    id: 'tip-waste-1',
    category: 'waterWaste',
    stream: 'waste',
    title: 'Wet Kitchen Composting & Cold-Water Rinse',
    impactKgPerMonth: 12.5,
    steps: [
      'Separate wet organic peelings into an aerated compost bin after meal prep.',
      'Switch tap lever to full-cold position for short handwashes to prevent geyser ignition.',
      'Carry reusable cloth bags to eliminate single-use packaging waste today.',
    ],
  },
];

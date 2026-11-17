import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, FileCheck } from 'lucide-react';
import { REGION_GRID_PRESETS } from '../utils/calculations';

export const AboutMethodologyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="text-xs text-gray-500">
              Scientific Accounting Standard · IPCC 2006 · GHG Protocol · IEA · DEFRA · EPA eGRID
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Global Methodology, Deterministic Emission Factors & Paris 1.5°C Pathway
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every figure calculated on TerraLedger uses transparent, deterministic physical
              conversion factors with zero black-box approximations. All inputs are stored
              canonically in SI metric units and converted losslessly to Imperial / US Customary
              units on demand.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/calculator')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Calculator className="w-4 h-4" />
              Launch Calculator
            </button>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileCheck className="w-4 h-4" />
              View Audit Certificate
            </button>
          </div>
        </div>
      </section>

      {/* Core Mathematical Formulation */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="text-xs text-gray-500">01. Core Governing Equation</div>
          <h2 className="text-lg font-semibold text-gray-900">
            Deterministic Monthly Household Footprint
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Total monthly household greenhouse gas emissions (<span className="font-mono">E_total</span>,
            measured in <span className="font-mono">kg CO₂e</span>) are computed as the sum of four
            mutually exclusive domestic activity streams:
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-xs text-gray-800 space-y-2">
            <div>E_total = E_electricity + E_cooking_heating + E_mobility + E_water_waste</div>
            <div>E_per_capita = E_total / N_household_members</div>
            <div>E_electricity = max(0, kWh_grid - kWh_solar_export) × EF_regional_grid × (1 - Solar_Offset_%)</div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Where <span className="font-mono">EF_regional_grid</span> defaults to the selected
            country/regional grid preset (or user-defined custom utility factor) and rooftop solar
            net metering is credited at <span className="font-mono">0.00 kg CO₂e / kWh</span>.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="text-xs text-gray-500">02. Paris Agreement 1.5°C Benchmark</div>
          <h2 className="text-lg font-semibold text-gray-900">
            Per-Capita Carbon Budget & Fair-Share Allocation
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            According to UNEP Emissions Gap Reports and IPCC AR6 Working Group III pathways,
            limiting global warming to 1.5°C requires global per-capita lifestyle emissions to
            converge toward <strong className="text-gray-900">2.0 tonnes CO₂e / person / year</strong>{' '}
            (<strong className="font-mono text-emerald-700">170 kg CO₂e / person / month</strong>) by
            2030.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500">Electricity Allocation (35%)</div>
              <div className="font-mono tabular-nums text-sm font-bold text-gray-900 mt-0.5">
                59.5 kg / person / mo
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500">Cooking & Heating (25%)</div>
              <div className="font-mono tabular-nums text-sm font-bold text-gray-900 mt-0.5">
                42.5 kg / person / mo
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500">Mobility Allocation (30%)</div>
              <div className="font-mono tabular-nums text-sm font-bold text-gray-900 mt-0.5">
                51.0 kg / person / mo
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-500">Water & Waste (10%)</div>
              <div className="font-mono tabular-nums text-sm font-bold text-gray-900 mt-0.5">
                17.0 kg / person / mo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Activity Stream Reference Table */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="pb-4 border-b border-gray-200">
          <div className="text-xs text-gray-500 mb-1">
            Deterministic Emission Coefficients · Urban, Suburban, Rural & Off-Grid
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Activity Stream Emission Factors (Metric & Imperial Equivalents)
          </h2>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-3 px-3 font-medium">Category</th>
                <th className="py-3 px-3 font-medium">Activity / Fuel Stream</th>
                <th className="py-3 px-3 font-medium text-right">Metric Factor</th>
                <th className="py-3 px-3 font-medium text-right">Imperial / Customary Equivalent</th>
                <th className="py-3 px-3 font-medium">Primary Reference Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Electricity</td>
                <td className="py-3 px-3 text-gray-700">Regional Grid Electricity</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.05 – 0.82 kg / kWh</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.11 – 1.81 lbs / kWh</td>
                <td className="py-3 px-3 text-gray-500">IEA / EPA eGRID / CEA / EEA / DEFRA</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Electricity</td>
                <td className="py-3 px-3 text-gray-700">Rooftop Solar Net Metering</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.00 kg / kWh</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.00 lbs / kWh</td>
                <td className="py-3 px-3 text-gray-500">GHG Protocol Scope 2 Market/Net</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Cooking & Heating</td>
                <td className="py-3 px-3 text-gray-700">Cooking LPG (Liquefied Petroleum Gas)</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">2.98 kg / kg</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">2.98 lbs / lb</td>
                <td className="py-3 px-3 text-gray-500">IPCC 2006 Stationary Combustion</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Cooking & Heating</td>
                <td className="py-3 px-3 text-gray-700">Piped Natural Gas (PNG)</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">2.02 kg / m³</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">5.30 kg / therm (11.68 lbs/therm)</td>
                <td className="py-3 px-3 text-gray-500">EPA / DEFRA Natural Gas Factor</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Cooking & Heating</td>
                <td className="py-3 px-3 text-gray-700">Heating Oil / Domestic Kerosene</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">2.54 kg / litre</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">21.19 lbs / US gal</td>
                <td className="py-3 px-3 text-gray-500">IPCC 2006 Residential Distillate</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Cooking & Heating</td>
                <td className="py-3 px-3 text-gray-700">Traditional Biomass / Firewood / Charcoal</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">1.75 kg / kg</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">1.75 lbs / lb</td>
                <td className="py-3 px-3 text-gray-500">IPCC Non-Sustainable Harvest Factor</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Transport & Mobility</td>
                <td className="py-3 px-3 text-gray-700">Petrol / Gasoline (Passenger Car)</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">2.31 kg / litre</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">8.78 kg / gal (19.36 lbs/gal)</td>
                <td className="py-3 px-3 text-gray-500">EPA / DEFRA Motor Gasoline</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Transport & Mobility</td>
                <td className="py-3 px-3 text-gray-700">Diesel (Passenger Vehicle / Van)</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">2.68 kg / litre</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">10.18 kg / gal (22.44 lbs/gal)</td>
                <td className="py-3 px-3 text-gray-500">EPA / DEFRA Road Diesel</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Transport & Mobility</td>
                <td className="py-3 px-3 text-gray-700">Battery Electric Vehicle (EV)</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.18 kWh / km × Grid EF</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.29 kWh / mile × Grid EF</td>
                <td className="py-3 px-3 text-gray-500">IEA Global EV Fleet Mean Consumption</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Transport & Mobility</td>
                <td className="py-3 px-3 text-gray-700">Two-Wheeler / Motorcycle</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.075 kg / pkm</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.266 lbs / passenger-mile</td>
                <td className="py-3 px-3 text-gray-500">DEFRA / India WRI Two-Wheeler Mean</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Transport & Mobility</td>
                <td className="py-3 px-3 text-gray-700">Public Transit (Bus / Train / Metro)</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.035 kg / pkm</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.124 lbs / passenger-mile</td>
                <td className="py-3 px-3 text-gray-500">IEA Urban Rail & Bus Weighted Mean</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Transport & Mobility</td>
                <td className="py-3 px-3 text-gray-700">Aviation (Domestic & Long-Haul)</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.115 kg / pkm</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.408 lbs / passenger-mile</td>
                <td className="py-3 px-3 text-gray-500">ICAO Carbon Calculator + RFI Multiplier</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Water & Waste</td>
                <td className="py-3 px-3 text-gray-700">Municipal Tap Water Supply & Treatment</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.344 kg / m³</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">0.00287 lbs / US gal</td>
                <td className="py-3 px-3 text-gray-500">DEFRA Water Supply & Wastewater</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-gray-900">Water & Waste</td>
                <td className="py-3 px-3 text-gray-700">Solid Municipal Waste vs Composting Credit</td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  +0.52 kg / kg (-0.40 credit)
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  +0.52 lbs / lb (-0.40 credit)
                </td>
                <td className="py-3 px-3 text-gray-500">IPCC Solid Waste Disposal & Diversion</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Regional Grid Authorities */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Regional Grid Factor Citations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGION_GRID_PRESETS.map((r) => (
            <div key={r.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">{r.name}</span>
                <span className="font-mono tabular-nums text-xs font-bold text-emerald-700">
                  {r.factorKgPerKwh} kg CO₂e/kWh
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{r.authority}</div>
              <div className="text-xs text-gray-600 mt-2 font-mono tabular-nums">
                National Baseline: {r.nationalMonthlyPerCapitaKg} kg / person / mo
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

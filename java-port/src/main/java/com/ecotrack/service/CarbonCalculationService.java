package com.ecotrack.service;

import com.ecotrack.model.CarbonModels.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CarbonCalculationService {

    public static final double PARIS_TARGET_PER_PERSON_KG = 167.0;
    public static final double TREE_ABSORPTION_KG_PER_YEAR = 22.0;

    private static final double LPG_FACTOR = 2.98;
    private static final double PETROL_FACTOR = 2.31;
    private static final double DIESEL_FACTOR = 2.68;
    private static final double AIR_FACTOR = 0.115;
    private static final double PNG_FACTOR = 2.02;
    private static final double WATER_FACTOR = 0.344;
    private static final double WASTE_FACTOR = 0.52;
    private static final double COMPOST_CREDIT = 0.40;
    private static final double EV_KWH_PER_KM = 0.16;
    private static final double MOTORCYCLE_FACTOR = 0.084;
    private static final double TRANSIT_FACTOR = 0.041;
    private static final double BIOMASS_FACTOR = 0.12;
    private static final double HEAT_PUMP_COP = 2.8;

    public AuditComputationResult compute(
            ActivityInputs inputs,
            RegionId regionId,
            int members,
            double solarOffsetPct,
            UnitSystem unitSystem
    ) {
        int safeMembers = Math.max(1, members);
        double safeSolar = Math.min(100.0, Math.max(0.0, solarOffsetPct));
        double gridFactor = regionId.gridKgPerKwh;

        double grossElecKg = Math.max(0.0, inputs.electricityKwh()) * gridFactor;
        double netElecKg = grossElecKg * (1.0 - safeSolar / 100.0);
        double heatPumpKg = Math.max(0.0, inputs.heatPumpKwh()) * (gridFactor / HEAT_PUMP_COP);
        double evKg = Math.max(0.0, inputs.evKm()) * EV_KWH_PER_KM * gridFactor * (1.0 - safeSolar / 200.0);
        double electricityTotalKg = netElecKg + heatPumpKg + evKg;
        double solarSavedKg = grossElecKg - netElecKg;

        double lpgKg = Math.max(0.0, inputs.lpgKg()) * LPG_FACTOR
                + Math.max(0.0, inputs.biomassKg()) * BIOMASS_FACTOR;
        double petrolKg = Math.max(0.0, inputs.petrolL()) * PETROL_FACTOR
                + Math.max(0.0, inputs.motorcycleKm()) * MOTORCYCLE_FACTOR;
        double dieselKg = Math.max(0.0, inputs.dieselL()) * DIESEL_FACTOR
                + Math.max(0.0, inputs.transitKm()) * TRANSIT_FACTOR;
        double airKg = Math.max(0.0, inputs.airTravelKm()) * AIR_FACTOR;
        double pngKg = Math.max(0.0, inputs.pngM3()) * PNG_FACTOR;
        double waterKg = Math.max(0.0, inputs.waterM3()) * WATER_FACTOR;

        double grossWaste = Math.max(0.0, inputs.wasteKg()) * WASTE_FACTOR;
        double compostCredit = Math.max(0.0, inputs.compostKg()) * COMPOST_CREDIT;
        double wasteKg = Math.max(0.0, grossWaste - compostCredit);
        double compostSavedKg = Math.min(grossWaste, compostCredit);

        Map<StreamKey, Double> streamKg = new EnumMap<>(StreamKey.class);
        streamKg.put(StreamKey.ELECTRICITY, electricityTotalKg);
        streamKg.put(StreamKey.LPG, lpgKg);
        streamKg.put(StreamKey.PETROL, petrolKg);
        streamKg.put(StreamKey.DIESEL, dieselKg);
        streamKg.put(StreamKey.AIR_TRAVEL, airKg);
        streamKg.put(StreamKey.PNG, pngKg);
        streamKg.put(StreamKey.WATER, waterKg);
        streamKg.put(StreamKey.WASTE, wasteKg);

        Map<StreamKey, String> rawDisplays = new EnumMap<>(StreamKey.class);
        rawDisplays.put(StreamKey.ELECTRICITY, Math.round(inputs.electricityKwh()) + " kWh");
        rawDisplays.put(StreamKey.LPG, formatVal(inputs.lpgKg(), "kg", "lbs", 2.20462, unitSystem));
        rawDisplays.put(StreamKey.PETROL, formatVal(inputs.petrolL(), "L", "gal", 0.264172, unitSystem));
        rawDisplays.put(StreamKey.DIESEL, formatVal(inputs.dieselL(), "L", "gal", 0.264172, unitSystem));
        rawDisplays.put(StreamKey.AIR_TRAVEL, formatVal(inputs.airTravelKm(), "km", "mi", 0.621371, unitSystem));
        rawDisplays.put(StreamKey.PNG, formatVal(inputs.pngM3(), "m³", "ft³", 35.3147, unitSystem));
        rawDisplays.put(StreamKey.WATER, formatVal(inputs.waterM3(), "m³", "gal", 264.172, unitSystem));
        rawDisplays.put(StreamKey.WASTE, formatVal(inputs.wasteKg(), "kg", "lbs", 2.20462, unitSystem));

        double total = streamKg.values().stream().mapToDouble(Double::doubleValue).sum();

        List<StreamBreakdownItem> items = new ArrayList<>();
        for (StreamKey key : StreamKey.values()) {
            double kg = round1(streamKg.get(key));
            double share = total > 0 ? round1((kg / total) * 100.0) : 0.0;
            items.add(new StreamBreakdownItem(
                    key.name(),
                    key.label,
                    key.emoji,
                    key.color,
                    kg,
                    share,
                    rawDisplays.get(key)
            ));
        }

        StreamBreakdownItem peak = items.stream()
                .max(Comparator.comparingDouble(StreamBreakdownItem::kgCo2e))
                .orElse(items.get(0));

        double perPerson = total / safeMembers;
        double parisTotal = PARIS_TARGET_PER_PERSON_KG * safeMembers;
        double vsParis = ((perPerson - PARIS_TARGET_PER_PERSON_KG) / PARIS_TARGET_PER_PERSON_KG) * 100.0;
        double vsRegional = ((perPerson - regionId.avgPerPersonMonthlyKg) / regionId.avgPerPersonMonthlyKg) * 100.0;
        int trees = (int) Math.ceil((total * 12.0) / TREE_ABSORPTION_KG_PER_YEAR);

        return new AuditComputationResult(
                round1(total),
                round1(perPerson),
                parisTotal,
                PARIS_TARGET_PER_PERSON_KG,
                round1(vsParis),
                round1(vsRegional),
                trees,
                round1(solarSavedKg),
                round1(compostSavedKg),
                peak,
                items
        );
    }

    public List<CarbonAudit> buildSeedAudits(String uid, RegionId regionId) {
        List<CarbonAudit> list = new ArrayList<>();
        record SeedSpec(String month, String label, double solar, ActivityInputs inputs, String notes) {}
        List<SeedSpec> specs = List.of(
                new SeedSpec("2026-06", "June 2026", 10, new ActivityInputs(410, 16.5, 58, 10, 620, 15, 22, 42, 4, 0, 80, 60, 0, 0), "Summer cooling peak with short-haul flight."),
                new SeedSpec("2026-07", "July 2026", 15, new ActivityInputs(385, 15.8, 52, 8, 0, 14, 20, 38, 8, 40, 65, 90, 0, 0), "Started kitchen composting and weekly metro commute."),
                new SeedSpec("2026-08", "August 2026", 20, new ActivityInputs(355, 14.2, 46, 6, 0, 12, 19, 35, 11, 80, 50, 115, 0, 0), "AC set to 24C baseline; added smart plugs."),
                new SeedSpec("2026-09", "September 2026", 25, new ActivityInputs(328, 14.0, 39, 4, 410, 11, 18, 32, 13, 110, 45, 130, 0, 0), "Autumn travel cycle with strong solar offset."),
                new SeedSpec("2026-10", "October 2026", 30, new ActivityInputs(295, 12.8, 34, 0, 0, 10, 16, 29, 15, 145, 35, 160, 0, 0), "Zero diesel deliveries and 30% solar generation."),
                new SeedSpec("2026-11", "November 2026", 35, new ActivityInputs(268, 11.9, 28, 0, 0, 9, 15, 26, 16, 170, 25, 190, 0, 0), "Active billing cycle tracking below regional average.")
        );

        for (SeedSpec s : specs) {
            AuditComputationResult res = compute(s.inputs(), regionId, 3, s.solar(), UnitSystem.METRIC);
            list.add(new CarbonAudit(
                    "audit_" + s.month().replace("-", "_"),
                    uid,
                    s.month(),
                    s.label(),
                    regionId,
                    3,
                    s.solar(),
                    s.inputs(),
                    res.totalKgCo2e(),
                    s.notes()
            ));
        }
        return list;
    }

    public List<QuickWinAction> getQuickWinsCatalog() {
        return List.of(
                new QuickWinAction("ac-24c", "Raise AC Thermostat by 2°C & Enable Eco Timer", "ELECTRICITY", "Zero Cost", 420, 165,
                        "Setting split ACs to 24-25°C cuts compressor draw by 18-24%.",
                        List.of("Set split units to 24°C with ceiling fans on low.", "Clean mesh dust filters every 30 days.", "Schedule 2:00 AM auto-sleep ramp.")),
                new QuickWinAction("induction-lpg", "Shift Morning Boiling & Simmering to Induction", "LPG", "Low Cost", 185, 78,
                        "Induction cooktops transfer 84% of energy directly to cookware.",
                        List.of("Use induction hob for tea, coffee, and boiling water.", "Cover pots with tight lids.", "Batch-cook with a pressure cooker.")),
                new QuickWinAction("transit-twice-weekly", "Swap 2 Solo Car Commutes Weekly for Metro / Carpool", "PETROL", "Zero Cost", 540, 310,
                        "Replacing 45 km/week of petrol driving slashes tailpipe CO2e by >75%.",
                        List.of("Pick two recurring trips near metro corridors.", "Keep tires inflated to manufacturer PSI.", "Combine errands into one warm-engine loop.")),
                new QuickWinAction("home-compost", "Divert Kitchen Organics into Balcony Composting", "WASTE", "Low Cost", 192, 42,
                        "Prevents landfill methane and earns -0.40 kg CO2e/kg soil carbon credit.",
                        List.of("Keep a 5L countertop caddy for food scraps.", "Layer greens with dry cardboard or cocopeat.", "Harvest compost every 45 days.")),
                new QuickWinAction("rooftop-solar-3kw", "Install 3 kW Grid-Tied Rooftop Solar Array", "ELECTRICITY", "Upgrade", 2880, 620,
                        "Generates ~360 kWh/month, offsetting 65-95% of daytime grid load.",
                        List.of("Audit south-facing roof area (~25 m2).", "Apply for utility net-metering.", "Run heavy appliances during peak sun."))
        );
    }

    private static String formatVal(double metric, String mUnit, String iUnit, double mult, UnitSystem sys) {
        if (sys == UnitSystem.METRIC) {
            return String.format(Locale.US, "%.1f %s", metric, mUnit);
        }
        return String.format(Locale.US, "%.1f %s", metric * mult, iUnit);
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}

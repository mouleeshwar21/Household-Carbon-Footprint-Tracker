package com.ecotrack.model;

import java.util.List;

public final class CarbonModels {

    public enum ThemeId {
        BOTANICAL_SAGE("botanical-sage", "Botanical Sage", "light"),
        EMERALD_OBSIDIAN("emerald-obsidian", "Emerald Obsidian", "dark"),
        V22_BLUE_WHITE("v22-blue-white", "V22 Blue & White", "light"),
        MIDNIGHT_AURORA("midnight-aurora", "Midnight Aurora", "dark"),
        WARM_ALABASTER("warm-alabaster", "Warm Alabaster", "light"),
        NORDIC_FROST("nordic-frost", "Nordic Frost", "light");

        public final String id;
        public final String label;
        public final String mode;

        ThemeId(String id, String label, String mode) {
            this.id = id;
            this.label = label;
            this.mode = mode;
        }
    }

    public enum UnitSystem {
        METRIC, IMPERIAL
    }

    public enum RegionId {
        IN("India (CEA Grid)", "India", 0.82, 195.0, "INR", "CEA CO2 Baseline v19"),
        GLOBAL("Global Average", "Global", 0.475, 390.0, "USD", "IEA World Energy Outlook"),
        US("United States (eGRID)", "USA", 0.386, 1180.0, "USD", "US EPA eGRID"),
        EU("European Union", "EU-27", 0.256, 520.0, "EUR", "EEA Carbon Intensity"),
        UK("United Kingdom", "UK", 0.207, 440.0, "GBP", "UK DESNZ / DEFRA"),
        FR("France (Nuclear + Renewables)", "France", 0.056, 380.0, "EUR", "RTE France"),
        BR_NO("Brazil / Norway (Hydro)", "Hydro Grid", 0.072, 240.0, "BRL", "IEA Hydro Benchmark"),
        AU("Australia", "Australia", 0.656, 1220.0, "USD", "DCCEEW Australia"),
        AFR("East / West Africa", "Africa", 0.490, 110.0, "KES", "IRENA Regional Factors");

        public final String fullName;
        public final String shortName;
        public final double gridKgPerKwh;
        public final double avgPerPersonMonthlyKg;
        public final String defaultCurrency;
        public final String sourceLabel;

        RegionId(String fullName, String shortName, double gridKgPerKwh,
                 double avgPerPersonMonthlyKg, String defaultCurrency, String sourceLabel) {
            this.fullName = fullName;
            this.shortName = shortName;
            this.gridKgPerKwh = gridKgPerKwh;
            this.avgPerPersonMonthlyKg = avgPerPersonMonthlyKg;
            this.defaultCurrency = defaultCurrency;
            this.sourceLabel = sourceLabel;
        }
    }

    public enum CurrencyCode {
        INR("₹", 84.0),
        USD("$", 1.0),
        EUR("€", 0.92),
        GBP("£", 0.79),
        JPY("¥", 154.0),
        BRL("R$", 5.75),
        KES("KSh", 129.0),
        NGN("₦", 1650.0);

        public final String symbol;
        public final double rateFromUsd;

        CurrencyCode(String symbol, double rateFromUsd) {
            this.symbol = symbol;
            this.rateFromUsd = rateFromUsd;
        }
    }

    public enum StreamKey {
        ELECTRICITY("Electricity", "⚡", "#F59E0B", "kWh", "kWh"),
        LPG("Cooking Gas / LPG", "🔥", "#EF4444", "kg", "lbs"),
        PETROL("Petrol", "⛽", "#8B5CF6", "L", "gal"),
        DIESEL("Diesel", "🚛", "#6366F1", "L", "gal"),
        AIR_TRAVEL("Air Travel", "✈️", "#06B6D4", "km", "mi"),
        PNG("Piped Natural Gas", "🔶", "#F97316", "m³", "ft³"),
        WATER("Water", "💧", "#3B82F6", "m³", "gal"),
        WASTE("Household Waste", "♻️", "#84CC16", "kg", "lbs");

        public final String label;
        public final String emoji;
        public final String color;
        public final String metricUnit;
        public final String imperialUnit;

        StreamKey(String label, String emoji, String color, String metricUnit, String imperialUnit) {
            this.label = label;
            this.emoji = emoji;
            this.color = color;
            this.metricUnit = metricUnit;
            this.imperialUnit = imperialUnit;
        }
    }

    public record ActivityInputs(
            double electricityKwh,
            double lpgKg,
            double petrolL,
            double dieselL,
            double airTravelKm,
            double pngM3,
            double waterM3,
            double wasteKg,
            double compostKg,
            double evKm,
            double motorcycleKm,
            double transitKm,
            double biomassKg,
            double heatPumpKwh
    ) {}

    public record HouseholdProfile(
            String uid,
            String householdName,
            int members,
            RegionId regionId,
            CurrencyCode currency,
            UnitSystem unitSystem,
            String theme,
            double solarOffsetPct,
            double monthlyTargetKg
    ) {}

    public record CarbonAudit(
            String id,
            String uid,
            String month,
            String label,
            RegionId regionId,
            int members,
            double solarOffsetPct,
            ActivityInputs inputs,
            double totalKgCo2e,
            String notes
    ) {}

    public record StreamBreakdownItem(
            String key,
            String label,
            String emoji,
            String color,
            double kgCo2e,
            double sharePct,
            String rawDisplay
    ) {}

    public record AuditComputationResult(
            double totalKgCo2e,
            double perPersonKg,
            double parisTargetTotalKg,
            double parisTargetPerPersonKg,
            double vsParisPct,
            double vsRegionalAvgPct,
            int treesNeededPerYear,
            double solarSavedKg,
            double compostSavedKg,
            StreamBreakdownItem peakStream,
            List<StreamBreakdownItem> streams
    ) {}

    public record QuickWinAction(
            String id,
            String title,
            String category,
            String difficulty,
            double annualSavingsKg,
            double annualSavingsUsd,
            String summary,
            List<String> steps
    ) {}
}

package com.carbontracker.service;

import com.carbontracker.config.CalculatorInput;
import com.carbontracker.config.DashboardMetric;
import com.carbontracker.config.RecommendationCategory;
import com.carbontracker.model.CalculationLine;
import com.carbontracker.model.CalculationResult;
import com.carbontracker.model.DashboardData;
import com.carbontracker.model.Recommendation;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Turns a set of category totals into a short, general "biggest sources + tips" list.
 *
 * This module only points out which of the user's OWN logged categories are largest and
 * offers general, widely known suggestions (see RecommendationCategory) - it makes no claim
 * about how much CO2e any tip would actually save.
 */
public class RecommendationService {

    private static final int DEFAULT_TOP_CATEGORIES = 3;
    private static final int DEFAULT_TIPS_PER_CATEGORY = 2;

    /** Recommendations from one Calculator result (the categories the user just entered). */
    public List<Recommendation> fromCalculation(CalculationResult result) {
        Map<RecommendationCategory, Double> totals = new EnumMap<>(RecommendationCategory.class);
        for (CalculationLine line : result.getLines()) {
            if (line.getQuantity() > 0) {
                RecommendationCategory category = mapInput(line.getInput());
                totals.merge(category, line.getCo2eKg(), Double::sum);
            }
        }
        return rank(totals, result.getTotalKg());
    }

    /** Recommendations from the Dashboard's current-month totals. */
    public List<Recommendation> fromDashboard(DashboardData data) {
        Map<RecommendationCategory, Double> totals = new EnumMap<>(RecommendationCategory.class);
        for (DashboardMetric metric : DashboardMetric.values()) {
            double kg = data.getCurrent(metric);
            if (kg > 0) {
                totals.merge(mapMetric(metric), kg, Double::sum);
            }
        }
        if (data.getOtherCurrent() > 0) {
            totals.merge(RecommendationCategory.OTHER, data.getOtherCurrent(), Double::sum);
        }
        return rank(totals, data.getTotalCurrent());
    }

    // ---------------------------------------------------------------

    /** Pure logic: the biggest categories, largest first, each with its share and a couple of tips. */
    public static List<Recommendation> rank(Map<RecommendationCategory, Double> totals, double grandTotal) {
        List<Map.Entry<RecommendationCategory, Double>> sorted = new ArrayList<>(totals.entrySet());
        sorted.sort(Comparator.<Map.Entry<RecommendationCategory, Double>>comparingDouble(Map.Entry::getValue).reversed());

        List<Recommendation> result = new ArrayList<>();
        for (int i = 0; i < sorted.size() && i < DEFAULT_TOP_CATEGORIES; i++) {
            Map.Entry<RecommendationCategory, Double> entry = sorted.get(i);
            double kg = entry.getValue();
            if (kg <= 0) {
                continue;
            }
            double share = grandTotal > 0
                    ? BigDecimal.valueOf(kg / grandTotal * 100).setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0;
            result.add(new Recommendation(entry.getKey(), kg, share, entry.getKey().getTips(DEFAULT_TIPS_PER_CATEGORY)));
        }
        return result;
    }

    private static RecommendationCategory mapInput(CalculatorInput input) {
        return switch (input) {
            case ELECTRICITY -> RecommendationCategory.ELECTRICITY;
            case LPG -> RecommendationCategory.COOKING;
            case PETROL, DIESEL -> RecommendationCategory.TRANSPORT;
            case WASTE -> RecommendationCategory.WASTE;
        };
    }

    private static RecommendationCategory mapMetric(DashboardMetric metric) {
        return switch (metric) {
            case ELECTRICITY -> RecommendationCategory.ELECTRICITY;
            case LPG -> RecommendationCategory.COOKING;
            case TRANSPORT -> RecommendationCategory.TRANSPORT;
            case WASTE -> RecommendationCategory.WASTE;
        };
    }
}

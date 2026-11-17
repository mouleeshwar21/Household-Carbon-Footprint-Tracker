package com.carbontracker.model;

import com.carbontracker.config.RecommendationCategory;
import java.util.List;

/** One line of the Recommendations panel: a category, its share of the total, and its tips. */
public class Recommendation {

    private final RecommendationCategory category;
    private final double totalKg;
    private final double sharePercent;
    private final List<String> tips;

    public Recommendation(RecommendationCategory category, double totalKg, double sharePercent, List<String> tips) {
        this.category = category;
        this.totalKg = totalKg;
        this.sharePercent = sharePercent;
        this.tips = tips;
    }

    public RecommendationCategory getCategory() { return category; }
    public double getTotalKg() { return totalKg; }
    public double getSharePercent() { return sharePercent; }
    public List<String> getTips() { return tips; }
}

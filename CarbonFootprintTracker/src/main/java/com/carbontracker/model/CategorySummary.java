package com.carbontracker.model;

/** Result row of a report query: total emissions for one category. */
public class CategorySummary {

    private final String category;
    private final double totalKg;

    public CategorySummary(String category, double totalKg) {
        this.category = category;
        this.totalKg = totalKg;
    }

    public String getCategory() { return category; }
    public double getTotalKg() { return totalKg; }
}

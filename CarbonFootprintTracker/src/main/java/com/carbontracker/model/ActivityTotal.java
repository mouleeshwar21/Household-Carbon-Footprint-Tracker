package com.carbontracker.model;

/** Result row of a report query: total emissions of one activity (e.g. Cooking / LPG) in a period. */
public class ActivityTotal {

    private final String category;
    private final String activityType;
    private final double totalKg;

    public ActivityTotal(String category, String activityType, double totalKg) {
        this.category = category;
        this.activityType = activityType;
        this.totalKg = totalKg;
    }

    public String getCategory() { return category; }
    public String getActivityType() { return activityType; }
    public double getTotalKg() { return totalKg; }
}

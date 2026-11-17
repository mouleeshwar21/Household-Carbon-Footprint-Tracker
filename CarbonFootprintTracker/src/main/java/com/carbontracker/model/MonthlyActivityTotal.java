package com.carbontracker.model;

/** Result row of a report query: total emissions of one activity in one month ("2026-09"). */
public class MonthlyActivityTotal {

    private final String month;
    private final String category;
    private final String activityType;
    private final double totalKg;
    private final int recordCount;

    public MonthlyActivityTotal(String month, String category, String activityType, double totalKg, int recordCount) {
        this.month = month;
        this.category = category;
        this.activityType = activityType;
        this.totalKg = totalKg;
        this.recordCount = recordCount;
    }

    public String getMonth() { return month; }
    public String getCategory() { return category; }
    public String getActivityType() { return activityType; }
    public double getTotalKg() { return totalKg; }
    public int getRecordCount() { return recordCount; }
}

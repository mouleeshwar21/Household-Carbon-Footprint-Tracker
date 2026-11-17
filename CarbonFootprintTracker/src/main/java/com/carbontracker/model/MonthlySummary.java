package com.carbontracker.model;

/** Result row of a report query: total emissions for one month ("2026-09"). */
public class MonthlySummary {

    private final String month;
    private final double totalKg;

    public MonthlySummary(String month, double totalKg) {
        this.month = month;
        this.totalKg = totalKg;
    }

    public String getMonth() { return month; }
    public double getTotalKg() { return totalKg; }
}

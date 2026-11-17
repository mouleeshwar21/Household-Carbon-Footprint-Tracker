package com.carbontracker.model;

/** Summary of a calculation that is already saved for a month (used for the "Replace it?" question). */
public class SavedCalculation {

    private final int recordCount;
    private final double totalKg;

    public SavedCalculation(int recordCount, double totalKg) {
        this.recordCount = recordCount;
        this.totalKg = totalKg;
    }

    public int getRecordCount() { return recordCount; }
    public double getTotalKg() { return totalKg; }
}

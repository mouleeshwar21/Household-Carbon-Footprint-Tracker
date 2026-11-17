package com.carbontracker.model;

/** Maps to the 'emission_factors' table. */
public class EmissionFactor {

    private int factorId;
    private String category;
    private String activityType;
    private String unit;
    private double factorKgCo2e;
    private String sourceNote;
    private boolean active = true;

    public EmissionFactor() {
    }

    public int getFactorId() { return factorId; }
    public void setFactorId(int factorId) { this.factorId = factorId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public double getFactorKgCo2e() { return factorKgCo2e; }
    public void setFactorKgCo2e(double factorKgCo2e) { this.factorKgCo2e = factorKgCo2e; }

    public String getSourceNote() { return sourceNote; }
    public void setSourceNote(String sourceNote) { this.sourceNote = sourceNote; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    /** Text shown inside combo boxes, e.g. "Petrol car (km)". */
    @Override
    public String toString() {
        return activityType + " (" + unit + ")";
    }
}

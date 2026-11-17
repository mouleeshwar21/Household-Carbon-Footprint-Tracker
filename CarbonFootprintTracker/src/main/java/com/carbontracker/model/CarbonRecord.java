package com.carbontracker.model;

import java.time.LocalDate;

/**
 * Maps to the 'carbon_records' table.
 * The last three fields (category, activityType, unit) are NOT columns of
 * carbon_records - they are filled from emission_factors by a JOIN so the
 * History screen can show readable text.
 */
public class CarbonRecord {

    private int recordId;
    private int userId;
    private int factorId;
    private double quantity;
    private LocalDate recordDate;
    private double co2eKg;
    private String notes;

    // From the JOIN with emission_factors (display only)
    private String category;
    private String activityType;
    private String unit;

    public CarbonRecord() {
    }

    public int getRecordId() { return recordId; }
    public void setRecordId(int recordId) { this.recordId = recordId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public int getFactorId() { return factorId; }
    public void setFactorId(int factorId) { this.factorId = factorId; }

    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }

    public LocalDate getRecordDate() { return recordDate; }
    public void setRecordDate(LocalDate recordDate) { this.recordDate = recordDate; }

    public double getCo2eKg() { return co2eKg; }
    public void setCo2eKg(double co2eKg) { this.co2eKg = co2eKg; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}

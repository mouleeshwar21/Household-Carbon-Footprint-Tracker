package com.carbontracker.model;

import com.carbontracker.config.CalculatorInput;

/** One row of a calculation: e.g. "250 kWh of electricity = 177.5 kg CO2e (51% of the total)". */
public class CalculationLine {

    private final CalculatorInput input;
    private final int factorId;
    private final double quantity;
    private final String unit;
    private final double factorKgCo2e;
    private final double co2eKg;
    private final double sharePercent;

    public CalculationLine(CalculatorInput input, int factorId, double quantity, String unit,
                           double factorKgCo2e, double co2eKg, double sharePercent) {
        this.input = input;
        this.factorId = factorId;
        this.quantity = quantity;
        this.unit = unit;
        this.factorKgCo2e = factorKgCo2e;
        this.co2eKg = co2eKg;
        this.sharePercent = sharePercent;
    }

    public CalculatorInput getInput() { return input; }
    public int getFactorId() { return factorId; }
    public double getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public double getFactorKgCo2e() { return factorKgCo2e; }
    public double getCo2eKg() { return co2eKg; }
    public double getSharePercent() { return sharePercent; }
}

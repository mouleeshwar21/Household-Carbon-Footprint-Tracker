package com.carbontracker.service;

import com.carbontracker.model.EmissionFactor;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The heart of the project:  CO2e (kg) = quantity x emission factor.
 * Example: 240 kWh x 0.71 kg/kWh = 170.4 kg CO2e.
 * BigDecimal is used so the result is rounded properly to 4 decimals
 * (the precision of carbon_records.co2e_kg).
 */
public final class EmissionCalculator {

    private EmissionCalculator() {
    }

    public static double calculate(double quantity, double factorKgCo2e) {
        return BigDecimal.valueOf(quantity)
                .multiply(BigDecimal.valueOf(factorKgCo2e))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();
    }

    public static double calculate(double quantity, EmissionFactor factor) {
        return calculate(quantity, factor.getFactorKgCo2e());
    }

    /** Total divided by household size (guards against a size of 0). */
    public static double perPerson(double totalKg, int members) {
        return members <= 0 ? totalKg : totalKg / members;
    }
}

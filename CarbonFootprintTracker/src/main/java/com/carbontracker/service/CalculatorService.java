package com.carbontracker.service;

import com.carbontracker.config.CalculatorInput;
import com.carbontracker.dao.CalculatorRecordDAO;
import com.carbontracker.dao.EmissionFactorDAO;
import com.carbontracker.model.CalculationLine;
import com.carbontracker.model.CalculationResult;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.model.EmissionFactor;
import com.carbontracker.model.SavedCalculation;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Logic of the Household Carbon Footprint Calculator:
 * looks up factors in the database, calculates, and saves a month as records.
 * There are NO emission factor numbers in this class - they all come from MySQL.
 */
public class CalculatorService {

    private static final double MAX_QUANTITY = 1_000_000;
    private static final int MAX_PEOPLE = 50;

    private final EmissionFactorDAO factorDAO = new EmissionFactorDAO();
    private final CalculatorRecordDAO calculatorRecordDAO = new CalculatorRecordDAO();

    // ---------------------------------------------------------------
    // Factors
    // ---------------------------------------------------------------

    /** Finds the database factor of every calculator input. */
    public Map<CalculatorInput, EmissionFactor> getFactors() throws ServiceException {
        List<EmissionFactor> all;
        try {
            all = factorDAO.findAllActive();
        } catch (SQLException e) {
            throw new ServiceException("Could not load emission factors: " + e.getMessage(), e);
        }

        Map<CalculatorInput, EmissionFactor> found = new EnumMap<>(CalculatorInput.class);
        List<String> missing = new ArrayList<>();
        for (CalculatorInput input : CalculatorInput.values()) {
            EmissionFactor match = null;
            for (EmissionFactor f : all) {
                if (f.getCategory().equals(input.getCategory())
                        && f.getActivityType().equals(input.getActivityType())) {
                    match = f;
                    break;
                }
            }
            if (match == null) {
                missing.add(input.getLabel());
            } else {
                found.put(input, match);
            }
        }
        if (!missing.isEmpty()) {
            throw new ServiceException("The database has no emission factor for: "
                    + String.join(", ", missing)
                    + ".\nRun 03_calculator_setup.sql in MySQL Workbench, then try again.");
        }
        return found;
    }

    // ---------------------------------------------------------------
    // Calculation
    // ---------------------------------------------------------------

    /** Loads the current factors from MySQL and calculates. */
    public CalculationResult calculate(Map<CalculatorInput, Double> quantities, int people)
            throws ServiceException {
        return computeResult(quantities, people, getFactors());
    }

    /**
     * Pure calculation (no database access): CO2e = quantity x factor for each input,
     * then the total and the per-person value.
     */
    public static CalculationResult computeResult(Map<CalculatorInput, Double> quantities, int people,
                                                  Map<CalculatorInput, EmissionFactor> factors)
            throws ServiceException {
        if (people < 1 || people > MAX_PEOPLE) {
            throw new ServiceException("Number of people must be between 1 and " + MAX_PEOPLE + ".");
        }

        // Pass 1: individual emissions and the total
        Map<CalculatorInput, Double> quantityUsed = new EnumMap<>(CalculatorInput.class);
        Map<CalculatorInput, Double> co2e = new EnumMap<>(CalculatorInput.class);
        BigDecimal total = BigDecimal.ZERO;

        for (CalculatorInput input : CalculatorInput.values()) {
            EmissionFactor factor = factors.get(input);
            if (factor == null) {
                throw new ServiceException("No emission factor found for " + input.getLabel() + ".");
            }
            double raw = quantities.getOrDefault(input, 0.0);
            if (Double.isNaN(raw) || raw < 0 || raw > MAX_QUANTITY) {
                throw new ServiceException(input.getLabel() + ": quantity must be between 0 and 1,000,000.");
            }
            // 3 decimals = the precision of carbon_records.quantity, so what we show is what we save
            double quantity = BigDecimal.valueOf(raw).setScale(3, RoundingMode.HALF_UP).doubleValue();
            double kg = EmissionCalculator.calculate(quantity, factor);

            quantityUsed.put(input, quantity);
            co2e.put(input, kg);
            total = total.add(BigDecimal.valueOf(kg));
        }
        if (total.signum() == 0) {
            throw new ServiceException("Please enter at least one quantity greater than zero.");
        }

        // Pass 2: build the lines (now that the total is known, we can add each line's share)
        List<CalculationLine> lines = new ArrayList<>();
        for (CalculatorInput input : CalculatorInput.values()) {
            EmissionFactor factor = factors.get(input);
            double kg = co2e.get(input);
            double share = kg / total.doubleValue() * 100;
            lines.add(new CalculationLine(input, factor.getFactorId(), quantityUsed.get(input),
                    factor.getUnit(), factor.getFactorKgCo2e(), kg, share));
        }

        double totalKg = total.setScale(4, RoundingMode.HALF_UP).doubleValue();
        double perPerson = total.divide(BigDecimal.valueOf(people), 4, RoundingMode.HALF_UP).doubleValue();
        return new CalculationResult(lines, totalKg, people, perPerson);
    }

    // ---------------------------------------------------------------
    // Saving
    // ---------------------------------------------------------------

    /** @return what is already saved for this user and month, or null if nothing */
    public SavedCalculation findSaved(int userId, YearMonth month) throws ServiceException {
        try {
            return calculatorRecordDAO.findSaved(userId, month);
        } catch (SQLException e) {
            throw new ServiceException("Could not check for an existing calculation: " + e.getMessage(), e);
        }
    }

    /**
     * Saves the result as records of the given month for the given user.
     * An earlier calculator save for the same month is replaced (in one transaction).
     * Sources with a quantity of 0 are not stored.
     *
     * @return the number of records saved
     */
    public int saveCalculation(int userId, YearMonth month, CalculationResult result) throws ServiceException {
        if (month == null) {
            throw new ServiceException("Please choose a month.");
        }
        if (month.isAfter(YearMonth.now())) {
            throw new ServiceException("You cannot save a calculation for a future month.");
        }

        List<CarbonRecord> records = new ArrayList<>();
        for (CalculationLine line : result.getLines()) {
            if (line.getQuantity() <= 0) {
                continue; // unused source - the database requires quantity > 0
            }
            CarbonRecord record = new CarbonRecord();
            record.setUserId(userId);
            record.setFactorId(line.getFactorId());
            record.setQuantity(line.getQuantity());
            record.setRecordDate(month.atDay(1)); // one date per month; reports group by month anyway
            record.setCo2eKg(line.getCo2eKg());
            record.setNotes("Calculator: " + month + ", " + result.getPeople()
                    + (result.getPeople() == 1 ? " person" : " people"));
            records.add(record);
        }
        if (records.isEmpty()) {
            throw new ServiceException("There is nothing to save - enter at least one quantity.");
        }

        try {
            calculatorRecordDAO.replaceMonth(userId, month, records);
            return records.size();
        } catch (SQLIntegrityConstraintViolationException e) {
            throw new ServiceException("The database rejected the data (for example an emission factor "
                    + "that no longer exists). Nothing was saved.", e);
        } catch (SQLException e) {
            throw new ServiceException("Could not save the calculation. Nothing was changed.\n"
                    + "Database error: " + e.getMessage(), e);
        }
    }
}

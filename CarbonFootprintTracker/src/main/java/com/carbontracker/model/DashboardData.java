package com.carbontracker.model;

import com.carbontracker.config.DashboardMetric;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.Map;

/** Everything the Dashboard shows, for the current month and the previous month. */
public class DashboardData {

    private final YearMonth month;
    private final YearMonth previousMonth;
    private final int people;
    private final Double targetKg;

    private final Map<DashboardMetric, Double> current;
    private final Map<DashboardMetric, Double> previous;
    private final double otherCurrent;
    private final double otherPrevious;
    private final double totalCurrent;
    private final double totalPrevious;

    public DashboardData(YearMonth month, YearMonth previousMonth, int people, Double targetKg,
                         Map<DashboardMetric, Double> current, double otherCurrent, double totalCurrent,
                         Map<DashboardMetric, Double> previous, double otherPrevious, double totalPrevious) {
        this.month = month;
        this.previousMonth = previousMonth;
        this.people = Math.max(people, 1);
        this.targetKg = targetKg;
        this.current = new EnumMap<>(current);
        this.previous = new EnumMap<>(previous);
        this.otherCurrent = otherCurrent;
        this.otherPrevious = otherPrevious;
        this.totalCurrent = totalCurrent;
        this.totalPrevious = totalPrevious;
    }

    public YearMonth getMonth() { return month; }
    public YearMonth getPreviousMonth() { return previousMonth; }
    public int getPeople() { return people; }

    /** The monthly target from the household profile, or null if none is set. */
    public Double getTargetKg() { return targetKg; }

    public double getCurrent(DashboardMetric metric) { return current.getOrDefault(metric, 0.0); }
    public double getPrevious(DashboardMetric metric) { return previous.getOrDefault(metric, 0.0); }
    public double getOtherCurrent() { return otherCurrent; }
    public double getOtherPrevious() { return otherPrevious; }
    public double getTotalCurrent() { return totalCurrent; }
    public double getTotalPrevious() { return totalPrevious; }

    public double getPerPersonCurrent() { return perPerson(totalCurrent); }
    public double getPerPersonPrevious() { return perPerson(totalPrevious); }

    private double perPerson(double total) {
        return BigDecimal.valueOf(total).divide(BigDecimal.valueOf(people), 4, RoundingMode.HALF_UP).doubleValue();
    }
}

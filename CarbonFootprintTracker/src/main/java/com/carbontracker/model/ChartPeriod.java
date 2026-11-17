package com.carbontracker.model;

import java.time.LocalDate;
import java.time.YearMonth;

/** The time range choices of the "Emissions by category" chart. */
public enum ChartPeriod {

    THIS_MONTH("This month"),
    LAST_MONTH("Last month"),
    ALL_TIME("All time");

    private final String label;

    ChartPeriod(String label) {
        this.label = label;
    }

    /**
     * @param now the current month
     * @return {first day, last day} of the period, both inclusive
     */
    public LocalDate[] range(YearMonth now) {
        return switch (this) {
            case THIS_MONTH -> new LocalDate[]{now.atDay(1), now.atEndOfMonth()};
            case LAST_MONTH -> new LocalDate[]{now.minusMonths(1).atDay(1), now.minusMonths(1).atEndOfMonth()};
            case ALL_TIME -> new LocalDate[]{LocalDate.of(2000, 1, 1), now.atEndOfMonth()};
        };
    }

    /** Text shown in the combo box. */
    @Override
    public String toString() {
        return label;
    }
}

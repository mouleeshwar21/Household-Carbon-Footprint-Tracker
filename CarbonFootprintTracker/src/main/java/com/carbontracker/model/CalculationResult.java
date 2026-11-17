package com.carbontracker.model;

import java.util.Collections;
import java.util.List;

/** The full outcome of one calculation: every line plus the totals. */
public class CalculationResult {

    private final List<CalculationLine> lines;
    private final double totalKg;
    private final int people;
    private final double perPersonKg;

    public CalculationResult(List<CalculationLine> lines, double totalKg, int people, double perPersonKg) {
        this.lines = Collections.unmodifiableList(lines);
        this.totalKg = totalKg;
        this.people = people;
        this.perPersonKg = perPersonKg;
    }

    public List<CalculationLine> getLines() { return lines; }
    public double getTotalKg() { return totalKg; }
    public int getPeople() { return people; }
    public double getPerPersonKg() { return perPersonKg; }
}

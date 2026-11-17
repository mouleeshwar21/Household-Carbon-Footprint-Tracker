package com.carbontracker.model;

import com.carbontracker.config.HistoryColumn;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.Map;

/** One row of the Monthly History table: a month, its emission columns, "other", the total and the record count. */
public class MonthlyHistoryRow {

    private final YearMonth month;
    private final Map<HistoryColumn, Double> values;
    private final double other;
    private final double total;
    private final int recordCount;

    public MonthlyHistoryRow(YearMonth month, Map<HistoryColumn, Double> values,
                             double other, double total, int recordCount) {
        this.month = month;
        this.values = new EnumMap<>(values);
        this.other = other;
        this.total = total;
        this.recordCount = recordCount;
    }

    public YearMonth getMonth() { return month; }
    public double getValue(HistoryColumn column) { return values.getOrDefault(column, 0.0); }
    public double getOther() { return other; }
    public double getTotal() { return total; }
    public int getRecordCount() { return recordCount; }
}

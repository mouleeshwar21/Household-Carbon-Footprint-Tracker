package com.carbontracker.service;

import com.carbontracker.config.HistoryColumn;
import com.carbontracker.dao.CarbonRecordDAO;
import com.carbontracker.dao.ReportDAO;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.model.MonthlyActivityTotal;
import com.carbontracker.model.MonthlyHistoryRow;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Logic behind the Monthly History screen.
 * EVERY method takes the userId of the logged-in user and passes it to SQL as "WHERE user_id = ?",
 * so a user can only ever see, change or delete their own records.
 */
public class MonthlyHistoryService {

    private final ReportDAO reportDAO = new ReportDAO();
    private final CarbonRecordDAO recordDAO = new CarbonRecordDAO();

    /** One row per month (newest first) with the columns of the history table. */
    public List<MonthlyHistoryRow> getMonthlyRows(int userId) throws ServiceException {
        requireUser(userId);
        try {
            return buildRows(reportDAO.monthlyActivityTotals(userId));
        } catch (SQLException e) {
            throw new ServiceException("Could not load the monthly history: " + e.getMessage(), e);
        }
    }

    /** The individual records of one month (used by the View and Edit windows). */
    public List<CarbonRecord> getRecords(int userId, YearMonth month) throws ServiceException {
        requireUser(userId);
        requireMonth(month);
        try {
            return recordDAO.findByUserBetween(userId, month.atDay(1), month.atEndOfMonth());
        } catch (SQLException e) {
            throw new ServiceException("Could not load the records of " + month + ": " + e.getMessage(), e);
        }
    }

    /**
     * Deletes ALL of the user's records in the given month.
     *
     * @return the number of records deleted
     */
    public int deleteMonth(int userId, YearMonth month) throws ServiceException {
        requireUser(userId);
        requireMonth(month);
        try {
            return recordDAO.deleteByUserBetween(userId, month.atDay(1), month.atEndOfMonth());
        } catch (SQLException e) {
            throw new ServiceException("Could not delete the records of " + month
                    + ". Nothing was deleted.\nDatabase error: " + e.getMessage(), e);
        }
    }

    // ---------------------------------------------------------------

    /** Pure logic (no database): sorts activity totals into the table columns, one row per month. */
    public static List<MonthlyHistoryRow> buildRows(List<MonthlyActivityTotal> totals) {
        Map<YearMonth, Sums> byMonth = new TreeMap<>(Comparator.reverseOrder()); // newest month first

        for (MonthlyActivityTotal t : totals) {
            YearMonth month;
            try {
                month = YearMonth.parse(t.getMonth()); // "2026-09"
            } catch (DateTimeParseException e) {
                continue; // cannot happen with DATE_FORMAT('%Y-%m'), but never crash the screen
            }
            Sums sums = byMonth.computeIfAbsent(month, m -> new Sums());
            BigDecimal kg = BigDecimal.valueOf(t.getTotalKg());
            sums.total = sums.total.add(kg);
            sums.count += t.getRecordCount();

            boolean placed = false;
            for (HistoryColumn column : HistoryColumn.values()) {
                if (column.matches(t.getCategory(), t.getActivityType())) {
                    sums.columns.merge(column, kg, BigDecimal::add);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                sums.other = sums.other.add(kg);
            }
        }

        List<MonthlyHistoryRow> rows = new ArrayList<>();
        for (Map.Entry<YearMonth, Sums> entry : byMonth.entrySet()) {
            Sums sums = entry.getValue();
            Map<HistoryColumn, Double> values = new EnumMap<>(HistoryColumn.class);
            for (Map.Entry<HistoryColumn, BigDecimal> c : sums.columns.entrySet()) {
                values.put(c.getKey(), round(c.getValue()));
            }
            rows.add(new MonthlyHistoryRow(entry.getKey(), values, round(sums.other), round(sums.total), sums.count));
        }
        return rows;
    }

    private static double round(BigDecimal value) {
        return value.setScale(4, RoundingMode.HALF_UP).doubleValue();
    }

    private static void requireUser(int userId) throws ServiceException {
        if (userId <= 0) {
            throw new ServiceException("You must be logged in to see your history.");
        }
    }

    private static void requireMonth(YearMonth month) throws ServiceException {
        if (month == null) {
            throw new ServiceException("Please choose a month.");
        }
    }

    /** Running totals of one month while the rows are being sorted into columns. */
    private static class Sums {
        final Map<HistoryColumn, BigDecimal> columns = new EnumMap<>(HistoryColumn.class);
        BigDecimal other = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        int count = 0;
    }
}

package com.carbontracker.service;

import com.carbontracker.config.DashboardMetric;
import com.carbontracker.dao.HouseholdProfileDAO;
import com.carbontracker.dao.ReportDAO;
import com.carbontracker.model.ActivityTotal;
import com.carbontracker.model.CategorySummary;
import com.carbontracker.model.ChartPeriod;
import com.carbontracker.model.DashboardData;
import com.carbontracker.model.HouseholdProfile;
import com.carbontracker.model.MonthlySummary;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Collects and organises the numbers shown on the Dashboard. */
public class DashboardService {

    private final ReportDAO reportDAO = new ReportDAO();
    private final HouseholdProfileDAO householdDAO = new HouseholdProfileDAO();

    /** Loads this month and last month for the given user. */
    public DashboardData load(int userId) throws ServiceException {
        YearMonth month = YearMonth.now();
        YearMonth previousMonth = month.minusMonths(1);
        try {
            List<ActivityTotal> thisMonth = reportDAO.activityTotals(userId, month.atDay(1), month.atEndOfMonth());
            List<ActivityTotal> lastMonth = reportDAO.activityTotals(userId, previousMonth.atDay(1), previousMonth.atEndOfMonth());
            HouseholdProfile profile = householdDAO.findByUserId(userId);

            int people = (profile == null) ? 1 : profile.getNumMembers();
            Double target = (profile == null) ? null : profile.getMonthlyTargetKg();
            return build(month, previousMonth, thisMonth, lastMonth, people, target);
        } catch (SQLException e) {
            throw new ServiceException("Could not load the dashboard: " + e.getMessage(), e);
        }
    }

    // ---------------------------------------------------------------
    // Chart data (always for ONE user: the SQL is filtered by user_id)
    // ---------------------------------------------------------------

    /** Emissions per category for the "Emissions by category" chart, biggest first. */
    public List<CategorySummary> getCategoryTotals(int userId, ChartPeriod period) throws ServiceException {
        requireUser(userId);
        LocalDate[] range = period.range(YearMonth.now());
        try {
            return reportDAO.categoryTotals(userId, range[0], range[1]);
        } catch (SQLException e) {
            throw new ServiceException("Could not load the category chart: " + e.getMessage(), e);
        }
    }

    /**
     * Monthly totals for the trend chart: the last 'months' months, oldest first,
     * with 0 for months that have no records (so the line has no gaps).
     */
    public List<MonthlySummary> getMonthlyTrend(int userId, int months) throws ServiceException {
        requireUser(userId);
        try {
            return buildTrend(reportDAO.monthlyTotals(userId), YearMonth.now(), months);
        } catch (SQLException e) {
            throw new ServiceException("Could not load the monthly trend: " + e.getMessage(), e);
        }
    }

    /** Pure logic (no database): fills the gaps and puts the months in order, oldest first. */
    public static List<MonthlySummary> buildTrend(List<MonthlySummary> data, YearMonth lastMonth, int months) {
        Map<String, Double> byMonth = new HashMap<>();
        for (MonthlySummary m : data) {
            byMonth.put(m.getMonth(), m.getTotalKg());
        }
        List<MonthlySummary> trend = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            String key = lastMonth.minusMonths(i).toString(); // "2026-09", same format as the SQL
            trend.add(new MonthlySummary(key, byMonth.getOrDefault(key, 0.0)));
        }
        return trend;
    }

    private static void requireUser(int userId) throws ServiceException {
        if (userId <= 0) {
            throw new ServiceException("You must be logged in to see the dashboard.");
        }
    }

    /** Pure logic (no database): sorts the activity totals into the four groups + "other". */
    public static DashboardData build(YearMonth month, YearMonth previousMonth,
                                      List<ActivityTotal> thisMonth, List<ActivityTotal> lastMonth,
                                      int people, Double targetKg) {
        Map<DashboardMetric, Double> current = new EnumMap<>(DashboardMetric.class);
        Map<DashboardMetric, Double> previous = new EnumMap<>(DashboardMetric.class);
        double[] currentTotals = groupTotals(thisMonth, current);   // {other, total}
        double[] previousTotals = groupTotals(lastMonth, previous);
        return new DashboardData(month, previousMonth, people, targetKg,
                current, currentTotals[0], currentTotals[1],
                previous, previousTotals[0], previousTotals[1]);
    }

    /**
     * Adds every activity to its group in 'groups'.
     *
     * @return {other, total} where other = everything that matched no group
     */
    private static double[] groupTotals(List<ActivityTotal> rows, Map<DashboardMetric, Double> groups) {
        BigDecimal other = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (ActivityTotal row : rows) {
            BigDecimal kg = BigDecimal.valueOf(row.getTotalKg());
            total = total.add(kg);
            boolean placed = false;
            for (DashboardMetric metric : DashboardMetric.values()) {
                if (metric.matches(row.getCategory(), row.getActivityType())) {
                    groups.merge(metric, row.getTotalKg(), Double::sum);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                other = other.add(kg);
            }
        }
        return new double[]{
            other.setScale(4, RoundingMode.HALF_UP).doubleValue(),
            total.setScale(4, RoundingMode.HALF_UP).doubleValue()
        };
    }

    /**
     * Percentage change from 'previous' to 'current' (negative = emissions went down).
     *
     * @return null when there is no previous value to compare with
     */
    public static Double percentChange(double previous, double current) {
        if (previous <= 0) {
            return null;
        }
        return (current - previous) / previous * 100;
    }
}

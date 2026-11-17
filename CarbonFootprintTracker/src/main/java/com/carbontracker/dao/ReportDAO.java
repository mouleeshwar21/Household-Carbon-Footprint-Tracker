package com.carbontracker.dao;

import com.carbontracker.database.DBConnection;
import com.carbontracker.model.ActivityTotal;
import com.carbontracker.model.CategorySummary;
import com.carbontracker.model.MonthlyActivityTotal;
import com.carbontracker.model.MonthlySummary;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Read-only "totals" queries (SUM / GROUP BY) used by the Dashboard and Reports. */
public class ReportDAO {

    /** Total kg CO2e between two dates (both inclusive). Returns 0 if there are no records. */
    public double totalBetween(int userId, LocalDate from, LocalDate to) throws SQLException {
        String sql = "SELECT COALESCE(SUM(co2e_kg), 0) FROM carbon_records "
                   + "WHERE user_id = ? AND record_date BETWEEN ? AND ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setObject(2, from);
            ps.setObject(3, to);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getDouble(1) : 0;
            }
        }
    }

    /**
     * Emissions per activity (category + activity type, e.g. Cooking / LPG) between two dates.
     * The Dashboard groups these into Electricity, LPG, Transportation, Waste and Other.
     */
    public List<ActivityTotal> activityTotals(int userId, LocalDate from, LocalDate to) throws SQLException {
        String sql = "SELECT f.category, f.activity_type, SUM(r.co2e_kg) AS total "
                   + "FROM carbon_records r "
                   + "JOIN emission_factors f ON f.factor_id = r.factor_id "
                   + "WHERE r.user_id = ? AND r.record_date BETWEEN ? AND ? "
                   + "GROUP BY f.category, f.activity_type";
        List<ActivityTotal> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setObject(2, from);
            ps.setObject(3, to);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new ActivityTotal(rs.getString("category"), rs.getString("activity_type"),
                            rs.getDouble("total")));
                }
            }
        }
        return list;
    }

    /**
     * Emissions per month AND activity for ONE user (the WHERE clause uses user_id, so nobody
     * can see another user's numbers). The Monthly History screen sorts these into its columns.
     */
    public List<MonthlyActivityTotal> monthlyActivityTotals(int userId) throws SQLException {
        String sql = "SELECT DATE_FORMAT(r.record_date, '%Y-%m') AS ym, f.category, f.activity_type, "
                   + "SUM(r.co2e_kg) AS total, COUNT(*) AS cnt "
                   + "FROM carbon_records r "
                   + "JOIN emission_factors f ON f.factor_id = r.factor_id "
                   + "WHERE r.user_id = ? "
                   + "GROUP BY ym, f.category, f.activity_type "
                   + "ORDER BY ym DESC";
        List<MonthlyActivityTotal> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new MonthlyActivityTotal(rs.getString("ym"), rs.getString("category"),
                            rs.getString("activity_type"), rs.getDouble("total"), rs.getInt("cnt")));
                }
            }
        }
        return list;
    }

    /** Emissions per category between two dates, biggest first. */
    public List<CategorySummary> categoryTotals(int userId, LocalDate from, LocalDate to) throws SQLException {
        String sql = "SELECT f.category, SUM(r.co2e_kg) AS total "
                   + "FROM carbon_records r "
                   + "JOIN emission_factors f ON f.factor_id = r.factor_id "
                   + "WHERE r.user_id = ? AND r.record_date BETWEEN ? AND ? "
                   + "GROUP BY f.category ORDER BY total DESC";
        List<CategorySummary> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setObject(2, from);
            ps.setObject(3, to);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new CategorySummary(rs.getString("category"), rs.getDouble("total")));
                }
            }
        }
        return list;
    }

    /** Emissions per calendar month ("2026-09"), newest month first. */
    public List<MonthlySummary> monthlyTotals(int userId) throws SQLException {
        String sql = "SELECT DATE_FORMAT(record_date, '%Y-%m') AS ym, SUM(co2e_kg) AS total "
                   + "FROM carbon_records WHERE user_id = ? "
                   + "GROUP BY ym ORDER BY ym DESC";
        List<MonthlySummary> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new MonthlySummary(rs.getString("ym"), rs.getDouble("total")));
                }
            }
        }
        return list;
    }
}

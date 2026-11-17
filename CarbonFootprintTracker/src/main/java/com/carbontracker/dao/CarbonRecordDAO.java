package com.carbontracker.dao;

import com.carbontracker.database.DBConnection;
import com.carbontracker.model.CarbonRecord;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** All SQL for the 'carbon_records' table. */
public class CarbonRecordDAO {

    /** Inserts a record and returns the generated record_id. */
    public int insert(CarbonRecord r) throws SQLException {
        String sql = "INSERT INTO carbon_records (user_id, factor_id, quantity, record_date, co2e_kg, notes) "
                   + "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, r.getUserId());
            ps.setInt(2, r.getFactorId());
            ps.setDouble(3, r.getQuantity());
            ps.setObject(4, r.getRecordDate());
            ps.setDouble(5, r.getCo2eKg());
            ps.setString(6, r.getNotes());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getInt(1);
                }
            }
            throw new SQLException("Record was inserted but no id was returned.");
        }
    }

    /** Updates quantity, date, CO2e and notes. user_id in WHERE stops users editing other people's rows. */
    public boolean update(CarbonRecord r) throws SQLException {
        String sql = "UPDATE carbon_records SET quantity = ?, record_date = ?, co2e_kg = ?, notes = ? "
                   + "WHERE record_id = ? AND user_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setDouble(1, r.getQuantity());
            ps.setObject(2, r.getRecordDate());
            ps.setDouble(3, r.getCo2eKg());
            ps.setString(4, r.getNotes());
            ps.setInt(5, r.getRecordId());
            ps.setInt(6, r.getUserId());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean delete(int recordId, int userId) throws SQLException {
        String sql = "DELETE FROM carbon_records WHERE record_id = ? AND user_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, recordId);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    /** All records of one user, newest first, including category/activity/unit from emission_factors. */
    public List<CarbonRecord> findByUser(int userId) throws SQLException {
        String sql = "SELECT r.record_id, r.user_id, r.factor_id, r.quantity, r.record_date, "
                   + "r.co2e_kg, r.notes, f.category, f.activity_type, f.unit "
                   + "FROM carbon_records r "
                   + "JOIN emission_factors f ON f.factor_id = r.factor_id "
                   + "WHERE r.user_id = ? "
                   + "ORDER BY r.record_date DESC, r.record_id DESC";
        List<CarbonRecord> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    /**
     * One user's records between two dates (both inclusive), oldest first.
     * Always filtered by user_id, so a user can never load someone else's records.
     */
    public List<CarbonRecord> findByUserBetween(int userId, LocalDate from, LocalDate to) throws SQLException {
        String sql = "SELECT r.record_id, r.user_id, r.factor_id, r.quantity, r.record_date, "
                   + "r.co2e_kg, r.notes, f.category, f.activity_type, f.unit "
                   + "FROM carbon_records r "
                   + "JOIN emission_factors f ON f.factor_id = r.factor_id "
                   + "WHERE r.user_id = ? AND r.record_date BETWEEN ? AND ? "
                   + "ORDER BY r.record_date, r.record_id";
        List<CarbonRecord> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setObject(2, from);
            ps.setObject(3, to);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        }
        return list;
    }

    /**
     * Deletes ALL of one user's records between two dates.
     * user_id is part of the WHERE clause, so other users' records can never be deleted.
     *
     * @return the number of records deleted
     */
    public int deleteByUserBetween(int userId, LocalDate from, LocalDate to) throws SQLException {
        String sql = "DELETE FROM carbon_records WHERE user_id = ? AND record_date BETWEEN ? AND ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setObject(2, from);
            ps.setObject(3, to);
            return ps.executeUpdate();
        }
    }

    private CarbonRecord mapRow(ResultSet rs) throws SQLException {
        CarbonRecord r = new CarbonRecord();
        r.setRecordId(rs.getInt("record_id"));
        r.setUserId(rs.getInt("user_id"));
        r.setFactorId(rs.getInt("factor_id"));
        r.setQuantity(rs.getDouble("quantity"));
        r.setRecordDate(rs.getObject("record_date", LocalDate.class));
        r.setCo2eKg(rs.getDouble("co2e_kg"));
        r.setNotes(rs.getString("notes"));
        r.setCategory(rs.getString("category"));
        r.setActivityType(rs.getString("activity_type"));
        r.setUnit(rs.getString("unit"));
        return r;
    }
}

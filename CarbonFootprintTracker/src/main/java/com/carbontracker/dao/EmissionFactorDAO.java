package com.carbontracker.dao;

import com.carbontracker.database.DBConnection;
import com.carbontracker.model.EmissionFactor;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** All SQL for the 'emission_factors' table. */
public class EmissionFactorDAO {

    private static final String SELECT_COLUMNS =
            "SELECT factor_id, category, activity_type, unit, factor_kg_co2e, source_note, is_active "
          + "FROM emission_factors";

    /** All factors that can currently be chosen, sorted for the drop-downs. */
    public List<EmissionFactor> findAllActive() throws SQLException {
        String sql = SELECT_COLUMNS + " WHERE is_active = TRUE ORDER BY category, activity_type";
        List<EmissionFactor> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        }
        return list;
    }

    /** @return the factor (active or not), or null if the id does not exist */
    public EmissionFactor findById(int factorId) throws SQLException {
        String sql = SELECT_COLUMNS + " WHERE factor_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, factorId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    private EmissionFactor mapRow(ResultSet rs) throws SQLException {
        EmissionFactor f = new EmissionFactor();
        f.setFactorId(rs.getInt("factor_id"));
        f.setCategory(rs.getString("category"));
        f.setActivityType(rs.getString("activity_type"));
        f.setUnit(rs.getString("unit"));
        f.setFactorKgCo2e(rs.getDouble("factor_kg_co2e"));
        f.setSourceNote(rs.getString("source_note"));
        f.setActive(rs.getBoolean("is_active"));
        return f;
    }
}

package com.carbontracker.dao;

import com.carbontracker.database.DBConnection;
import com.carbontracker.model.HouseholdProfile;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;

/** All SQL for the 'household_profiles' table (one row per user). */
public class HouseholdProfileDAO {

    /** @return the user's profile, or null if they have not saved one yet */
    public HouseholdProfile findByUserId(int userId) throws SQLException {
        String sql = "SELECT profile_id, user_id, household_name, num_members, home_type, "
                   + "home_area_sqft, city, country, monthly_target_kg "
                   + "FROM household_profiles WHERE user_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? mapRow(rs) : null;
            }
        }
    }

    /** Inserts the profile if it is new, otherwise updates the existing one. */
    public void save(HouseholdProfile profile) throws SQLException {
        if (findByUserId(profile.getUserId()) == null) {
            insert(profile);
        } else {
            update(profile);
        }
    }

    private void insert(HouseholdProfile p) throws SQLException {
        String sql = "INSERT INTO household_profiles (user_id, household_name, num_members, "
                   + "home_type, home_area_sqft, city, country, monthly_target_kg) "
                   + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, p.getUserId());
            bindCommonFields(ps, p, 2);
            ps.executeUpdate();
        }
    }

    private void update(HouseholdProfile p) throws SQLException {
        String sql = "UPDATE household_profiles SET household_name = ?, num_members = ?, "
                   + "home_type = ?, home_area_sqft = ?, city = ?, country = ?, "
                   + "monthly_target_kg = ? WHERE user_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            bindCommonFields(ps, p, 1);
            ps.setInt(8, p.getUserId());
            ps.executeUpdate();
        }
    }

    /** Sets the 7 editable columns, starting at parameter number 'start'. */
    private void bindCommonFields(PreparedStatement ps, HouseholdProfile p, int start) throws SQLException {
        ps.setString(start, p.getHouseholdName());
        ps.setInt(start + 1, p.getNumMembers());
        ps.setString(start + 2, p.getHomeType());
        if (p.getHomeAreaSqft() == null) {
            ps.setNull(start + 3, Types.INTEGER);
        } else {
            ps.setInt(start + 3, p.getHomeAreaSqft());
        }
        ps.setString(start + 4, p.getCity());
        ps.setString(start + 5, p.getCountry());
        if (p.getMonthlyTargetKg() == null) {
            ps.setNull(start + 6, Types.DECIMAL);
        } else {
            ps.setDouble(start + 6, p.getMonthlyTargetKg());
        }
    }

    private HouseholdProfile mapRow(ResultSet rs) throws SQLException {
        HouseholdProfile p = new HouseholdProfile();
        p.setProfileId(rs.getInt("profile_id"));
        p.setUserId(rs.getInt("user_id"));
        p.setHouseholdName(rs.getString("household_name"));
        p.setNumMembers(rs.getInt("num_members"));
        p.setHomeType(rs.getString("home_type"));

        int area = rs.getInt("home_area_sqft");
        p.setHomeAreaSqft(rs.wasNull() ? null : area);

        p.setCity(rs.getString("city"));
        p.setCountry(rs.getString("country"));

        double target = rs.getDouble("monthly_target_kg");
        p.setMonthlyTargetKg(rs.wasNull() ? null : target);
        return p;
    }
}

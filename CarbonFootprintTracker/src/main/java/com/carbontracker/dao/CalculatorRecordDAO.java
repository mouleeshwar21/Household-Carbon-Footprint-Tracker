package com.carbontracker.dao;

import com.carbontracker.database.DBConnection;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.model.SavedCalculation;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.YearMonth;
import java.util.List;

/**
 * SQL for records that were saved from the Calculator screen.
 * They live in the normal 'carbon_records' table, marked with source = 'CALCULATOR',
 * so the Dashboard, History and Reports show them automatically.
 */
public class CalculatorRecordDAO {

    /**
     * @return how many calculator records (and how many kg CO2e) this user already has
     *         in the given month, or null if there are none
     */
    public SavedCalculation findSaved(int userId, YearMonth month) throws SQLException {
        String sql = "SELECT COUNT(*) AS cnt, COALESCE(SUM(co2e_kg), 0) AS total "
                   + "FROM carbon_records "
                   + "WHERE user_id = ? AND source = 'CALCULATOR' AND record_date BETWEEN ? AND ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setObject(2, month.atDay(1));
            ps.setObject(3, month.atEndOfMonth());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && rs.getInt("cnt") > 0) {
                    return new SavedCalculation(rs.getInt("cnt"), rs.getDouble("total"));
                }
                return null;
            }
        }
    }

    /**
     * Saves one month's calculation as a single all-or-nothing transaction:
     *   1. delete this user's earlier CALCULATOR rows for that month
     *   2. insert the new rows
     * If anything fails, ROLLBACK undoes both steps, so the user never ends up
     * with half a monthly record (or with the old one deleted and no new one).
     * Manual records (source = 'MANUAL') are never touched.
     */
    public void replaceMonth(int userId, YearMonth month, List<CarbonRecord> records) throws SQLException {
        String deleteSql = "DELETE FROM carbon_records "
                         + "WHERE user_id = ? AND source = 'CALCULATOR' AND record_date BETWEEN ? AND ?";
        String insertSql = "INSERT INTO carbon_records "
                         + "(user_id, factor_id, quantity, record_date, co2e_kg, notes, source) "
                         + "VALUES (?, ?, ?, ?, ?, ?, 'CALCULATOR')";

        try (Connection con = DBConnection.getConnection()) {
            boolean originalAutoCommit = con.getAutoCommit();
            con.setAutoCommit(false); // start the transaction
            try (PreparedStatement delete = con.prepareStatement(deleteSql);
                 PreparedStatement insert = con.prepareStatement(insertSql)) {

                delete.setInt(1, userId);
                delete.setObject(2, month.atDay(1));
                delete.setObject(3, month.atEndOfMonth());
                delete.executeUpdate();

                for (CarbonRecord r : records) {
                    insert.setInt(1, userId);            // the logged-in user owns every row
                    insert.setInt(2, r.getFactorId());
                    insert.setDouble(3, r.getQuantity());
                    insert.setObject(4, r.getRecordDate());
                    insert.setDouble(5, r.getCo2eKg());
                    insert.setString(6, r.getNotes());
                    insert.addBatch();
                }
                insert.executeBatch();

                con.commit(); // make both steps permanent together
            } catch (SQLException e) {
                try {
                    con.rollback(); // undo everything from this transaction
                } catch (SQLException rollbackError) {
                    e.addSuppressed(rollbackError); // keep the original error as the main one
                }
                throw e;
            } finally {
                con.setAutoCommit(originalAutoCommit);
            }
        }
    }
}

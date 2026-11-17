package com.carbontracker.database;

import com.carbontracker.config.DatabaseConfig;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * The only class that knows how to open a JDBC connection.
 * DAOs call getConnection() inside a try-with-resources block,
 * which closes the connection automatically.
 */
public final class DBConnection {

    private DBConnection() {
    }

    /** Opens a NEW connection. The caller must close it (try-with-resources). */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(
                DatabaseConfig.URL, DatabaseConfig.USERNAME, DatabaseConfig.PASSWORD);
    }

    /**
     * Quick health check used at start-up.
     *
     * @return null if the connection works, otherwise a readable error message
     */
    public static String testConnection() {
        try (Connection con = getConnection()) {
            return con.isValid(3) ? null : "The connection was opened but is not valid.";
        } catch (SQLException e) {
            return e.getMessage();
        }
    }
}

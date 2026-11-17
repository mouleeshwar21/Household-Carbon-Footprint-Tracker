package com.carbontracker.config;

/**
 * Central place for the MySQL connection settings.
 *
 * EDIT USERNAME and PASSWORD so they match your own MySQL account.
 * Every other class gets its connection settings from here.
 */
public final class DatabaseConfig {

    public static final String HOST = "localhost";
    public static final int PORT = 3306;
    public static final String DATABASE = "carbon_tracker";

    public static final String USERNAME = "root";
    public static final String PASSWORD = "CHANGE_ME";

    /** Full JDBC URL, e.g. jdbc:mysql://localhost:3306/carbon_tracker?... */
    public static final String URL = "jdbc:mysql://" + HOST + ":" + PORT + "/" + DATABASE
            + "?sslMode=DISABLED&allowPublicKeyRetrieval=true";

    private DatabaseConfig() {
        // constants only - no objects needed
    }
}

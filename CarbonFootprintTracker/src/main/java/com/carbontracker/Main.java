package com.carbontracker;

import com.carbontracker.config.AppConfig;
import com.carbontracker.database.DBConnection;
import com.carbontracker.ui.LoginFrame;
import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;

/**
 * Program entry point. Checks the database connection first,
 * then opens the login window.
 */
public class Main {

    public static void main(String[] args) {
        // Swing windows must be created on the Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            String error = DBConnection.testConnection();
            if (error != null) {
                JOptionPane.showMessageDialog(null,
                        "Could not connect to MySQL.\n\n"
                        + "Please check that:\n"
                        + "  1. the MySQL server is running\n"
                        + "  2. the database 'carbon_tracker' exists (run 01_schema.sql)\n"
                        + "  3. USERNAME and PASSWORD in config/DatabaseConfig.java are correct\n\n"
                        + "Details: " + error,
                        AppConfig.APP_NAME, JOptionPane.ERROR_MESSAGE);
                System.exit(1);
            }
            new LoginFrame().setVisible(true);
        });
    }
}

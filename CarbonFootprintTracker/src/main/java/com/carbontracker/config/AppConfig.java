package com.carbontracker.config;

import java.awt.Color;
import java.awt.Font;

/**
 * Application-wide constants: name, colours, fonts and fixed lists.
 * Keeping them here means the whole UI can be restyled from one file.
 */
public final class AppConfig {

    public static final String APP_NAME = "Household Carbon Footprint Tracker";
    public static final String APP_VERSION = "1.0";

    public static final int MIN_PASSWORD_LENGTH = 8;
    public static final int MAX_PASSWORD_LENGTH = 128;

    // Must match the ENUM list of household_profiles.home_type in 01_schema.sql
    public static final String[] HOME_TYPES = {
        "Apartment", "Independent House", "Villa", "Shared Room", "Other"
    };

    // Colours
    public static final Color PRIMARY = new Color(34, 139, 84);
    public static final Color PRIMARY_DARK = new Color(24, 100, 60);
    public static final Color BACKGROUND = new Color(245, 250, 246);
    public static final Color CARD = Color.WHITE;
    public static final Color TEXT_DARK = new Color(33, 37, 41);
    public static final Color TEXT_MUTED = new Color(108, 117, 125);
    public static final Color DANGER = new Color(200, 60, 60);

    // Fonts
    public static final Font FONT_TITLE = new Font("SansSerif", Font.BOLD, 22);
    public static final Font FONT_HEADING = new Font("SansSerif", Font.BOLD, 16);
    public static final Font FONT_NORMAL = new Font("SansSerif", Font.PLAIN, 14);
    public static final Font FONT_BIG_NUMBER = new Font("SansSerif", Font.BOLD, 26);

    private AppConfig() {
    }
}

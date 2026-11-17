package com.carbontracker.config;

import java.awt.Color;

/**
 * The four emission groups shown as cards on the Dashboard.
 *
 * Each group says which rows of the emission_factors table belong to it:
 *   - category      must match emission_factors.category
 *   - activityType  must match emission_factors.activity_type, or is null
 *                   to mean "every activity in that category"
 *
 * Anything that matches no group (food, water, piped gas ...) is shown as "Other",
 * so the four cards plus "Other" always add up to the total.
 */
public enum DashboardMetric {

    //           label            chart label    category       activity   card colour
    ELECTRICITY("Electricity",    "Electricity", "Electricity", null,      new Color(242, 169, 0)),
    LPG         ("LPG",           "LPG",         "Cooking",     "LPG",     new Color(230, 110, 50)),
    TRANSPORT   ("Transportation","Transport",   "Transport",   null,      new Color(52, 130, 200)),
    WASTE       ("Waste",         "Waste",       "Waste",       null,      new Color(120, 130, 110));

    private final String label;
    private final String shortLabel;
    private final String category;
    private final String activityType;
    private final Color accent;

    DashboardMetric(String label, String shortLabel, String category, String activityType, Color accent) {
        this.label = label;
        this.shortLabel = shortLabel;
        this.category = category;
        this.activityType = activityType;
        this.accent = accent;
    }

    public String getLabel() { return label; }
    public String getShortLabel() { return shortLabel; }
    public Color getAccent() { return accent; }

    /** @return true if a record of this category/activity belongs to this group */
    public boolean matches(String recordCategory, String recordActivityType) {
        if (recordCategory == null || !category.equalsIgnoreCase(recordCategory)) {
            return false;
        }
        return activityType == null || activityType.equalsIgnoreCase(recordActivityType);
    }
}

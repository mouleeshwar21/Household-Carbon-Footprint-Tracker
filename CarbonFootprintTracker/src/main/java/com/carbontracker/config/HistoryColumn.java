package com.carbontracker.config;

/**
 * The emission columns of the Monthly History table.
 *
 * Each column says which rows of emission_factors belong to it:
 *   - category        must match emission_factors.category
 *   - activityPrefix  the activity_type must START with this text
 *                     (null = every activity of that category)
 *
 * So the "Petrol" column collects "Petrol car" (per km) AND "Petrol fuel" (per litre).
 * Everything that matches no column is added up in an extra "Other" column,
 * so a row's columns always add up to its total.
 */
public enum HistoryColumn {

    //           column title   category       activity starts with
    ELECTRICITY("Electricity", "Electricity", null),
    LPG        ("LPG",         "Cooking",     "LPG"),
    PETROL     ("Petrol",      "Transport",   "Petrol"),
    DIESEL     ("Diesel",      "Transport",   "Diesel"),
    WASTE      ("Waste",       "Waste",       null);

    private final String title;
    private final String category;
    private final String activityPrefix;

    HistoryColumn(String title, String category, String activityPrefix) {
        this.title = title;
        this.category = category;
        this.activityPrefix = activityPrefix;
    }

    public String getTitle() { return title; }

    /** @return true if a record of this category/activity belongs to this column */
    public boolean matches(String recordCategory, String recordActivityType) {
        if (recordCategory == null || !category.equalsIgnoreCase(recordCategory)) {
            return false;
        }
        if (activityPrefix == null) {
            return true;
        }
        return recordActivityType != null
                && recordActivityType.regionMatches(true, 0, activityPrefix, 0, activityPrefix.length());
    }
}

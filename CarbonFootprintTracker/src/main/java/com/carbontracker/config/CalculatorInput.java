package com.carbontracker.config;

/**
 * The five inputs of the Household Carbon Footprint Calculator.
 *
 * Each input points to ONE row of the emission_factors table, identified by
 * (category, activity_type). The numbers themselves (kg CO2e per unit) and the
 * unit text ("kWh", "litre" ...) live ONLY in the database - never in Java code.
 *
 * To add a new input later: add its factor row in MySQL, then add one line here.
 */
public enum CalculatorInput {

    //           label shown on screen   category in DB   activity_type in DB
    ELECTRICITY("Electricity",           "Electricity",   "Grid electricity"),
    LPG         ("LPG (cooking gas)",    "Cooking",       "LPG"),
    PETROL      ("Petrol",               "Transport",     "Petrol fuel"),
    DIESEL      ("Diesel",               "Transport",     "Diesel fuel"),
    WASTE       ("Waste",                "Waste",         "General waste (landfill)");

    private final String label;
    private final String category;
    private final String activityType;

    CalculatorInput(String label, String category, String activityType) {
        this.label = label;
        this.category = category;
        this.activityType = activityType;
    }

    public String getLabel() { return label; }
    public String getCategory() { return category; }
    public String getActivityType() { return activityType; }
}

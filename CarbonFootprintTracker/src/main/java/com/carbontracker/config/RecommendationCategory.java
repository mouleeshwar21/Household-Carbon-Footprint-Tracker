package com.carbontracker.config;

import java.util.List;

/**
 * The categories the Recommendation module knows how to give tips for.
 *
 * The tips are deliberately general and non-quantified ("may help", "consider") -
 * NOT specific scientific or numeric claims (e.g. no "cuts emissions by 20%"),
 * because this module is offering general awareness, not a scientific guarantee.
 */
public enum RecommendationCategory {

    ELECTRICITY("Electricity", List.of(
            "Switch to LED bulbs and turn off lights and appliances when they are not in use.",
            "Unplug chargers and electronics on standby - they can still draw power.",
            "Consider more energy-efficient appliances when it is time to replace an old one.")),

    COOKING("LPG / Cooking gas", List.of(
            "Use lids on pots and pans - covered cooking generally uses less fuel.",
            "Group cooking tasks together instead of reheating the stove repeatedly.",
            "Keep your stove and burners clean and well maintained for more even heating.")),

    TRANSPORT("Transportation", List.of(
            "Consider walking, cycling, carpooling or public transport for shorter trips.",
            "Combine multiple errands into one trip to reduce the distance driven overall.",
            "Keep your vehicle well maintained - a well-tuned engine tends to run more efficiently.")),

    WASTE("Waste", List.of(
            "Separate recyclables from general waste where your local facilities allow it.",
            "Consider composting food scraps and garden waste if that is available to you.",
            "Reducing single-use packaging can lower the overall waste your household produces.")),

    FOOD("Food", List.of(
            "Planning meals ahead can help reduce food waste.",
            "Adding more plant-based meals to your week is one option some households consider.")),

    WATER("Water", List.of(
            "Fixing leaks and dripping taps can reduce water use over time.",
            "Shorter showers and full loads in washing machines are simple ways to save water.")),

    OTHER("Other activities", List.of(
            "Review the 'Other' entries in your records - small, varied sources can add up.",
            "Small, consistent changes across several categories can be as useful as one big change."));

    private final String label;
    private final List<String> tips;

    RecommendationCategory(String label, List<String> tips) {
        this.label = label;
        this.tips = tips;
    }

    public String getLabel() { return label; }

    /** Up to 'count' tips for this category (in a fixed, sensible order). */
    public List<String> getTips(int count) {
        return tips.subList(0, Math.min(count, tips.size()));
    }
}

package com.carbontracker.model;

/**
 * Maps to the 'household_profiles' table (one profile per user).
 * homeAreaSqft and monthlyTargetKg are optional, so they use wrapper types
 * (Integer / Double) that can hold null.
 */
public class HouseholdProfile {

    private int profileId;
    private int userId;
    private String householdName;
    private int numMembers = 1;
    private String homeType = "Apartment";
    private Integer homeAreaSqft;
    private String city;
    private String country;
    private Double monthlyTargetKg;

    public HouseholdProfile() {
    }

    public int getProfileId() { return profileId; }
    public void setProfileId(int profileId) { this.profileId = profileId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getHouseholdName() { return householdName; }
    public void setHouseholdName(String householdName) { this.householdName = householdName; }

    public int getNumMembers() { return numMembers; }
    public void setNumMembers(int numMembers) { this.numMembers = numMembers; }

    public String getHomeType() { return homeType; }
    public void setHomeType(String homeType) { this.homeType = homeType; }

    public Integer getHomeAreaSqft() { return homeAreaSqft; }
    public void setHomeAreaSqft(Integer homeAreaSqft) { this.homeAreaSqft = homeAreaSqft; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public Double getMonthlyTargetKg() { return monthlyTargetKg; }
    public void setMonthlyTargetKg(Double monthlyTargetKg) { this.monthlyTargetKg = monthlyTargetKg; }
}

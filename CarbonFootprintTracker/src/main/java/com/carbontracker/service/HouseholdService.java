package com.carbontracker.service;

import com.carbontracker.dao.HouseholdProfileDAO;
import com.carbontracker.model.HouseholdProfile;
import java.sql.SQLException;

/** Loads and saves the household profile. */
public class HouseholdService {

    private final HouseholdProfileDAO profileDAO = new HouseholdProfileDAO();

    /** Returns the saved profile, or a blank default one (not yet saved) if none exists. */
    public HouseholdProfile getProfile(int userId) throws ServiceException {
        try {
            HouseholdProfile profile = profileDAO.findByUserId(userId);
            if (profile == null) {
                profile = new HouseholdProfile();
                profile.setUserId(userId);
            }
            return profile;
        } catch (SQLException e) {
            throw new ServiceException("Could not load the household profile: " + e.getMessage(), e);
        }
    }

    public void saveProfile(HouseholdProfile p) throws ServiceException {
        if (p.getNumMembers() < 1 || p.getNumMembers() > 50) {
            throw new ServiceException("Number of members must be between 1 and 50.");
        }
        if (p.getHomeAreaSqft() != null && p.getHomeAreaSqft() <= 0) {
            throw new ServiceException("Home area must be greater than zero.");
        }
        if (p.getMonthlyTargetKg() != null
                && (p.getMonthlyTargetKg() <= 0 || p.getMonthlyTargetKg() > 1_000_000)) {
            throw new ServiceException("Monthly target must be greater than zero (and under 1,000,000 kg).");
        }
        if (tooLong(p.getHouseholdName(), 100) || tooLong(p.getCity(), 100) || tooLong(p.getCountry(), 100)) {
            throw new ServiceException("Name, city and country must each be 100 characters or fewer.");
        }
        try {
            profileDAO.save(p);
        } catch (SQLException e) {
            throw new ServiceException("Could not save the household profile: " + e.getMessage(), e);
        }
    }

    private boolean tooLong(String text, int max) {
        return text != null && text.length() > max;
    }
}

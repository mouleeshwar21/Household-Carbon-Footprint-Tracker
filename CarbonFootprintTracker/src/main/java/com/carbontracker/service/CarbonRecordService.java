package com.carbontracker.service;

import com.carbontracker.dao.CarbonRecordDAO;
import com.carbontracker.dao.EmissionFactorDAO;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.model.EmissionFactor;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

/** Add / edit / delete / list carbon records (with validation and CO2e calculation). */
public class CarbonRecordService {

    private static final double MAX_QUANTITY = 1_000_000;

    private final CarbonRecordDAO recordDAO = new CarbonRecordDAO();
    private final EmissionFactorDAO factorDAO = new EmissionFactorDAO();

    /** Factors for the Add Record drop-downs. */
    public List<EmissionFactor> getActiveFactors() throws ServiceException {
        try {
            return factorDAO.findAllActive();
        } catch (SQLException e) {
            throw new ServiceException("Could not load emission factors: " + e.getMessage(), e);
        }
    }

    public List<CarbonRecord> getRecords(int userId) throws ServiceException {
        try {
            return recordDAO.findByUser(userId);
        } catch (SQLException e) {
            throw new ServiceException("Could not load your records: " + e.getMessage(), e);
        }
    }

    public CarbonRecord addRecord(int userId, EmissionFactor factor, double quantity,
                                  LocalDate date, String notes) throws ServiceException {
        if (factor == null) {
            throw new ServiceException("Please choose an activity.");
        }
        validate(quantity, date, notes);

        CarbonRecord record = new CarbonRecord();
        record.setUserId(userId);
        record.setFactorId(factor.getFactorId());
        record.setQuantity(quantity);
        record.setRecordDate(date);
        record.setNotes(cleanNotes(notes));
        record.setCo2eKg(EmissionCalculator.calculate(quantity, factor)); // stored at entry time

        try {
            record.setRecordId(recordDAO.insert(record));
            return record;
        } catch (SQLException e) {
            throw new ServiceException("Could not save the record: " + e.getMessage(), e);
        }
    }

    /**
     * Changes quantity, date and notes of an existing record.
     * CO2e is recalculated with the factor's current value.
     */
    public void updateRecord(CarbonRecord record, double quantity, LocalDate date, String notes)
            throws ServiceException {
        validate(quantity, date, notes);
        try {
            EmissionFactor factor = factorDAO.findById(record.getFactorId());
            if (factor == null) {
                throw new ServiceException("The emission factor of this record no longer exists.");
            }
            record.setQuantity(quantity);
            record.setRecordDate(date);
            record.setNotes(cleanNotes(notes));
            record.setCo2eKg(EmissionCalculator.calculate(quantity, factor));
            if (!recordDAO.update(record)) {
                throw new ServiceException("This record no longer exists.");
            }
        } catch (SQLException e) {
            throw new ServiceException("Could not update the record: " + e.getMessage(), e);
        }
    }

    public void deleteRecord(int recordId, int userId) throws ServiceException {
        try {
            if (!recordDAO.delete(recordId, userId)) {
                throw new ServiceException("This record no longer exists.");
            }
        } catch (SQLException e) {
            throw new ServiceException("Could not delete the record: " + e.getMessage(), e);
        }
    }

    private void validate(double quantity, LocalDate date, String notes) throws ServiceException {
        if (quantity <= 0 || quantity > MAX_QUANTITY) {
            throw new ServiceException("Quantity must be greater than 0 and at most 1,000,000.");
        }
        if (date == null) {
            throw new ServiceException("Please choose a date.");
        }
        if (date.isAfter(LocalDate.now())) {
            throw new ServiceException("The date cannot be in the future.");
        }
        if (notes != null && notes.trim().length() > 255) {
            throw new ServiceException("Notes must be 255 characters or fewer.");
        }
    }

    private String cleanNotes(String notes) {
        return (notes == null || notes.trim().isEmpty()) ? null : notes.trim();
    }
}

package com.carbontracker.service;

import com.carbontracker.dao.CarbonRecordDAO;
import com.carbontracker.dao.ReportDAO;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.model.CategorySummary;
import com.carbontracker.model.MonthlySummary;
import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.SQLException;
import java.time.YearMonth;
import java.util.List;

/** Totals for the Dashboard and Reports screens, plus CSV export. */
public class ReportService {

    private final ReportDAO reportDAO = new ReportDAO();
    private final CarbonRecordDAO recordDAO = new CarbonRecordDAO();

    public double getMonthTotal(int userId, YearMonth month) throws ServiceException {
        try {
            return reportDAO.totalBetween(userId, month.atDay(1), month.atEndOfMonth());
        } catch (SQLException e) {
            throw new ServiceException("Could not calculate the monthly total: " + e.getMessage(), e);
        }
    }

    public List<CategorySummary> getCategoryBreakdown(int userId, YearMonth month) throws ServiceException {
        try {
            return reportDAO.categoryTotals(userId, month.atDay(1), month.atEndOfMonth());
        } catch (SQLException e) {
            throw new ServiceException("Could not load the category breakdown: " + e.getMessage(), e);
        }
    }

    public List<MonthlySummary> getMonthlyTotals(int userId) throws ServiceException {
        try {
            return reportDAO.monthlyTotals(userId);
        } catch (SQLException e) {
            throw new ServiceException("Could not load the monthly totals: " + e.getMessage(), e);
        }
    }

    /** Writes all of the user's records to a CSV file (opens in Excel). */
    public void exportRecordsToCsv(int userId, File file) throws ServiceException {
        try (BufferedWriter out = Files.newBufferedWriter(file.toPath(), StandardCharsets.UTF_8)) {
            out.write("Date,Category,Activity,Quantity,Unit,CO2e (kg),Notes");
            out.newLine();
            for (CarbonRecord r : recordDAO.findByUser(userId)) {
                out.write(String.join(",",
                        r.getRecordDate().toString(),
                        csv(r.getCategory()),
                        csv(r.getActivityType()),
                        plain(r.getQuantity()),
                        csv(r.getUnit()),
                        plain(r.getCo2eKg()),
                        csv(r.getNotes())));
                out.newLine();
            }
        } catch (IOException | SQLException e) {
            throw new ServiceException("Could not export the records: " + e.getMessage(), e);
        }
    }

    private static String plain(double value) {
        return BigDecimal.valueOf(value).toPlainString();
    }

    /** Quotes a text value for CSV. A leading = + - @ is neutralised so Excel never runs it as a formula. */
    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        String v = value;
        if (!v.isEmpty() && "=+-@".indexOf(v.charAt(0)) >= 0) {
            v = "'" + v;
        }
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}

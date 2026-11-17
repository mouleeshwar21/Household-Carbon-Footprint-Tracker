package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.CategorySummary;
import com.carbontracker.model.MonthlySummary;
import com.carbontracker.service.EmissionCalculator;
import com.carbontracker.service.HouseholdService;
import com.carbontracker.service.ReportService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.io.File;
import java.time.YearMonth;
import java.util.List;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.table.DefaultTableModel;

/** Monthly totals (left), category breakdown of the selected month (right), and CSV export. */
public class ReportsPanel extends JPanel implements Refreshable {

    private final ReportService reportService = new ReportService();
    private final HouseholdService householdService = new HouseholdService();

    private final DefaultTableModel monthModel = readOnlyModel("Month", "Total (kg CO2e)", "Per person (kg)");
    private final DefaultTableModel categoryModel = readOnlyModel("Category", "Total (kg CO2e)", "Share");
    private final JTable monthTable = new JTable(monthModel);
    private final JTable categoryTable = new JTable(categoryModel);
    private final JLabel lblCategoryTitle = UiUtil.headingLabel("Category breakdown");

    private int members = 1;

    public ReportsPanel() {
        setLayout(new BorderLayout(0, 14));
        setBackground(AppConfig.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));
        buildUi();
    }

    private static DefaultTableModel readOnlyModel(String... columns) {
        return new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
    }

    private void buildUi() {
        monthTable.setRowHeight(26);
        categoryTable.setRowHeight(26);
        monthTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        monthTable.getSelectionModel().addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting()) {
                loadBreakdown();
            }
        });

        JPanel left = UiUtil.card(new BorderLayout(0, 10));
        left.add(UiUtil.headingLabel("Monthly totals (select a month)"), BorderLayout.NORTH);
        left.add(new JScrollPane(monthTable), BorderLayout.CENTER);

        JPanel right = UiUtil.card(new BorderLayout(0, 10));
        right.add(lblCategoryTitle, BorderLayout.NORTH);
        right.add(new JScrollPane(categoryTable), BorderLayout.CENTER);

        JPanel tables = new JPanel(new GridLayout(1, 2, 16, 0));
        tables.setOpaque(false);
        tables.add(left);
        tables.add(right);

        JButton btnExport = UiUtil.primaryButton("Export All Records to CSV");
        btnExport.addActionListener(e -> exportCsv());
        JPanel bottom = new JPanel(new FlowLayout(FlowLayout.RIGHT, 0, 0));
        bottom.setOpaque(false);
        bottom.add(btnExport);

        add(UiUtil.titleLabel("Reports"), BorderLayout.NORTH);
        add(tables, BorderLayout.CENTER);
        add(bottom, BorderLayout.SOUTH);
    }

    @Override
    public void refreshData() {
        try {
            int userId = Session.getUserId();
            members = householdService.getProfile(userId).getNumMembers();
            List<MonthlySummary> months = reportService.getMonthlyTotals(userId);

            monthModel.setRowCount(0);
            for (MonthlySummary m : months) {
                monthModel.addRow(new Object[]{
                    m.getMonth(),
                    UiUtil.formatNumber(m.getTotalKg()),
                    UiUtil.formatNumber(EmissionCalculator.perPerson(m.getTotalKg(), members))
                });
            }
            categoryModel.setRowCount(0);
            lblCategoryTitle.setText("Category breakdown");
            if (!months.isEmpty()) {
                monthTable.setRowSelectionInterval(0, 0); // triggers loadBreakdown()
            }
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    private void loadBreakdown() {
        categoryModel.setRowCount(0);
        int row = monthTable.getSelectedRow();
        if (row < 0) {
            lblCategoryTitle.setText("Category breakdown");
            return;
        }
        String monthText = (String) monthModel.getValueAt(monthTable.convertRowIndexToModel(row), 0);
        try {
            YearMonth month = YearMonth.parse(monthText); // "2026-09"
            List<CategorySummary> rows = reportService.getCategoryBreakdown(Session.getUserId(), month);
            double total = 0;
            for (CategorySummary c : rows) {
                total += c.getTotalKg();
            }
            for (CategorySummary c : rows) {
                int percent = total > 0 ? (int) Math.round(c.getTotalKg() / total * 100) : 0;
                categoryModel.addRow(new Object[]{
                    c.getCategory(), UiUtil.formatNumber(c.getTotalKg()), percent + "%"
                });
            }
            lblCategoryTitle.setText("Category breakdown - " + monthText);
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    private void exportCsv() {
        JFileChooser chooser = new JFileChooser();
        chooser.setSelectedFile(new File("carbon_records.csv"));
        if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) {
            return;
        }
        File file = chooser.getSelectedFile();
        if (!file.getName().toLowerCase().endsWith(".csv")) {
            file = new File(file.getAbsolutePath() + ".csv");
        }
        if (file.exists() && !UiUtil.confirm(this, file.getName() + " already exists. Overwrite it?")) {
            return;
        }
        try {
            reportService.exportRecordsToCsv(Session.getUserId(), file);
            UiUtil.showInfo(this, "Exported to:\n" + file.getAbsolutePath());
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }
}

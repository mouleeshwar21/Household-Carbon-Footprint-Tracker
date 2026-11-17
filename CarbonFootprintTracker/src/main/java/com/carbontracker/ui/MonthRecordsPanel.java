package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.service.CarbonRecordService;
import com.carbontracker.service.MonthlyHistoryService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.SwingConstants;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;

/**
 * The individual records of ONE month of the logged-in user.
 * Shown inside a pop-up window by the Monthly History screen:
 *   editable = false  -> "View"  (read only)
 *   editable = true   -> "Edit"  (edit or delete single records)
 */
public class MonthRecordsPanel extends JPanel {

    private static final DateTimeFormatter MONTH_TEXT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final String[] COLUMNS =
            {"ID", "Date", "Category", "Activity", "Quantity", "Unit", "CO2e (kg)", "Notes"};

    private final MonthlyHistoryService historyService = new MonthlyHistoryService();
    private final CarbonRecordService recordService = new CarbonRecordService();

    private final YearMonth month;
    private final boolean editable;
    private final int userId;

    private List<CarbonRecord> records = new ArrayList<>();
    private boolean changed = false;

    private final DefaultTableModel model = new DefaultTableModel(COLUMNS, 0) {
        @Override
        public boolean isCellEditable(int row, int column) {
            return false;
        }

        @Override
        public Class<?> getColumnClass(int column) {
            return switch (column) {
                case 0 -> Integer.class;
                case 4, 6 -> Double.class;
                default -> String.class;
            };
        }
    };
    private final JTable table = new JTable(model);
    private final JLabel lblSummary = UiUtil.mutedLabel(" ");

    /** Call load() after creating the panel to fill it from the database. */
    public MonthRecordsPanel(YearMonth month, boolean editable) {
        this.month = month;
        this.editable = editable;
        this.userId = Session.getUserId(); // always the logged-in user - never a value typed on screen
        setLayout(new BorderLayout(0, 10));
        setPreferredSize(new Dimension(820, 380));
        buildUi();
    }

    private void buildUi() {
        JPanel heading = new JPanel(new BorderLayout(0, 2));
        heading.add(UiUtil.headingLabel(MONTH_TEXT.format(month)), BorderLayout.NORTH);
        heading.add(lblSummary, BorderLayout.SOUTH);

        table.setRowHeight(26);
        table.setAutoCreateRowSorter(true);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.getTableHeader().setReorderingAllowed(false);
        table.removeColumn(table.getColumn("ID")); // keep the id in the model, hide it on screen
        table.getColumn("Date").setPreferredWidth(90);
        table.getColumn("Category").setPreferredWidth(90);
        table.getColumn("Activity").setPreferredWidth(190);
        table.getColumn("Quantity").setPreferredWidth(80);
        table.getColumn("Unit").setPreferredWidth(55);
        table.getColumn("CO2e (kg)").setPreferredWidth(90);
        table.getColumn("Notes").setPreferredWidth(230);
        table.getColumn("Quantity").setCellRenderer(numberRenderer("#,##0.###"));
        table.getColumn("CO2e (kg)").setCellRenderer(numberRenderer("#,##0.00"));

        add(heading, BorderLayout.NORTH);
        JScrollPane scroll = new JScrollPane(table);
        scroll.getViewport().setBackground(Color.WHITE);
        add(scroll, BorderLayout.CENTER);

        if (editable) {
            JButton btnEdit = UiUtil.secondaryButton("Edit Selected Record");
            JButton btnDelete = UiUtil.primaryButton("Delete Selected Record");
            btnDelete.setBackground(AppConfig.DANGER);
            btnEdit.addActionListener(e -> editSelected());
            btnDelete.addActionListener(e -> deleteSelected());

            JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
            buttons.add(btnEdit);
            buttons.add(btnDelete);
            add(buttons, BorderLayout.SOUTH);
        }
    }

    private static DefaultTableCellRenderer numberRenderer(String pattern) {
        DecimalFormat format = new DecimalFormat(pattern, DecimalFormatSymbols.getInstance(Locale.US));
        DefaultTableCellRenderer renderer = new DefaultTableCellRenderer() {
            @Override
            protected void setValue(Object value) {
                setText(value instanceof Number n ? format.format(n.doubleValue()) : "");
            }
        };
        renderer.setHorizontalAlignment(SwingConstants.RIGHT);
        return renderer;
    }

    /** @return true if the user edited or deleted something (so the caller should reload) */
    public boolean wasChanged() {
        return changed;
    }

    /** Loads this month's records of the logged-in user from MySQL. */
    public void load() {
        try {
            showRecords(historyService.getRecords(userId, month));
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    /** Fills the table (public so the screen can be tested without a database). */
    public void showRecords(List<CarbonRecord> list) {
        records = new ArrayList<>(list);
        model.setRowCount(0);
        double total = 0;
        for (CarbonRecord r : records) {
            model.addRow(new Object[]{
                r.getRecordId(),
                r.getRecordDate().toString(),
                r.getCategory(),
                r.getActivityType(),
                r.getQuantity(),
                r.getUnit(),
                r.getCo2eKg(),
                r.getNotes() == null ? "" : r.getNotes()
            });
            total += r.getCo2eKg();
        }
        if (records.isEmpty()) {
            lblSummary.setText("No records in this month.");
        } else {
            lblSummary.setText(records.size() + " record(s) - total " + UiUtil.formatKg(total) + " CO2e"
                    + (editable ? "  |  Select a record, then edit or delete it." : ""));
        }
    }

    private CarbonRecord getSelectedRecord() {
        int viewRow = table.getSelectedRow();
        if (viewRow < 0) {
            UiUtil.showError(this, "Please select a record in the table first.");
            return null;
        }
        int id = (Integer) model.getValueAt(table.convertRowIndexToModel(viewRow), 0);
        for (CarbonRecord r : records) {
            if (r.getRecordId() == id) {
                return r;
            }
        }
        return null;
    }

    private void editSelected() {
        CarbonRecord record = getSelectedRecord();
        if (record != null && RecordEditor.edit(this, record)) {
            changed = true;
            load();
        }
    }

    private void deleteSelected() {
        CarbonRecord record = getSelectedRecord();
        if (record == null) {
            return;
        }
        String question = "Delete this record?\n\n" + record.getRecordDate() + "  -  "
                + record.getActivityType() + "  -  " + UiUtil.formatKg(record.getCo2eKg());
        if (!UiUtil.confirm(this, question)) {
            return;
        }
        try {
            // userId in the SQL WHERE clause: only the owner's record can be deleted
            recordService.deleteRecord(record.getRecordId(), userId);
            changed = true;
            load();
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }
}

package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.service.CarbonRecordService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.SwingConstants;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;

/** Table of all records with a category filter, plus Edit and Delete. */
public class HistoryPanel extends JPanel implements Refreshable {

    private static final String ALL = "All categories";
    private static final String[] COLUMNS =
            {"ID", "Date", "Category", "Activity", "Quantity", "Unit", "CO2e (kg)", "Notes"};

    private final CarbonRecordService service = new CarbonRecordService();
    private List<CarbonRecord> allRecords = new ArrayList<>();
    private boolean updating = false;

    private final DefaultTableModel model = new DefaultTableModel(COLUMNS, 0) {
        @Override
        public boolean isCellEditable(int row, int column) {
            return false; // the table is read-only; editing is done in the Edit dialog
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
    private final JComboBox<String> cboFilter = new JComboBox<>();
    private final JLabel lblSummary = UiUtil.mutedLabel(" ");

    public HistoryPanel() {
        setLayout(new BorderLayout(0, 12));
        setBackground(AppConfig.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));
        buildUi();
    }

    private void buildUi() {
        // ----- top bar: title + filter -----
        cboFilter.addActionListener(e -> {
            if (!updating) {
                applyFilter();
            }
        });
        JPanel filterBox = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        filterBox.setOpaque(false);
        filterBox.add(UiUtil.mutedLabel("Show:"));
        filterBox.add(cboFilter);

        JPanel top = new JPanel(new BorderLayout());
        top.setOpaque(false);
        top.add(UiUtil.titleLabel("History"), BorderLayout.WEST);
        top.add(filterBox, BorderLayout.EAST);

        // ----- table -----
        table.setRowHeight(26);
        table.setAutoCreateRowSorter(true); // click a header to sort
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.getTableHeader().setReorderingAllowed(false);
        table.removeColumn(table.getColumn("ID")); // keep the id in the model, hide it from view
        table.getColumn("Quantity").setCellRenderer(numberRenderer("#,##0.###"));
        table.getColumn("CO2e (kg)").setCellRenderer(numberRenderer("#,##0.00"));
        JScrollPane scroll = new JScrollPane(table);

        // ----- bottom bar: summary + buttons -----
        JButton btnEdit = UiUtil.secondaryButton("Edit Selected");
        JButton btnDelete = UiUtil.primaryButton("Delete Selected");
        btnDelete.setBackground(AppConfig.DANGER);
        btnEdit.addActionListener(e -> editSelected());
        btnDelete.addActionListener(e -> deleteSelected());

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        buttons.setOpaque(false);
        buttons.add(btnEdit);
        buttons.add(btnDelete);

        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setOpaque(false);
        bottom.add(lblSummary, BorderLayout.WEST);
        bottom.add(buttons, BorderLayout.EAST);

        add(top, BorderLayout.NORTH);
        add(scroll, BorderLayout.CENTER);
        add(bottom, BorderLayout.SOUTH);
    }

    /** Right-aligned renderer that formats numbers with a fixed pattern (always a dot as decimal separator). */
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

    @Override
    public void refreshData() {
        try {
            allRecords = service.getRecords(Session.getUserId());
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
            return;
        }
        Object previous = cboFilter.getSelectedItem();

        Set<String> categories = new LinkedHashSet<>();
        for (CarbonRecord r : allRecords) {
            categories.add(r.getCategory());
        }
        updating = true;
        cboFilter.removeAllItems();
        cboFilter.addItem(ALL);
        for (String category : categories) {
            cboFilter.addItem(category);
        }
        if (previous != null) {
            cboFilter.setSelectedItem(previous); // keeps ALL if the old category is gone
        }
        updating = false;
        applyFilter();
    }

    private void applyFilter() {
        String selected = (String) cboFilter.getSelectedItem();
        model.setRowCount(0);
        double total = 0;
        int count = 0;
        for (CarbonRecord r : allRecords) {
            if (selected != null && !ALL.equals(selected) && !selected.equals(r.getCategory())) {
                continue;
            }
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
            count++;
        }
        lblSummary.setText(count + " record(s) shown - total " + UiUtil.formatKg(total) + " CO2e");
    }

    /** @return the record selected in the table, or null (after showing a message) */
    private CarbonRecord getSelectedRecord() {
        int viewRow = table.getSelectedRow();
        if (viewRow < 0) {
            UiUtil.showError(this, "Please select a record in the table first.");
            return null;
        }
        int modelRow = table.convertRowIndexToModel(viewRow); // sorting can change row order
        int id = (Integer) model.getValueAt(modelRow, 0);
        for (CarbonRecord r : allRecords) {
            if (r.getRecordId() == id) {
                return r;
            }
        }
        return null;
    }

    private void editSelected() {
        CarbonRecord record = getSelectedRecord();
        if (record != null && RecordEditor.edit(this, record)) {
            refreshData();
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
            service.deleteRecord(record.getRecordId(), Session.getUserId());
            refreshData();
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }
}

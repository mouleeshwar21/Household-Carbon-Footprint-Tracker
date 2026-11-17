package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.config.HistoryColumn;
import com.carbontracker.model.MonthlyHistoryRow;
import com.carbontracker.service.MonthlyHistoryService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import java.awt.FlowLayout;
import java.awt.GridLayout;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
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
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.ListSelectionModel;
import javax.swing.RowSorter;
import javax.swing.SortOrder;
import javax.swing.SwingConstants;
import javax.swing.border.Border;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;

/**
 * Monthly History: one row per month of the LOGGED-IN user, with buttons
 *   View   - see the month's individual records (read only)
 *   Edit   - change or remove single records of the month
 *   Delete - delete ALL records of the month
 */
public class MonthlyHistoryPanel extends JPanel implements Refreshable {

    private static final DateTimeFormatter MONTH_TEXT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final HistoryColumn[] GROUPS = HistoryColumn.values();
    private static final int OTHER_COLUMN = GROUPS.length + 1;
    private static final int TOTAL_COLUMN = GROUPS.length + 2;
    private static final Border CELL_PADDING = BorderFactory.createEmptyBorder(0, 8, 0, 8);

    private final MonthlyHistoryService service = new MonthlyHistoryService();
    private List<MonthlyHistoryRow> rows = new ArrayList<>();

    private final DefaultTableModel model = new DefaultTableModel(columnTitles(), 0) {
        @Override
        public boolean isCellEditable(int row, int column) {
            return false; // read-only table; changes are made through View / Edit / Delete
        }

        @Override
        public Class<?> getColumnClass(int column) {
            return column == 0 ? YearMonth.class : Double.class; // real types = correct sorting
        }
    };
    private final JTable table = new JTable(model);
    private final JLabel lblSummary = UiUtil.mutedLabel(" ");

    public MonthlyHistoryPanel() {
        setLayout(new BorderLayout(0, 12));
        setBackground(AppConfig.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));
        buildUi();
    }

    private static String[] columnTitles() {
        String[] titles = new String[GROUPS.length + 3];
        titles[0] = "Month";
        for (int i = 0; i < GROUPS.length; i++) {
            titles[i + 1] = GROUPS[i].getTitle();
        }
        titles[OTHER_COLUMN] = "Other";
        titles[TOTAL_COLUMN] = "Total CO2e (kg)";
        return titles;
    }

    // =================================================================
    // Building the screen
    // =================================================================

    private void buildUi() {
        JPanel heading = new JPanel(new GridLayout(0, 1, 0, 4));
        heading.setOpaque(false);
        heading.add(UiUtil.titleLabel("Monthly History"));
        heading.add(UiUtil.mutedLabel("Your emissions month by month, in kg CO2e. "
                + "\"Other\" = food, water, piped gas and other transport."));

        table.setRowHeight(28);
        table.setFont(AppConfig.FONT_NORMAL);
        table.setShowVerticalLines(false);
        table.setGridColor(new Color(225, 230, 227));
        table.getTableHeader().setFont(AppConfig.FONT_NORMAL.deriveFont(Font.BOLD));
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.getTableHeader().setReorderingAllowed(false);
        table.setAutoCreateRowSorter(true); // click a header to sort
        table.getRowSorter().setSortKeys(List.of(new RowSorter.SortKey(0, SortOrder.DESCENDING)));

        table.getColumnModel().getColumn(0).setCellRenderer(monthRenderer());
        table.getColumnModel().getColumn(0).setPreferredWidth(150);
        for (int col = 1; col < TOTAL_COLUMN; col++) {
            table.getColumnModel().getColumn(col).setCellRenderer(numberRenderer(false));
        }
        table.getColumnModel().getColumn(TOTAL_COLUMN).setCellRenderer(numberRenderer(true));
        table.getColumnModel().getColumn(TOTAL_COLUMN).setPreferredWidth(130);

        // Double-click a month = View
        table.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                if (e.getClickCount() == 2 && table.getSelectedRow() >= 0) {
                    openMonth(false);
                }
            }
        });

        JButton btnView = UiUtil.secondaryButton("View");
        JButton btnEdit = UiUtil.secondaryButton("Edit");
        JButton btnDelete = UiUtil.primaryButton("Delete");
        btnDelete.setBackground(AppConfig.DANGER);
        btnView.setToolTipText("See the individual records of the selected month");
        btnEdit.setToolTipText("Change or remove single records of the selected month");
        btnDelete.setToolTipText("Delete ALL records of the selected month");
        btnView.addActionListener(e -> openMonth(false));
        btnEdit.addActionListener(e -> openMonth(true));
        btnDelete.addActionListener(e -> deleteMonth());

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        buttons.setOpaque(false);
        buttons.add(btnView);
        buttons.add(btnEdit);
        buttons.add(btnDelete);

        JPanel bottom = new JPanel(new BorderLayout());
        bottom.setOpaque(false);
        bottom.add(lblSummary, BorderLayout.WEST);
        bottom.add(buttons, BorderLayout.EAST);

        add(heading, BorderLayout.NORTH);
        JScrollPane scroll = new JScrollPane(table);
        scroll.getViewport().setBackground(Color.WHITE); // white, not grey, below the last row
        add(scroll, BorderLayout.CENTER);
        add(bottom, BorderLayout.SOUTH);
    }

    private static DefaultTableCellRenderer monthRenderer() {
        return new PaddedRenderer() {
            @Override
            protected void setValue(Object value) {
                setText(value instanceof YearMonth ym ? MONTH_TEXT.format(ym) : "");
            }
        };
    }

    /** Right-aligned numbers with 2 decimals; zero is shown as "-" to keep the table calm. */
    private static DefaultTableCellRenderer numberRenderer(boolean bold) {
        DecimalFormat format = new DecimalFormat("#,##0.00", DecimalFormatSymbols.getInstance(Locale.US));
        DefaultTableCellRenderer renderer = new PaddedRenderer() {
            @Override
            protected void setValue(Object value) {
                if (value instanceof Number n && n.doubleValue() != 0) {
                    setText(format.format(n.doubleValue()));
                } else {
                    setText("-");
                }
                setFont(bold ? AppConfig.FONT_NORMAL.deriveFont(Font.BOLD) : AppConfig.FONT_NORMAL);
            }
        };
        renderer.setHorizontalAlignment(SwingConstants.RIGHT);
        return renderer;
    }

    // =================================================================
    // Loading and showing data
    // =================================================================

    @Override
    public void refreshData() {
        try {
            // The user id always comes from the login session, never from anything typed on screen
            showRows(service.getMonthlyRows(Session.getUserId()));
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    /** Fills the table (public so the screen can be tested without a database). */
    public void showRows(List<MonthlyHistoryRow> newRows) {
        rows = new ArrayList<>(newRows);
        model.setRowCount(0);
        double grandTotal = 0;
        for (MonthlyHistoryRow r : rows) {
            Object[] cells = new Object[GROUPS.length + 3];
            cells[0] = r.getMonth();
            for (int i = 0; i < GROUPS.length; i++) {
                cells[i + 1] = r.getValue(GROUPS[i]);
            }
            cells[OTHER_COLUMN] = r.getOther();
            cells[TOTAL_COLUMN] = r.getTotal();
            model.addRow(cells);
            grandTotal += r.getTotal();
        }
        if (rows.isEmpty()) {
            lblSummary.setText("No records yet. Add some in Add Record or the Calculator.");
        } else {
            lblSummary.setText(rows.size() + " month(s) - all-time total " + UiUtil.formatKg(grandTotal) + " CO2e");
        }
    }

    // =================================================================
    // Buttons
    // =================================================================

    /** @return the selected month's row, or null (after showing a message) */
    private MonthlyHistoryRow getSelectedRow() {
        int viewRow = table.getSelectedRow();
        if (viewRow < 0) {
            UiUtil.showError(this, "Please select a month in the table first.");
            return null;
        }
        YearMonth month = (YearMonth) model.getValueAt(table.convertRowIndexToModel(viewRow), 0);
        for (MonthlyHistoryRow r : rows) {
            if (r.getMonth().equals(month)) {
                return r;
            }
        }
        return null;
    }

    /** View (editable = false) or Edit (editable = true) the individual records of the selected month. */
    private void openMonth(boolean editable) {
        MonthlyHistoryRow row = getSelectedRow();
        if (row == null) {
            return;
        }
        MonthRecordsPanel panel = new MonthRecordsPanel(row.getMonth(), editable);
        panel.load();
        String title = (editable ? "Edit records - " : "Records - ") + MONTH_TEXT.format(row.getMonth());
        JOptionPane.showOptionDialog(this, panel, title, JOptionPane.DEFAULT_OPTION,
                JOptionPane.PLAIN_MESSAGE, null, new Object[]{"Close"}, "Close");
        if (panel.wasChanged()) {
            refreshData();
        }
    }

    private void deleteMonth() {
        MonthlyHistoryRow row = getSelectedRow();
        if (row == null) {
            return;
        }
        String monthText = MONTH_TEXT.format(row.getMonth());
        String message = "Delete ALL " + row.getRecordCount() + " record(s) of " + monthText
                + " (" + UiUtil.formatKg(row.getTotal()) + " CO2e)?\n\n"
                + "This cannot be undone. Other months are not affected.";

        // "Cancel" is the default button, so pressing Enter by accident does not delete anything
        Object[] options = {"Delete", "Cancel"};
        int choice = JOptionPane.showOptionDialog(this, message, "Delete " + monthText,
                JOptionPane.DEFAULT_OPTION, JOptionPane.WARNING_MESSAGE, null, options, options[1]);
        if (choice != 0) {
            return;
        }
        try {
            int deleted = service.deleteMonth(Session.getUserId(), row.getMonth());
            UiUtil.showInfo(this, "Deleted " + deleted + " record(s) from " + monthText + ".");
            refreshData();
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    /** A table cell renderer with a little space left and right of the text. */
    private static class PaddedRenderer extends DefaultTableCellRenderer {
        @Override
        public Component getTableCellRendererComponent(JTable table, Object value, boolean isSelected,
                                                       boolean hasFocus, int row, int column) {
            Component component = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
            setBorder(CELL_PADDING); // the default renderer resets the border, so set it every time
            return component;
        }
    }
}

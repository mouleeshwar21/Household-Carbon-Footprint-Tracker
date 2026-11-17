package com.carbontracker.ui;

import com.carbontracker.model.CarbonRecord;
import com.carbontracker.service.CarbonRecordService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import com.carbontracker.utils.Validator;
import java.awt.Component;
import java.awt.GridBagLayout;
import java.math.BigDecimal;
import java.time.LocalDate;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.JTextField;

/**
 * The "Edit record" pop-up, shared by the History screen and the Monthly History screen
 * so both behave exactly the same way.
 */
public final class RecordEditor {

    private static final CarbonRecordService SERVICE = new CarbonRecordService();

    private RecordEditor() {
    }

    /**
     * Shows a form to change the quantity, date and notes of one record and saves the change.
     *
     * @return true if the caller should reload its data (false = nothing happened)
     */
    public static boolean edit(Component parent, CarbonRecord record) {
        // Safety check: a user may only edit their own records
        if (record.getUserId() != Session.getUserId()) {
            UiUtil.showError(parent, "You can only edit your own records.");
            return false;
        }

        JTextField txtQuantity = new JTextField(
                BigDecimal.valueOf(record.getQuantity()).stripTrailingZeros().toPlainString(), 12);
        JSpinner spnDate = UiUtil.dateSpinner(record.getRecordDate());
        JTextField txtNotes = new JTextField(record.getNotes() == null ? "" : record.getNotes(), 24);

        JPanel form = new JPanel(new GridBagLayout());
        UiUtil.addRow(form, 0, "Activity", new JLabel(record.getActivityType() + " (" + record.getUnit() + ")"));
        UiUtil.addRow(form, 1, "Quantity", txtQuantity);
        UiUtil.addRow(form, 2, "Date", spnDate);
        UiUtil.addRow(form, 3, "Notes", txtNotes);

        int choice = JOptionPane.showConfirmDialog(parent, form, "Edit record",
                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (choice != JOptionPane.OK_OPTION) {
            return false;
        }

        Double quantity = Validator.parseNonNegativeNumber(txtQuantity.getText());
        if (quantity == null || quantity <= 0) {
            UiUtil.showError(parent, "Please enter a quantity greater than zero (numbers only).");
            return false;
        }
        try {
            LocalDate date = UiUtil.getSpinnerDate(spnDate);
            SERVICE.updateRecord(record, quantity, date, txtNotes.getText());
        } catch (ServiceException ex) {
            UiUtil.showError(parent, ex.getMessage());
        }
        // Reload in both cases: after an error the in-memory record may hold half-edited values.
        return true;
    }
}

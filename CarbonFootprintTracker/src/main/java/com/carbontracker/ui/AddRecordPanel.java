package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.CarbonRecord;
import com.carbontracker.model.EmissionFactor;
import com.carbontracker.service.CarbonRecordService;
import com.carbontracker.service.EmissionCalculator;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import com.carbontracker.utils.Validator;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.GridBagLayout;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;

/** Form for logging one activity (e.g. "240 kWh of electricity on 2026-08-05"). */
public class AddRecordPanel extends JPanel implements Refreshable {

    private final CarbonRecordService service = new CarbonRecordService();

    private List<EmissionFactor> factors = new ArrayList<>();
    private boolean updating = false; // true while we refill combo boxes (ignore their events)

    private final JComboBox<String> cboCategory = new JComboBox<>();
    private final JComboBox<EmissionFactor> cboActivity = new JComboBox<>();
    private final JLabel lblUnit = new JLabel("-");
    private final JTextField txtQuantity = new JTextField(12);
    private final JSpinner spnDate = UiUtil.dateSpinner(LocalDate.now());
    private final JTextField txtNotes = new JTextField(24);
    private final JLabel lblPreview = new JLabel("Estimated emissions: -");

    public AddRecordPanel() {
        setLayout(new BorderLayout(0, 16));
        setBackground(AppConfig.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));
        buildUi();
        addListeners();
    }

    private void buildUi() {
        cboCategory.setPreferredSize(new Dimension(320, 28));
        cboActivity.setPreferredSize(new Dimension(320, 28));
        lblPreview.setFont(AppConfig.FONT_HEADING);
        lblPreview.setForeground(AppConfig.PRIMARY_DARK);

        JPanel form = UiUtil.card(new GridBagLayout());
        UiUtil.addRow(form, 0, "Category", cboCategory);
        UiUtil.addRow(form, 1, "Activity", cboActivity);
        UiUtil.addRow(form, 2, "Unit", lblUnit);
        UiUtil.addRow(form, 3, "Quantity", txtQuantity);
        UiUtil.addRow(form, 4, "Date", spnDate);
        UiUtil.addRow(form, 5, "Notes (optional)", txtNotes);
        UiUtil.addRow(form, 6, "", lblPreview);

        JButton btnSave = UiUtil.primaryButton("Save Record");
        btnSave.addActionListener(e -> save());
        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        buttons.setOpaque(false);
        buttons.add(btnSave);

        JPanel holder = new JPanel(new BorderLayout(0, 14));
        holder.setOpaque(false);
        holder.add(form, BorderLayout.CENTER);
        holder.add(buttons, BorderLayout.SOUTH);

        JPanel left = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        left.setOpaque(false);
        left.add(holder);

        add(UiUtil.titleLabel("Add Record"), BorderLayout.NORTH);
        add(left, BorderLayout.CENTER);
    }

    private void addListeners() {
        cboCategory.addActionListener(e -> {
            if (!updating) {
                fillActivities();
            }
        });
        cboActivity.addActionListener(e -> {
            if (!updating) {
                onActivityChanged();
            }
        });
        txtQuantity.getDocument().addDocumentListener(new DocumentListener() {
            @Override public void insertUpdate(DocumentEvent e) { updatePreview(); }
            @Override public void removeUpdate(DocumentEvent e) { updatePreview(); }
            @Override public void changedUpdate(DocumentEvent e) { updatePreview(); }
        });
    }

    @Override
    public void refreshData() {
        try {
            factors = service.getActiveFactors();
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
            return;
        }
        Object previous = cboCategory.getSelectedItem();

        Set<String> categories = new LinkedHashSet<>();
        for (EmissionFactor f : factors) {
            categories.add(f.getCategory());
        }
        updating = true;
        cboCategory.removeAllItems();
        for (String category : categories) {
            cboCategory.addItem(category);
        }
        if (previous != null) {
            cboCategory.setSelectedItem(previous);
        }
        updating = false;
        fillActivities();
    }

    /** Fills the Activity drop-down with the factors of the chosen category. */
    private void fillActivities() {
        String category = (String) cboCategory.getSelectedItem();
        updating = true;
        cboActivity.removeAllItems();
        for (EmissionFactor f : factors) {
            if (f.getCategory().equals(category)) {
                cboActivity.addItem(f);
            }
        }
        updating = false;
        onActivityChanged();
    }

    private void onActivityChanged() {
        EmissionFactor factor = (EmissionFactor) cboActivity.getSelectedItem();
        lblUnit.setText(factor == null ? "-" : factor.getUnit());
        updatePreview();
    }

    /** Shows the live CO2e estimate while the user types the quantity. */
    private void updatePreview() {
        EmissionFactor factor = (EmissionFactor) cboActivity.getSelectedItem();
        Double quantity = Validator.parsePositiveDouble(txtQuantity.getText());
        if (factor == null || quantity == null) {
            lblPreview.setText("Estimated emissions: -");
        } else {
            lblPreview.setText("Estimated emissions: "
                    + UiUtil.formatKg(EmissionCalculator.calculate(quantity, factor)) + " CO2e");
        }
    }

    private void save() {
        EmissionFactor factor = (EmissionFactor) cboActivity.getSelectedItem();
        if (factor == null) {
            UiUtil.showError(this, "Please choose an activity.");
            return;
        }
        Double quantity = Validator.parsePositiveDouble(txtQuantity.getText());
        if (quantity == null) {
            UiUtil.showError(this, "Please enter a quantity greater than zero (numbers only).");
            return;
        }
        try {
            CarbonRecord saved = service.addRecord(Session.getUserId(), factor, quantity,
                    UiUtil.getSpinnerDate(spnDate), txtNotes.getText());
            UiUtil.showInfo(this, "Saved! This entry adds " + UiUtil.formatKg(saved.getCo2eKg()) + " CO2e.");
            txtQuantity.setText("");
            txtNotes.setText("");
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }
}

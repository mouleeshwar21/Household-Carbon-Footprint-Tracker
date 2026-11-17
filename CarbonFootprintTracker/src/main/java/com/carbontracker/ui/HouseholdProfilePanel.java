package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.HouseholdProfile;
import com.carbontracker.service.HouseholdService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import com.carbontracker.utils.Validator;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.GridBagLayout;
import java.math.BigDecimal;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;

/** Form for the user's household details and optional monthly emissions target. */
public class HouseholdProfilePanel extends JPanel implements Refreshable {

    private final HouseholdService service = new HouseholdService();

    private final JTextField txtName = new JTextField(24);
    private final JSpinner spnMembers = new JSpinner(new SpinnerNumberModel(1, 1, 50, 1));
    private final JComboBox<String> cboHomeType = new JComboBox<>(AppConfig.HOME_TYPES);
    private final JTextField txtArea = new JTextField(12);
    private final JTextField txtCity = new JTextField(24);
    private final JTextField txtCountry = new JTextField(24);
    private final JTextField txtTarget = new JTextField(12);

    public HouseholdProfilePanel() {
        setLayout(new BorderLayout(0, 16));
        setBackground(AppConfig.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));
        buildUi();
    }

    private void buildUi() {
        cboHomeType.setPreferredSize(new Dimension(320, 28));

        JPanel form = UiUtil.card(new GridBagLayout());
        UiUtil.addRow(form, 0, "Household name", txtName);
        UiUtil.addRow(form, 1, "Number of members", spnMembers);
        UiUtil.addRow(form, 2, "Home type", cboHomeType);
        UiUtil.addRow(form, 3, "Home area (sq ft, optional)", txtArea);
        UiUtil.addRow(form, 4, "City (optional)", txtCity);
        UiUtil.addRow(form, 5, "Country (optional)", txtCountry);
        UiUtil.addRow(form, 6, "Monthly target (kg CO2e, optional)", txtTarget);

        JButton btnSave = UiUtil.primaryButton("Save Profile");
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

        add(UiUtil.titleLabel("Household Profile"), BorderLayout.NORTH);
        add(left, BorderLayout.CENTER);
    }

    @Override
    public void refreshData() {
        try {
            HouseholdProfile p = service.getProfile(Session.getUserId());
            txtName.setText(nullToEmpty(p.getHouseholdName()));
            spnMembers.setValue(p.getNumMembers());
            cboHomeType.setSelectedItem(p.getHomeType());
            txtArea.setText(p.getHomeAreaSqft() == null ? "" : String.valueOf(p.getHomeAreaSqft()));
            txtCity.setText(nullToEmpty(p.getCity()));
            txtCountry.setText(nullToEmpty(p.getCountry()));
            txtTarget.setText(p.getMonthlyTargetKg() == null ? ""
                    : BigDecimal.valueOf(p.getMonthlyTargetKg()).stripTrailingZeros().toPlainString());
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    private void save() {
        Integer area = null;
        if (!Validator.isBlank(txtArea.getText())) {
            area = Validator.parsePositiveInt(txtArea.getText());
            if (area == null) {
                UiUtil.showError(this, "Home area must be a whole number greater than zero, or left empty.");
                return;
            }
        }
        Double target = null;
        if (!Validator.isBlank(txtTarget.getText())) {
            target = Validator.parsePositiveDouble(txtTarget.getText());
            if (target == null) {
                UiUtil.showError(this, "Monthly target must be a number greater than zero, or left empty.");
                return;
            }
        }

        HouseholdProfile p = new HouseholdProfile();
        p.setUserId(Session.getUserId());
        p.setHouseholdName(emptyToNull(txtName.getText()));
        p.setNumMembers((Integer) spnMembers.getValue());
        p.setHomeType((String) cboHomeType.getSelectedItem());
        p.setHomeAreaSqft(area);
        p.setCity(emptyToNull(txtCity.getText()));
        p.setCountry(emptyToNull(txtCountry.getText()));
        p.setMonthlyTargetKg(target);

        try {
            service.saveProfile(p);
            UiUtil.showInfo(this, "Household profile saved.");
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    private static String nullToEmpty(String text) {
        return text == null ? "" : text;
    }

    private static String emptyToNull(String text) {
        return Validator.isBlank(text) ? null : text.trim();
    }
}

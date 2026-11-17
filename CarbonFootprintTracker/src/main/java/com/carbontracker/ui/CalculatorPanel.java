package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.config.CalculatorInput;
import com.carbontracker.model.CalculationLine;
import com.carbontracker.model.CalculationResult;
import com.carbontracker.model.EmissionFactor;
import com.carbontracker.model.SavedCalculation;
import com.carbontracker.model.Recommendation;
import com.carbontracker.service.CalculatorService;
import com.carbontracker.service.HouseholdService;
import com.carbontracker.service.RecommendationService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import com.carbontracker.utils.Validator;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.Insets;
import java.math.BigDecimal;
import java.text.ParseException;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.Locale;
import java.util.Map;
import javax.swing.BorderFactory;
import javax.swing.DefaultListCellRenderer;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.SpinnerNumberModel;
import javax.swing.SwingConstants;

/**
 * Household Carbon Footprint Calculator.
 * Calculate = show the emissions.  Save = validate, calculate and store the month for the logged-in user.
 */
public class CalculatorPanel extends JPanel implements Refreshable {

    private static final DateTimeFormatter MONTH_TEXT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final int MONTHS_IN_LIST = 24;

    private final CalculatorService service = new CalculatorService();
    private final HouseholdService householdService = new HouseholdService();
    private final RecommendationService recommendationService = new RecommendationService();

    private final Map<CalculatorInput, JTextField> fields = new EnumMap<>(CalculatorInput.class);
    private final Map<CalculatorInput, JLabel> unitLabels = new EnumMap<>(CalculatorInput.class);
    private final Map<CalculatorInput, JLabel> factorLabels = new EnumMap<>(CalculatorInput.class);
    private final Map<CalculatorInput, JLabel> resultLabels = new EnumMap<>(CalculatorInput.class);
    private final Map<CalculatorInput, JLabel> shareLabels = new EnumMap<>(CalculatorInput.class);

    private final JSpinner spnPeople = new JSpinner(new SpinnerNumberModel(1, 1, 50, 1));
    private final JComboBox<YearMonth> cboMonth = new JComboBox<>();
    private final JLabel lblTotal = new JLabel("-");
    private final JLabel lblPerPerson = new JLabel("-");
    private final RecommendationsPanel recommendationsPanel = new RecommendationsPanel();

    private boolean updatingPeople = false;   // true while WE change the spinner
    private boolean peopleOverridden = false; // true once the USER changed it

    public CalculatorPanel() {
        setLayout(new BorderLayout(0, 16));
        setBackground(AppConfig.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 20, 24));
        buildUi();
    }

    // =================================================================
    // Building the screen
    // =================================================================

    private void buildUi() {
        JPanel heading = new JPanel(new GridLayout(0, 1, 0, 4));
        heading.setOpaque(false);
        heading.add(UiUtil.titleLabel("Carbon Footprint Calculator"));
        heading.add(UiUtil.mutedLabel("Enter your household's usage for ONE month. Leave a field empty if it does not apply."));

        JPanel below = new JPanel(new BorderLayout(0, 16));
        below.setOpaque(false);
        below.add(buildSummary(), BorderLayout.NORTH);
        below.add(buildButtonBar(), BorderLayout.CENTER);
        below.add(recommendationsPanel, BorderLayout.SOUTH);

        JPanel stack = new JPanel(new BorderLayout(0, 16));
        stack.setOpaque(false);
        stack.add(buildInputCard(), BorderLayout.NORTH);
        stack.add(below, BorderLayout.CENTER);

        JScrollPane scroll = new JScrollPane(stack);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        scroll.setOpaque(false);
        scroll.getViewport().setOpaque(false);
        scroll.getVerticalScrollBar().setUnitIncrement(16);

        add(heading, BorderLayout.NORTH);
        add(scroll, BorderLayout.CENTER);
    }

    private JPanel buildInputCard() {
        JPanel card = UiUtil.card(new GridBagLayout());

        String[] headers = {"Source", "Monthly usage", "Unit", "Emission factor", "CO2e (kg)", "Share"};
        for (int col = 0; col < headers.length; col++) {
            JLabel header = UiUtil.mutedLabel(headers[col]);
            if (col >= 4) {
                header.setHorizontalAlignment(SwingConstants.RIGHT);
                header.setPreferredSize(new Dimension(col == 4 ? 100 : 60, 24));
            }
            card.add(header, cell(col, 0));
        }

        int row = 1;
        for (CalculatorInput input : CalculatorInput.values()) {
            JLabel name = new JLabel(input.getLabel());
            name.setFont(AppConfig.FONT_NORMAL);

            JTextField field = new JTextField(10);
            field.setHorizontalAlignment(SwingConstants.RIGHT);
            field.addActionListener(e -> calculate()); // Enter key = Calculate

            JLabel unit = new JLabel("-");
            unit.setFont(AppConfig.FONT_NORMAL);
            JLabel factor = UiUtil.mutedLabel("-");

            JLabel result = new JLabel("-");
            result.setFont(AppConfig.FONT_HEADING);
            result.setHorizontalAlignment(SwingConstants.RIGHT);
            result.setPreferredSize(new Dimension(100, 24));

            JLabel share = UiUtil.mutedLabel("-");
            share.setHorizontalAlignment(SwingConstants.RIGHT);
            share.setPreferredSize(new Dimension(60, 24));

            fields.put(input, field);
            unitLabels.put(input, unit);
            factorLabels.put(input, factor);
            resultLabels.put(input, result);
            shareLabels.put(input, share);

            card.add(name, cell(0, row));
            card.add(field, cell(1, row));
            card.add(unit, cell(2, row));
            card.add(factor, cell(3, row));
            card.add(result, cell(4, row));
            card.add(share, cell(5, row));
            row++;
        }
        return card;
    }

    private GridBagConstraints cell(int col, int row) {
        GridBagConstraints c = new GridBagConstraints();
        c.gridx = col;
        c.gridy = row;
        c.insets = new Insets(6, 8, 6, 8);
        c.anchor = GridBagConstraints.WEST;
        if (col == 1) {
            c.fill = GridBagConstraints.HORIZONTAL;
        }
        if (col == 3) {
            c.weightx = 1;
            c.fill = GridBagConstraints.HORIZONTAL;
        }
        return c;
    }

    private JPanel buildSummary() {
        spnPeople.setPreferredSize(new Dimension(110, 44));
        ((JSpinner.DefaultEditor) spnPeople.getEditor()).getTextField().setFont(AppConfig.FONT_BIG_NUMBER);
        spnPeople.addChangeListener(e -> {
            if (!updatingPeople) {
                peopleOverridden = true;
            }
        });

        JPanel spinnerHolder = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
        spinnerHolder.setOpaque(false);
        spinnerHolder.add(spnPeople);

        JPanel peopleCard = UiUtil.card(new BorderLayout(0, 6));
        peopleCard.add(UiUtil.mutedLabel("People in household"), BorderLayout.NORTH);
        peopleCard.add(spinnerHolder, BorderLayout.CENTER);
        peopleCard.add(UiUtil.mutedLabel("Starts from your Household Profile"), BorderLayout.SOUTH);

        JPanel summary = new JPanel(new GridLayout(1, 3, 16, 0));
        summary.setOpaque(false);
        summary.add(UiUtil.statCard("Total CO2e per month", lblTotal));
        summary.add(peopleCard);
        summary.add(UiUtil.statCard("CO2e per person per month", lblPerPerson));
        return summary;
    }

    private JPanel buildButtonBar() {
        cboMonth.setRenderer(new DefaultListCellRenderer() {
            @Override
            public Component getListCellRendererComponent(JList<?> list, Object value, int index,
                                                          boolean isSelected, boolean cellHasFocus) {
                String text = value instanceof YearMonth ym ? MONTH_TEXT.format(ym) : "";
                return super.getListCellRendererComponent(list, text, index, isSelected, cellHasFocus);
            }
        });

        JPanel monthBox = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        monthBox.setOpaque(false);
        monthBox.add(UiUtil.mutedLabel("Save for month:"));
        monthBox.add(cboMonth);

        JButton btnClear = UiUtil.secondaryButton("Clear");
        JButton btnCalculate = UiUtil.secondaryButton("Calculate");
        JButton btnSave = UiUtil.primaryButton("Save");
        btnClear.addActionListener(e -> clear());
        btnCalculate.addActionListener(e -> calculate());
        btnSave.addActionListener(e -> save());

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        buttons.setOpaque(false);
        buttons.add(btnClear);
        buttons.add(btnCalculate);
        buttons.add(btnSave);

        JPanel bar = new JPanel(new BorderLayout());
        bar.setOpaque(false);
        bar.add(monthBox, BorderLayout.WEST);
        bar.add(buttons, BorderLayout.EAST);
        return bar;
    }

    // =================================================================
    // Loading data
    // =================================================================

    @Override
    public void refreshData() {
        loadMonths();
        try {
            loadPeopleFromProfile(false);
            Map<CalculatorInput, EmissionFactor> factors = service.getFactors();
            for (CalculatorInput input : CalculatorInput.values()) {
                EmissionFactor f = factors.get(input);
                unitLabels.get(input).setText(f.getUnit());
                factorLabels.get(input).setText(
                        BigDecimal.valueOf(f.getFactorKgCo2e()).stripTrailingZeros().toPlainString()
                        + " kg CO2e per " + f.getUnit());
                fields.get(input).setToolTipText("Total " + input.getLabel() + " used in one month, in " + f.getUnit());
            }
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    /** Fills the month list: this month and the 23 before it. Keeps the user's choice. */
    private void loadMonths() {
        Object previous = cboMonth.getSelectedItem();
        cboMonth.removeAllItems();
        YearMonth now = YearMonth.now();
        for (int i = 0; i < MONTHS_IN_LIST; i++) {
            cboMonth.addItem(now.minusMonths(i));
        }
        if (previous != null) {
            cboMonth.setSelectedItem(previous);
        }
    }

    /** Sets the people spinner from the household profile (unless the user changed it, or force is true). */
    private void loadPeopleFromProfile(boolean force) throws ServiceException {
        if (peopleOverridden && !force) {
            return;
        }
        int members = householdService.getProfile(Session.getUserId()).getNumMembers();
        updatingPeople = true;
        spnPeople.setValue(members);
        updatingPeople = false;
        peopleOverridden = false;
    }

    // =================================================================
    // Buttons
    // =================================================================

    private void calculate() {
        Map<CalculatorInput, Double> quantities = readQuantities();
        if (quantities == null) {
            return; // an error message was already shown
        }
        try {
            showResult(service.calculate(quantities, readPeople()));
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    /**
     * Save = 1. validate  2. calculate  3. store for the logged-in user  4. tell the user.
     * It does not matter whether Calculate was clicked first.
     */
    private void save() {
        // 1. Validate the input
        Map<CalculatorInput, Double> quantities = readQuantities();
        if (quantities == null) {
            return;
        }
        YearMonth month = (YearMonth) cboMonth.getSelectedItem();
        if (month == null) {
            UiUtil.showError(this, "Please choose the month to save for.");
            return;
        }
        int people = readPeople();
        int userId = Session.getUserId();
        String monthText = MONTH_TEXT.format(month);

        try {
            // 2. Calculate (factors are read from MySQL)
            CalculationResult result = service.calculate(quantities, people);
            showResult(result);

            // 3a. Do not silently double-count: ask before replacing an earlier save
            SavedCalculation existing = service.findSaved(userId, month);
            if (existing != null) {
                boolean replace = UiUtil.confirm(this,
                        "A calculation for " + monthText + " is already saved ("
                        + existing.getRecordCount() + " records, "
                        + UiUtil.formatKg(existing.getTotalKg()) + " CO2e).\n\n"
                        + "Replace it with these values?\n"
                        + "(Records you added manually are not affected.)");
                if (!replace) {
                    return;
                }
            }

            // 3b. Store it - associated with the logged-in user
            int saved = service.saveCalculation(userId, month, result);

            // 4. Success message
            UiUtil.showInfo(this, "Saved " + saved + " record(s) for " + monthText + ".\n\n"
                    + "Total: " + UiUtil.formatKg(result.getTotalKg()) + " CO2e\n"
                    + "Per person (" + people + "): " + UiUtil.formatKg(result.getPerPersonKg()) + " CO2e\n\n"
                    + "You can see them in the History tab and on the Dashboard.");
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        } catch (RuntimeException ex) {
            // Safety net: a bug should show a message, not fail silently
            UiUtil.showError(this, "Unexpected error: " + ex.getMessage());
        }
    }

    private void clear() {
        for (CalculatorInput input : CalculatorInput.values()) {
            fields.get(input).setText("");
            resultLabels.get(input).setText("-");
            shareLabels.get(input).setText("-");
        }
        lblTotal.setText("-");
        lblPerPerson.setText("-");
        try {
            loadPeopleFromProfile(true);
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
        fields.get(CalculatorInput.ELECTRICITY).requestFocusInWindow();
    }

    // =================================================================
    // Helpers
    // =================================================================

    /**
     * Reads the five text fields. An empty field means 0.
     *
     * @return the quantities, or null (after showing an error) if a field is not a valid number
     */
    private Map<CalculatorInput, Double> readQuantities() {
        Map<CalculatorInput, Double> quantities = new EnumMap<>(CalculatorInput.class);
        for (CalculatorInput input : CalculatorInput.values()) {
            JTextField field = fields.get(input);
            if (Validator.isBlank(field.getText())) {
                quantities.put(input, 0.0);
                continue;
            }
            Double value = Validator.parseNonNegativeNumber(field.getText());
            if (value == null) {
                UiUtil.showError(this, input.getLabel()
                        + ": please enter a plain number that is 0 or more (for example 250 or 14.2).");
                field.requestFocusInWindow();
                field.selectAll();
                return null;
            }
            quantities.put(input, value);
        }
        return quantities;
    }

    private int readPeople() {
        try {
            spnPeople.commitEdit(); // accept a number the user typed but did not confirm
        } catch (ParseException ignored) {
            // keep the last valid value
        }
        return (Integer) spnPeople.getValue();
    }

    private void showResult(CalculationResult result) {
        recommendationsPanel.showRecommendations(recommendationService.fromCalculation(result));
        for (CalculationLine line : result.getLines()) {
            boolean used = line.getQuantity() > 0;
            resultLabels.get(line.getInput()).setText(used ? UiUtil.formatNumber(line.getCo2eKg()) : "-");
            shareLabels.get(line.getInput()).setText(
                    used ? String.format(Locale.US, "%.1f%%", line.getSharePercent()) : "-");
        }
        lblTotal.setText(UiUtil.formatKg(result.getTotalKg()));
        lblPerPerson.setText(UiUtil.formatKg(result.getPerPersonKg()));
    }
}

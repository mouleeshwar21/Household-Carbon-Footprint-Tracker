package com.carbontracker.utils;

import com.carbontracker.config.AppConfig;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.Insets;
import java.awt.LayoutManager;
import java.text.ParseException;
import java.time.LocalDate;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JSpinner;
import javax.swing.SpinnerDateModel;
import javax.swing.border.Border;

/** Shared Swing helpers so every screen looks the same and code is not repeated. */
public final class UiUtil {

    private UiUtil() {
    }

    // ---------- Buttons and labels ----------

    public static JButton primaryButton(String text) {
        JButton button = new JButton(text);
        button.setBackground(AppConfig.PRIMARY);
        button.setForeground(Color.WHITE);
        button.setFont(AppConfig.FONT_NORMAL.deriveFont(Font.BOLD));
        button.setFocusPainted(false);
        button.setOpaque(true);
        button.setBorder(BorderFactory.createEmptyBorder(8, 18, 8, 18));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        return button;
    }

    public static JButton secondaryButton(String text) {
        JButton button = new JButton(text);
        button.setBackground(Color.WHITE);
        button.setForeground(AppConfig.TEXT_DARK);
        button.setFont(AppConfig.FONT_NORMAL);
        button.setFocusPainted(false);
        button.setOpaque(true);
        button.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(200, 208, 202)),
                BorderFactory.createEmptyBorder(7, 16, 7, 16)));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        return button;
    }

    public static JLabel titleLabel(String text) {
        JLabel label = new JLabel(text);
        label.setFont(AppConfig.FONT_TITLE);
        label.setForeground(AppConfig.PRIMARY_DARK);
        return label;
    }

    public static JLabel headingLabel(String text) {
        JLabel label = new JLabel(text);
        label.setFont(AppConfig.FONT_HEADING);
        label.setForeground(AppConfig.TEXT_DARK);
        return label;
    }

    public static JLabel mutedLabel(String text) {
        JLabel label = new JLabel(text);
        label.setFont(AppConfig.FONT_NORMAL);
        label.setForeground(AppConfig.TEXT_MUTED);
        return label;
    }

    // ---------- Panels ----------

    public static Border cardBorder() {
        return BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(222, 230, 224)),
                BorderFactory.createEmptyBorder(14, 16, 14, 16));
    }

    /** A white panel with a thin border - used as a "card". */
    public static JPanel card(LayoutManager layout) {
        JPanel panel = new JPanel(layout);
        panel.setBackground(AppConfig.CARD);
        panel.setBorder(cardBorder());
        return panel;
    }

    /** A small card showing a caption on top and a big number below. */
    public static JPanel statCard(String caption, JLabel valueLabel) {
        JPanel panel = card(new BorderLayout(0, 6));
        valueLabel.setFont(AppConfig.FONT_BIG_NUMBER);
        valueLabel.setForeground(AppConfig.PRIMARY_DARK);
        panel.add(mutedLabel(caption), BorderLayout.NORTH);
        panel.add(valueLabel, BorderLayout.CENTER);
        return panel;
    }

    /**
     * Adds "label | field" as one row of a form.
     * The panel must use a GridBagLayout.
     */
    public static void addRow(JPanel form, int row, String labelText, JComponent field) {
        GridBagConstraints c = new GridBagConstraints();
        c.gridy = row;
        c.insets = new Insets(6, 6, 6, 6);
        c.anchor = GridBagConstraints.WEST;

        JLabel label = new JLabel(labelText);
        label.setFont(AppConfig.FONT_NORMAL);
        c.gridx = 0;
        c.weightx = 0;
        form.add(label, c);

        c.gridx = 1;
        c.weightx = 1;
        c.fill = GridBagConstraints.HORIZONTAL;
        form.add(field, c);
    }

    // ---------- Dialogs ----------

    public static void showError(Component parent, String message) {
        JOptionPane.showMessageDialog(parent, message, AppConfig.APP_NAME, JOptionPane.ERROR_MESSAGE);
    }

    public static void showInfo(Component parent, String message) {
        JOptionPane.showMessageDialog(parent, message, AppConfig.APP_NAME, JOptionPane.INFORMATION_MESSAGE);
    }

    public static boolean confirm(Component parent, String message) {
        int choice = JOptionPane.showConfirmDialog(parent, message, AppConfig.APP_NAME,
                JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
        return choice == JOptionPane.YES_OPTION;
    }

    // ---------- Dates and numbers ----------

    /** A date picker (yyyy-MM-dd) that does not allow dates after today. */
    public static JSpinner dateSpinner(LocalDate initial) {
        LocalDate today = LocalDate.now();
        LocalDate start = initial.isAfter(today) ? today : initial;
        SpinnerDateModel model = new SpinnerDateModel(
                DateUtil.toDate(start), null, DateUtil.toDate(today), Calendar.DAY_OF_MONTH);
        JSpinner spinner = new JSpinner(model);
        spinner.setEditor(new JSpinner.DateEditor(spinner, "yyyy-MM-dd"));
        return spinner;
    }

    public static LocalDate getSpinnerDate(JSpinner spinner) {
        try {
            spinner.commitEdit(); // accept text the user typed but did not confirm
        } catch (ParseException ignored) {
            // keep the last valid value
        }
        return DateUtil.toLocalDate((Date) spinner.getValue());
    }

    /** 1234.5 -> "1,234.50 kg" (always uses a dot as decimal separator). */
    public static String formatKg(double value) {
        return String.format(Locale.US, "%,.2f kg", value);
    }

    /** 1234.5 -> "1,234.50" */
    public static String formatNumber(double value) {
        return String.format(Locale.US, "%,.2f", value);
    }
}

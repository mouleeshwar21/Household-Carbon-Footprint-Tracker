package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.config.DashboardMetric;
import com.carbontracker.model.CategorySummary;
import com.carbontracker.model.ChartPeriod;
import com.carbontracker.model.DashboardData;
import com.carbontracker.model.MonthlySummary;
import com.carbontracker.model.Recommendation;
import com.carbontracker.service.DashboardService;
import com.carbontracker.service.RecommendationService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.Insets;
import java.awt.LayoutManager;
import java.awt.Rectangle;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import javax.swing.BorderFactory;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JSeparator;
import javax.swing.Scrollable;
import org.jfree.chart.ChartPanel;
import org.jfree.chart.JFreeChart;
import javax.swing.SwingConstants;

/**
 * Dashboard: totals for the current month, one card per emission group,
 * and a comparison with the previous month (chart + table).
 */
public class DashboardPanel extends JPanel implements Refreshable {

    private static final DateTimeFormatter MONTH_TEXT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final int TREND_MONTHS = 12;

    private final DashboardService service = new DashboardService();
    private final RecommendationService recommendationService = new RecommendationService();

    // Heading
    private final JLabel lblSubtitle = UiUtil.mutedLabel(" ");

    // Top row
    private final JLabel lblTotal = new JLabel("-");
    private final JLabel lblTotalChange = new JLabel(" ");
    private final JLabel lblPerPerson = new JLabel("-");
    private final JLabel lblPerPersonInfo = new JLabel(" ");
    private final JLabel lblPreviousTotal = new JLabel("-");
    private final JLabel lblPreviousInfo = new JLabel(" ");

    // One card per emission group
    private final Map<DashboardMetric, JLabel> metricValues = new EnumMap<>(DashboardMetric.class);
    private final Map<DashboardMetric, JLabel> metricShares = new EnumMap<>(DashboardMetric.class);
    private final Map<DashboardMetric, JLabel> metricChanges = new EnumMap<>(DashboardMetric.class);

    // JFreeChart charts (filled from the logged-in user's data)
    private final JComboBox<ChartPeriod> cboPeriod = new JComboBox<>(ChartPeriod.values());
    private final ChartPanel categoryChartPanel = createChartPanel();
    private final ChartPanel trendChartPanel = createChartPanel();
    private boolean updatingPeriod = false;

    // Comparison section
    private final ComparisonChartPanel chart = new ComparisonChartPanel();
    private final JPanel comparisonTable = new JPanel(new GridBagLayout());

    private final RecommendationsPanel recommendationsPanel = new RecommendationsPanel();

    // Target
    private final JProgressBar targetBar = new JProgressBar(0, 100);
    private final JLabel lblTargetInfo = new JLabel(" ");

    public DashboardPanel() {
        setLayout(new BorderLayout());
        setBackground(AppConfig.BACKGROUND);
        setBorder(BorderFactory.createEmptyBorder(20, 24, 12, 24));
        buildUi();
    }

    // =================================================================
    // Building the screen
    // =================================================================

    private void buildUi() {
        JPanel content = new ContentPanel(new GridBagLayout());
        content.setOpaque(false);

        int row = 0;
        addSection(content, buildHeading(), row++, 0);
        addSection(content, buildTopRow(), row++, 16);
        addSection(content, buildMetricRow(), row++, 16);
        addSection(content, buildChartRow(), row++, 16);
        addSection(content, buildComparisonRow(), row++, 16);
        addSection(content, buildTargetRow(), row++, 16);
        addSection(content, recommendationsPanel, row++, 16);

        // An empty stretchy row pushes everything to the top when the window is tall
        GridBagConstraints filler = new GridBagConstraints();
        filler.gridy = row;
        filler.weighty = 1;
        JPanel spacer = new JPanel();
        spacer.setOpaque(false);
        content.add(spacer, filler);

        JScrollPane scroll = new JScrollPane(content);
        scroll.setBorder(BorderFactory.createEmptyBorder());
        scroll.setOpaque(false);
        scroll.getViewport().setOpaque(false);
        scroll.getVerticalScrollBar().setUnitIncrement(16);
        add(scroll, BorderLayout.CENTER);
    }

    private static void addSection(JPanel parent, JComponent section, int row, int topGap) {
        GridBagConstraints c = new GridBagConstraints();
        c.gridx = 0;
        c.gridy = row;
        c.weightx = 1;
        c.fill = GridBagConstraints.HORIZONTAL;
        c.anchor = GridBagConstraints.NORTH;
        c.insets = new Insets(topGap, 0, 0, 0);
        parent.add(section, c);
    }

    private JPanel buildHeading() {
        JPanel heading = new JPanel(new GridLayout(0, 1, 0, 4));
        heading.setOpaque(false);
        heading.add(UiUtil.titleLabel("Dashboard"));
        heading.add(lblSubtitle);
        return heading;
    }

    private JPanel buildTopRow() {
        JPanel row = new JPanel(new GridLayout(1, 3, 16, 0));
        row.setOpaque(false);
        row.add(topCard("Total CO2e this month", lblTotal, lblTotalChange));
        row.add(topCard("CO2e per person", lblPerPerson, lblPerPersonInfo));
        row.add(topCard("Last month total", lblPreviousTotal, lblPreviousInfo));
        return row;
    }

    private JPanel topCard(String caption, JLabel value, JLabel detail) {
        value.setFont(AppConfig.FONT_BIG_NUMBER);
        value.setForeground(AppConfig.PRIMARY_DARK);
        detail.setFont(AppConfig.FONT_NORMAL);
        detail.setForeground(AppConfig.TEXT_MUTED);

        JPanel card = UiUtil.card(new BorderLayout(0, 4));
        card.add(UiUtil.mutedLabel(caption), BorderLayout.NORTH);
        card.add(value, BorderLayout.CENTER);
        card.add(detail, BorderLayout.SOUTH);
        return card;
    }

    private JPanel buildMetricRow() {
        JPanel row = new JPanel(new GridLayout(1, 4, 16, 0));
        row.setOpaque(false);
        for (DashboardMetric metric : DashboardMetric.values()) {
            row.add(metricCard(metric));
        }
        return row;
    }

    private JPanel metricCard(DashboardMetric metric) {
        JLabel value = new JLabel("-");
        value.setFont(AppConfig.FONT_BIG_NUMBER.deriveFont(22f));
        value.setForeground(AppConfig.TEXT_DARK);
        JLabel share = UiUtil.mutedLabel(" ");
        JLabel change = new JLabel(" ");
        change.setFont(AppConfig.FONT_NORMAL.deriveFont(13f));
        share.setFont(AppConfig.FONT_NORMAL.deriveFont(13f));

        metricValues.put(metric, value);
        metricShares.put(metric, share);
        metricChanges.put(metric, change);

        JPanel notes = new JPanel(new GridLayout(2, 1, 0, 2));
        notes.setOpaque(false);
        notes.add(share);
        notes.add(change);

        JPanel card = new JPanel(new BorderLayout(0, 4));
        card.setBackground(AppConfig.CARD);
        // coloured stripe on the left + the normal card border
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 5, 0, 0, metric.getAccent()),
                BorderFactory.createCompoundBorder(
                        BorderFactory.createLineBorder(new Color(222, 230, 224)),
                        BorderFactory.createEmptyBorder(12, 12, 12, 8))));
        card.add(UiUtil.mutedLabel(metric.getLabel() + " emissions"), BorderLayout.NORTH);
        card.add(value, BorderLayout.CENTER);
        card.add(notes, BorderLayout.SOUTH);
        return card;
    }

    private JPanel buildChartRow() {
        cboPeriod.addActionListener(e -> {
            if (!updatingPeriod) {
                reloadCategoryChart();
            }
        });

        JPanel categoryHeader = new JPanel(new BorderLayout());
        categoryHeader.setOpaque(false);
        categoryHeader.add(UiUtil.headingLabel("Emissions by category"), BorderLayout.WEST);
        categoryHeader.add(cboPeriod, BorderLayout.EAST);

        JPanel categoryCard = UiUtil.card(new BorderLayout(0, 8));
        categoryCard.add(categoryHeader, BorderLayout.NORTH);
        categoryCard.add(categoryChartPanel, BorderLayout.CENTER);

        JPanel trendCard = UiUtil.card(new BorderLayout(0, 8));
        trendCard.add(UiUtil.headingLabel("Monthly carbon footprint (last " + TREND_MONTHS + " months)"), BorderLayout.NORTH);
        trendCard.add(trendChartPanel, BorderLayout.CENTER);

        JPanel row = new JPanel(new GridLayout(1, 2, 16, 0));
        row.setOpaque(false);
        row.add(categoryCard);
        row.add(trendCard);
        return row;
    }

    private static ChartPanel createChartPanel() {
        ChartPanel panel = new ChartPanel((JFreeChart) null);
        panel.setPreferredSize(new Dimension(420, 280));
        panel.setBackground(Color.WHITE);
        panel.setMouseWheelEnabled(false); // the mouse wheel scrolls the dashboard instead of zooming
        panel.setMouseZoomable(false);     // no drag-to-zoom
        return panel;
    }

    private JPanel buildComparisonRow() {
        JPanel chartCard = UiUtil.card(new BorderLayout(0, 8));
        chartCard.add(UiUtil.headingLabel("This month vs last month"), BorderLayout.NORTH);
        chartCard.add(chart, BorderLayout.CENTER);

        comparisonTable.setOpaque(false);
        JPanel tableHolder = new JPanel(new BorderLayout());
        tableHolder.setOpaque(false);
        tableHolder.add(comparisonTable, BorderLayout.NORTH);

        JPanel tableCard = UiUtil.card(new BorderLayout(0, 8));
        tableCard.add(UiUtil.headingLabel("Comparison in detail (kg CO2e)"), BorderLayout.NORTH);
        tableCard.add(tableHolder, BorderLayout.CENTER);

        JPanel row = new JPanel(new GridLayout(1, 2, 16, 0));
        row.setOpaque(false);
        row.add(chartCard);
        row.add(tableCard);
        return row;
    }

    private JPanel buildTargetRow() {
        targetBar.setStringPainted(true);
        lblTargetInfo.setFont(AppConfig.FONT_NORMAL);
        lblTargetInfo.setForeground(AppConfig.TEXT_MUTED);

        JPanel card = UiUtil.card(new BorderLayout(16, 0));
        card.add(UiUtil.headingLabel("Monthly target"), BorderLayout.WEST);
        card.add(targetBar, BorderLayout.CENTER);
        card.add(lblTargetInfo, BorderLayout.EAST);
        return card;
    }

    // =================================================================
    // Loading and showing data
    // =================================================================

    @Override
    public void refreshData() {
        try {
            int userId = Session.getUserId(); // the logged-in user - every query below is filtered by it
            DashboardData data = service.load(userId);
            showData(data);
            showTrend(service.getMonthlyTrend(userId, TREND_MONTHS), data.getTargetKg());
            showCategories(service.getCategoryTotals(userId, selectedPeriod()));
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    private ChartPeriod selectedPeriod() {
        ChartPeriod period = (ChartPeriod) cboPeriod.getSelectedItem();
        return period == null ? ChartPeriod.THIS_MONTH : period;
    }

    /** Called when the user picks another period in the combo box. */
    private void reloadCategoryChart() {
        try {
            showCategories(service.getCategoryTotals(Session.getUserId(), selectedPeriod()));
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    /** Draws the pie chart (public so the screen can be tested without a database). */
    public void showCategories(List<CategorySummary> data) {
        categoryChartPanel.setChart(EmissionCharts.createCategoryChart(data));
    }

    /** Draws the line chart (public so the screen can be tested without a database). */
    public void showTrend(List<MonthlySummary> months, Double targetKg) {
        trendChartPanel.setChart(EmissionCharts.createTrendChart(months, targetKg));
    }

    /** Fills every label, the chart and the table from one DashboardData object. */
    public void showData(DashboardData d) {
        String monthName = MONTH_TEXT.format(d.getMonth());
        String previousName = MONTH_TEXT.format(d.getPreviousMonth());

        if (d.getTotalCurrent() <= 0 && d.getTotalPrevious() <= 0) {
            lblSubtitle.setText("No records for " + monthName + " or " + previousName
                    + " yet. Use Add Record or the Calculator to get started.");
        } else {
            lblSubtitle.setText("Your household emissions for " + monthName
                    + ", compared with " + previousName);
        }

        // Top row
        lblTotal.setText(UiUtil.formatKg(d.getTotalCurrent()));
        showChange(lblTotalChange, d.getTotalPrevious(), d.getTotalCurrent(), false);
        lblPerPerson.setText(UiUtil.formatKg(d.getPerPersonCurrent()));
        lblPerPersonInfo.setText(d.getPeople() + (d.getPeople() == 1 ? " person" : " people")
                + " - last month " + UiUtil.formatKg(d.getPerPersonPrevious()));
        lblPreviousTotal.setText(UiUtil.formatKg(d.getTotalPrevious()));
        lblPreviousInfo.setText(previousName);

        // Group cards, chart data and table
        DashboardMetric[] metrics = DashboardMetric.values();
        String[] chartLabels = new String[metrics.length + 1];
        double[] chartPrevious = new double[metrics.length + 1];
        double[] chartCurrent = new double[metrics.length + 1];

        for (int i = 0; i < metrics.length; i++) {
            DashboardMetric metric = metrics[i];
            double now = d.getCurrent(metric);
            double before = d.getPrevious(metric);

            metricValues.get(metric).setText(UiUtil.formatKg(now));
            metricShares.get(metric).setText(shareText(now, d.getTotalCurrent()));
            showChange(metricChanges.get(metric), before, now, true);

            chartLabels[i] = metric.getShortLabel();
            chartPrevious[i] = before;
            chartCurrent[i] = now;
        }
        chartLabels[metrics.length] = "Other";
        chartPrevious[metrics.length] = d.getOtherPrevious();
        chartCurrent[metrics.length] = d.getOtherCurrent();
        chart.setData(chartLabels, chartPrevious, chartCurrent, previousName, monthName);

        fillTable(d);
        showTarget(d);
        recommendationsPanel.showRecommendations(recommendationService.fromDashboard(d));
    }

    private void showTarget(DashboardData d) {
        Double target = d.getTargetKg();
        double total = d.getTotalCurrent();
        if (target == null) {
            targetBar.setValue(0);
            targetBar.setString("No target set");
            targetBar.setForeground(AppConfig.PRIMARY);
            lblTargetInfo.setText("Set one in the Household Profile tab");
            return;
        }
        int percent = (int) Math.round(total / target * 100);
        targetBar.setValue(Math.min(percent, 100));
        targetBar.setString(percent + "%");
        targetBar.setForeground(percent > 100 ? AppConfig.DANGER : AppConfig.PRIMARY);
        lblTargetInfo.setText(total <= target
                ? UiUtil.formatKg(target - total) + " left of " + UiUtil.formatKg(target)
                : "Over target by " + UiUtil.formatKg(total - target));
    }

    // =================================================================
    // Comparison table
    // =================================================================

    private void fillTable(DashboardData d) {
        comparisonTable.removeAll();

        addCell(0, 0, headerLabel("Category", SwingConstants.LEFT));
        addCell(1, 0, headerLabel("This month", SwingConstants.RIGHT));
        addCell(2, 0, headerLabel("Last month", SwingConstants.RIGHT));
        addCell(3, 0, headerLabel("Change", SwingConstants.RIGHT));

        int row = 1;
        for (DashboardMetric metric : DashboardMetric.values()) {
            addTableRow(row++, metric.getLabel(), d.getCurrent(metric), d.getPrevious(metric), false);
        }
        addTableRow(row++, "Other", d.getOtherCurrent(), d.getOtherPrevious(), false);

        GridBagConstraints line = new GridBagConstraints();
        line.gridx = 0;
        line.gridy = row++;
        line.gridwidth = 4;
        line.fill = GridBagConstraints.HORIZONTAL;
        line.insets = new Insets(4, 6, 4, 6);
        comparisonTable.add(new JSeparator(), line);

        addTableRow(row, "Total", d.getTotalCurrent(), d.getTotalPrevious(), true);

        comparisonTable.revalidate();
        comparisonTable.repaint();
    }

    private void addTableRow(int row, String name, double now, double before, boolean bold) {
        JLabel nameLabel = new JLabel(name);
        JLabel nowLabel = new JLabel(UiUtil.formatNumber(now), SwingConstants.RIGHT);
        JLabel beforeLabel = new JLabel(UiUtil.formatNumber(before), SwingConstants.RIGHT);
        JLabel changeLabel = new JLabel("", SwingConstants.RIGHT);

        java.awt.Font font = bold ? AppConfig.FONT_NORMAL.deriveFont(java.awt.Font.BOLD) : AppConfig.FONT_NORMAL;
        for (JLabel label : new JLabel[]{nameLabel, nowLabel, beforeLabel, changeLabel}) {
            label.setFont(font);
            label.setForeground(AppConfig.TEXT_DARK);
        }
        changeLabel.setText(changeCellText(before, now));
        changeLabel.setForeground(changeColor(before, now));

        addCell(0, row, nameLabel);
        addCell(1, row, nowLabel);
        addCell(2, row, beforeLabel);
        addCell(3, row, changeLabel);
    }

    private void addCell(int col, int row, JComponent component) {
        GridBagConstraints c = new GridBagConstraints();
        c.gridx = col;
        c.gridy = row;
        c.insets = new Insets(4, 4, 4, 4);
        c.fill = GridBagConstraints.HORIZONTAL;
        c.weightx = (col == 3) ? 1 : 0;
        comparisonTable.add(component, c);
    }

    private JLabel headerLabel(String text, int alignment) {
        JLabel label = new JLabel(text, alignment);
        label.setFont(AppConfig.FONT_NORMAL);
        label.setForeground(AppConfig.TEXT_MUTED);
        return label;
    }

    // =================================================================
    // Small text helpers
    // =================================================================

    /** "35% of total" (or a dash when there is nothing yet). */
    private static String shareText(double part, double total) {
        if (total <= 0 || part <= 0) {
            return "-";
        }
        return String.format(Locale.US, "%.0f%% of total", part / total * 100);
    }

    /** Sets a sentence such as "12.4% lower than last month", coloured green (lower) or red (higher). */
    private void showChange(JLabel label, double before, double now, boolean brief) {
        label.setText(describeChange(before, now, brief));
        label.setForeground(changeColor(before, now));
    }

    private static String describeChange(double before, double now, boolean brief) {
        if (before <= 0 && now <= 0) {
            return "No data yet";
        }
        Double percent = DashboardService.percentChange(before, now);
        if (percent == null) {
            return "No data for last month";
        }
        if (Math.abs(percent) < 0.05) {
            return "Same as last month";
        }
        return String.format(Locale.US, brief ? "%.1f%% %s vs last month" : "%.1f%% %s than last month",
                Math.abs(percent), percent < 0 ? "lower" : "higher");
    }

    /** Table cell such as "-35.20 (-12.4%)" (the unit is in the card heading). */
    private static String changeCellText(double before, double now) {
        if (before <= 0 && now <= 0) {
            return "-";
        }
        double difference = now - before;
        if (Math.abs(difference) < 0.005) {
            return "No change";
        }
        String text = String.format(Locale.US, "%+.2f", difference);
        Double percent = DashboardService.percentChange(before, now);
        if (percent != null) {
            text += String.format(Locale.US, " (%+.1f%%)", percent);
        }
        return text;
    }

    /** Lower emissions = green, higher = red, no comparison = grey. */
    private static Color changeColor(double before, double now) {
        if (before <= 0 || Math.abs(now - before) < 0.005) {
            return AppConfig.TEXT_MUTED;
        }
        return now < before ? AppConfig.PRIMARY : AppConfig.DANGER;
    }

    /**
     * The scrolling content. Implementing Scrollable and tracking the viewport width makes the
     * content shrink to the window width instead of showing a horizontal scroll bar.
     */
    private static class ContentPanel extends JPanel implements Scrollable {

        ContentPanel(LayoutManager layout) {
            super(layout);
        }

        @Override
        public Dimension getPreferredScrollableViewportSize() {
            return getPreferredSize();
        }

        @Override
        public int getScrollableUnitIncrement(Rectangle visibleRect, int orientation, int direction) {
            return 16;
        }

        @Override
        public int getScrollableBlockIncrement(Rectangle visibleRect, int orientation, int direction) {
            return orientation == SwingConstants.VERTICAL ? Math.max(visibleRect.height - 32, 16) : visibleRect.width;
        }

        @Override
        public boolean getScrollableTracksViewportWidth() {
            return true;
        }

        @Override
        public boolean getScrollableTracksViewportHeight() {
            return false;
        }
    }
}

package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.CategorySummary;
import com.carbontracker.model.MonthlySummary;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.CategoryAxis;
import org.jfree.chart.axis.CategoryLabelPositions;
import org.jfree.chart.labels.StandardPieSectionLabelGenerator;
import org.jfree.chart.labels.StandardPieToolTipGenerator;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.renderer.category.LineAndShapeRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;

/**
 * Builds the two JFreeChart charts of the Dashboard.
 * All JFreeChart code of the project is in this one class.
 * It only turns data into a chart - loading the data (for the logged-in user) is done elsewhere.
 */
public final class EmissionCharts {

    private static final String TOTAL_SERIES = "Total CO2e";
    private static final String TARGET_SERIES = "Monthly target";

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yy", Locale.ENGLISH);
    private static final Font LABEL_FONT = AppConfig.FONT_NORMAL.deriveFont(12f);
    private static final DecimalFormatSymbols US = DecimalFormatSymbols.getInstance(Locale.US);

    /** Fixed colours for the known categories (same colours as the dashboard cards). Others get a default colour. */
    private static final Map<String, Color> CATEGORY_COLORS = Map.of(
            "Electricity", new Color(242, 169, 0),
            "Cooking", new Color(230, 110, 50),
            "Transport", new Color(52, 130, 200),
            "Waste", new Color(120, 130, 110),
            "Food", new Color(110, 170, 90),
            "Water", new Color(70, 170, 190));

    private EmissionCharts() {
    }

    // =================================================================
    // Chart 1: emissions by category (pie chart)
    // =================================================================

    @SuppressWarnings({"rawtypes", "unchecked"})
    public static JFreeChart createCategoryChart(List<CategorySummary> data) {
        DefaultPieDataset dataset = new DefaultPieDataset();
        for (CategorySummary c : data) {
            if (c.getTotalKg() > 0) {
                dataset.setValue(c.getCategory(), c.getTotalKg());
            }
        }

        // title = null: the card around the chart already has a heading
        JFreeChart chart = ChartFactory.createPieChart(null, dataset, true, true, false);
        chart.setBackgroundPaint(Color.WHITE);
        chart.setBorderVisible(false);
        chart.getLegend().setItemFont(LABEL_FONT);
        chart.getLegend().setBackgroundPaint(Color.WHITE);

        PiePlot plot = (PiePlot) chart.getPlot();
        plot.setBackgroundPaint(Color.WHITE);
        plot.setOutlineVisible(false);
        plot.setShadowPaint(null);
        plot.setSectionOutlinesVisible(false);
        plot.setNoDataMessage("No data for this period");
        plot.setLabelFont(LABEL_FONT);
        plot.setLabelBackgroundPaint(Color.WHITE);
        plot.setLabelOutlinePaint(null);
        plot.setLabelShadowPaint(null);
        // label on the chart: "Electricity: 57%"
        plot.setLabelGenerator(new StandardPieSectionLabelGenerator("{0}: {2}",
                new DecimalFormat("#,##0.00", US), new DecimalFormat("0%", US)));
        // tooltip when the mouse rests on a slice: "Electricity: 170.40 kg CO2e (57%)"
        plot.setToolTipGenerator(new StandardPieToolTipGenerator("{0}: {1} kg CO2e ({2})",
                new DecimalFormat("#,##0.00", US), new DecimalFormat("0%", US)));

        for (CategorySummary c : data) {
            Color color = CATEGORY_COLORS.get(c.getCategory());
            if (color != null && c.getTotalKg() > 0) {
                plot.setSectionPaint(c.getCategory(), color);
            }
        }
        return chart;
    }

    // =================================================================
    // Chart 2: monthly trend (line chart)
    // =================================================================

    /**
     * @param months   one entry per month, oldest first (see DashboardService.buildTrend)
     * @param targetKg the household's monthly target, or null - if set, it is drawn as a dashed line
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    public static JFreeChart createTrendChart(List<MonthlySummary> months, Double targetKg) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        for (MonthlySummary m : months) {
            String label = MONTH_LABEL.format(YearMonth.parse(m.getMonth())); // "Sep 26"
            dataset.addValue(m.getTotalKg(), TOTAL_SERIES, label);            // series 0
            if (targetKg != null) {
                dataset.addValue(targetKg, TARGET_SERIES, label);              // series 1
            }
        }

        JFreeChart chart = ChartFactory.createLineChart(null, null, "kg CO2e", dataset,
                PlotOrientation.VERTICAL, targetKg != null, true, false);
        chart.setBackgroundPaint(Color.WHITE);
        chart.setBorderVisible(false);
        if (chart.getLegend() != null) {
            chart.getLegend().setItemFont(LABEL_FONT);
            chart.getLegend().setBackgroundPaint(Color.WHITE);
        }

        CategoryPlot plot = chart.getCategoryPlot();
        plot.setBackgroundPaint(Color.WHITE);
        plot.setOutlineVisible(false);
        plot.setRangeGridlinePaint(new Color(225, 230, 227));
        plot.setDomainGridlinesVisible(false);

        LineAndShapeRenderer renderer = (LineAndShapeRenderer) plot.getRenderer();
        renderer.setSeriesPaint(0, AppConfig.PRIMARY);
        renderer.setSeriesStroke(0, new BasicStroke(2.5f));
        renderer.setSeriesShapesVisible(0, true);
        if (targetKg != null) {
            renderer.setSeriesPaint(1, AppConfig.DANGER);
            renderer.setSeriesStroke(1, new BasicStroke(1.5f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER,
                    10f, new float[]{6f, 6f}, 0f)); // dashed
            renderer.setSeriesShapesVisible(1, false);
        }

        CategoryAxis domainAxis = plot.getDomainAxis();
        domainAxis.setTickLabelFont(LABEL_FONT);
        domainAxis.setCategoryLabelPositions(CategoryLabelPositions.UP_45);
        plot.getRangeAxis().setTickLabelFont(LABEL_FONT);
        plot.getRangeAxis().setLabelFont(LABEL_FONT);
        return chart;
    }
}

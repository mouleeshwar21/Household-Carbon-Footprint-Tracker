package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;
import javax.swing.JPanel;

/**
 * A small hand-drawn bar chart: two bars per group (last month = grey, this month = green).
 * No chart library is needed - it is plain Java2D drawing.
 */
public class ComparisonChartPanel extends JPanel {

    private static final Color PREVIOUS_COLOR = new Color(176, 186, 180);
    private static final Color CURRENT_COLOR = AppConfig.PRIMARY;
    private static final Color GRID_COLOR = new Color(228, 234, 230);
    private static final double[] NICE_STEPS = {1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10};

    private final DecimalFormat smallNumbers = new DecimalFormat("#,##0.#", DecimalFormatSymbols.getInstance(Locale.US));
    private final DecimalFormat bigNumbers = new DecimalFormat("#,##0", DecimalFormatSymbols.getInstance(Locale.US));

    private String[] labels = new String[0];
    private double[] previous = new double[0];
    private double[] current = new double[0];
    private String previousName = "Last month";
    private String currentName = "This month";

    public ComparisonChartPanel() {
        setOpaque(false);
        setPreferredSize(new Dimension(420, 210));
    }

    /** All three arrays must have the same length (one entry per group of bars). */
    public void setData(String[] labels, double[] previous, double[] current,
                        String previousName, String currentName) {
        this.labels = labels.clone();
        this.previous = previous.clone();
        this.current = current.clone();
        this.previousName = previousName;
        this.currentName = currentName;
        repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g.create();
        try {
            draw(g2);
        } finally {
            g2.dispose();
        }
    }

    private void draw(Graphics2D g2) {
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        int width = getWidth();
        int height = getHeight();
        int left = 48;
        int right = 8;
        int top = 30;
        int bottom = 28;
        int plotWidth = width - left - right;
        int plotHeight = height - top - bottom;
        if (plotWidth < 60 || plotHeight < 60 || labels.length == 0) {
            return;
        }

        Font normal = AppConfig.FONT_NORMAL.deriveFont(12f);
        Font small = normal.deriveFont(11f);
        g2.setFont(normal);
        FontMetrics normalMetrics = g2.getFontMetrics(normal);
        FontMetrics smallMetrics = g2.getFontMetrics(small);

        drawLegend(g2, normalMetrics);

        double max = 0;
        for (double v : previous) {
            max = Math.max(max, v);
        }
        for (double v : current) {
            max = Math.max(max, v);
        }
        if (max <= 0) {
            String message = "No data for these two months yet";
            g2.setColor(AppConfig.TEXT_MUTED);
            g2.drawString(message, (width - normalMetrics.stringWidth(message)) / 2, top + plotHeight / 2);
            return;
        }

        double axisMax = niceMax(max);
        int baseline = top + plotHeight;

        // Horizontal grid lines with their values on the left
        g2.setFont(small);
        for (int i = 0; i <= 4; i++) {
            int y = baseline - (int) Math.round(plotHeight * i / 4.0);
            g2.setColor(i == 0 ? new Color(150, 160, 155) : GRID_COLOR);
            g2.drawLine(left, y, left + plotWidth, y);
            g2.setColor(AppConfig.TEXT_MUTED);
            String text = formatValue(axisMax * i / 4.0);
            g2.drawString(text, left - 6 - smallMetrics.stringWidth(text), y + smallMetrics.getAscent() / 2 - 1);
        }

        // Bars
        int groups = labels.length;
        double groupWidth = plotWidth / (double) groups;
        int barWidth = (int) Math.max(6, Math.min(34, groupWidth * 0.3));
        for (int i = 0; i < groups; i++) {
            int centre = left + (int) Math.round(groupWidth * (i + 0.5));

            g2.setFont(small);
            drawBar(g2, smallMetrics, centre - barWidth - 2, barWidth, previous[i], axisMax, baseline, plotHeight, PREVIOUS_COLOR);
            drawBar(g2, smallMetrics, centre + 2, barWidth, current[i], axisMax, baseline, plotHeight, CURRENT_COLOR);

            g2.setFont(normal);
            g2.setColor(AppConfig.TEXT_DARK);
            g2.drawString(labels[i], centre - normalMetrics.stringWidth(labels[i]) / 2, baseline + 18);
        }
    }

    private void drawBar(Graphics2D g2, FontMetrics metrics, int x, int barWidth, double value,
                         double axisMax, int baseline, int plotHeight, Color color) {
        int barHeight = (int) Math.round(plotHeight * value / axisMax);
        if (value > 0 && barHeight < 2) {
            barHeight = 2; // keep tiny values visible
        }
        g2.setColor(color);
        g2.fillRect(x, baseline - barHeight, barWidth, barHeight);
        if (value > 0) {
            String text = formatValue(value);
            g2.setColor(AppConfig.TEXT_DARK);
            g2.drawString(text, x + barWidth / 2 - metrics.stringWidth(text) / 2, baseline - barHeight - 4);
        }
    }

    /** Top-right legend: [grey] Last month  [green] This month, and the unit at the top-left. */
    private void drawLegend(Graphics2D g2, FontMetrics metrics) {
        int y = 8;
        int x = getWidth() - 8;

        x -= metrics.stringWidth(currentName);
        g2.setColor(AppConfig.TEXT_DARK);
        g2.drawString(currentName, x, y + 10);
        x -= 14;
        g2.setColor(CURRENT_COLOR);
        g2.fillRect(x, y, 10, 10);

        x -= 18;
        x -= metrics.stringWidth(previousName);
        g2.setColor(AppConfig.TEXT_DARK);
        g2.drawString(previousName, x, y + 10);
        x -= 14;
        g2.setColor(PREVIOUS_COLOR);
        g2.fillRect(x, y, 10, 10);

        g2.setColor(AppConfig.TEXT_MUTED);
        g2.drawString("kg CO2e", 8, y + 10);
    }

    private String formatValue(double value) {
        return value >= 100 ? bigNumbers.format(value) : smallNumbers.format(value);
    }

    /** Rounds the biggest value up to a "nice" axis maximum (1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10 x 10^n). */
    private static double niceMax(double max) {
        double power = Math.pow(10, Math.floor(Math.log10(max)));
        double fraction = max / power;
        for (double step : NICE_STEPS) {
            if (fraction <= step + 1e-9) {
                return step * power;
            }
        }
        return 10 * power;
    }
}

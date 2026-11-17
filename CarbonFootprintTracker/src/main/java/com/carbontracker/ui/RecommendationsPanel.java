package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.Recommendation;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Font;
import java.awt.GridLayout;
import java.util.List;
import java.util.Locale;
import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JPanel;

/**
 * A small "your biggest sources + general tips" card, shared by the Calculator screen
 * and the Dashboard so both look and behave the same way.
 *
 * This panel only displays what RecommendationService worked out - it has no logic of its own.
 */
public class RecommendationsPanel extends JPanel {

    private final JPanel body = new JPanel();

    public RecommendationsPanel() {
        super(new BorderLayout(0, 8));
        setOpaque(false);
        JLabel heading = UiUtil.headingLabel("Recommendations");
        JLabel caption = UiUtil.mutedLabel("General tips based on your biggest logged categories");

        JPanel headingBox = new JPanel(new GridLayout(0, 1, 0, 2));
        headingBox.setOpaque(false);
        headingBox.add(heading);
        headingBox.add(caption);

        // BoxLayout, not GridLayout: each entry gets its own preferred (wrapped) height
        // instead of every entry being forced to the same fixed row height.
        body.setLayout(new BoxLayout(body, BoxLayout.Y_AXIS));
        body.setOpaque(false);

        JPanel card = UiUtil.card(new BorderLayout(0, 10));
        card.add(headingBox, BorderLayout.NORTH);
        card.add(body, BorderLayout.CENTER);
        add(card, BorderLayout.CENTER);
    }

    /** Fills the card. An empty list shows a friendly placeholder instead of nothing. */
    public void showRecommendations(List<Recommendation> recommendations) {
        body.removeAll();
        if (recommendations.isEmpty()) {
            body.add(UiUtil.mutedLabel("Log a few activities to see personalized tips here."));
        } else {
            for (Recommendation r : recommendations) {
                JPanel entry = buildEntry(r);
                entry.setAlignmentX(Component.LEFT_ALIGNMENT);
                body.add(entry);
            }
        }
        body.revalidate();
        body.repaint();
    }

    private JPanel buildEntry(Recommendation r) {
        String title = String.format(Locale.US, "%s - %s (%.0f%% of the total)",
                r.getCategory().getLabel(), UiUtil.formatKg(r.getTotalKg()), r.getSharePercent());
        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(AppConfig.FONT_NORMAL.deriveFont(Font.BOLD));
        titleLabel.setForeground(AppConfig.PRIMARY_DARK);

        JPanel tips = new JPanel();
        tips.setLayout(new BoxLayout(tips, BoxLayout.Y_AXIS));
        tips.setOpaque(false);
        for (String tip : r.getTips()) {
            // HTML + a fixed CSS width makes the label wrap instead of being cut off
            JLabel tipLabel = UiUtil.mutedLabel("<html><body style='width: 380px'>\u2022 " + tip + "</body></html>");
            tipLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
            tipLabel.setBorder(BorderFactory.createEmptyBorder(0, 0, 4, 0));
            tips.add(tipLabel);
        }

        JPanel entry = new JPanel(new BorderLayout(0, 4));
        entry.setOpaque(false);
        entry.setBorder(BorderFactory.createEmptyBorder(0, 0, 10, 0));
        entry.add(titleLabel, BorderLayout.NORTH);
        entry.add(tips, BorderLayout.CENTER);
        return entry;
    }
}

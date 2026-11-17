package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.FlowLayout;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTabbedPane;

/** The main window shown after login: a header bar and seven tabs. */
public class MainFrame extends JFrame {

    private final JTabbedPane tabs = new JTabbedPane();
    private final DashboardPanel dashboardPanel = new DashboardPanel();
    private final CalculatorPanel calculatorPanel = new CalculatorPanel();
    private final AddRecordPanel addRecordPanel = new AddRecordPanel();
    private final HistoryPanel historyPanel = new HistoryPanel();
    private final MonthlyHistoryPanel monthlyHistoryPanel = new MonthlyHistoryPanel();
    private final ReportsPanel reportsPanel = new ReportsPanel();
    private final HouseholdProfilePanel householdPanel = new HouseholdProfilePanel();

    public MainFrame() {
        setTitle(AppConfig.APP_NAME);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setSize(1020, 700);
        setMinimumSize(new Dimension(900, 600));
        setLocationRelativeTo(null);
        buildUi();
        dashboardPanel.refreshData(); // first tab is visible straight away
    }

    private void buildUi() {
        // ----- header bar -----
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(AppConfig.PRIMARY);
        header.setBorder(BorderFactory.createEmptyBorder(12, 20, 12, 20));

        JLabel lblTitle = new JLabel(AppConfig.APP_NAME);
        lblTitle.setFont(AppConfig.FONT_HEADING);
        lblTitle.setForeground(Color.WHITE);

        JLabel lblUser = new JLabel("Signed in as " + Session.getCurrentUser().getFullName());
        lblUser.setFont(AppConfig.FONT_NORMAL);
        lblUser.setForeground(Color.WHITE);

        JButton btnLogout = UiUtil.secondaryButton("Log Out");
        btnLogout.addActionListener(e -> logout());

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 14, 0));
        right.setOpaque(false);
        right.add(lblUser);
        right.add(btnLogout);

        header.add(lblTitle, BorderLayout.WEST);
        header.add(right, BorderLayout.EAST);

        // ----- tabs -----
        tabs.setFont(AppConfig.FONT_NORMAL);
        tabs.addTab("Dashboard", dashboardPanel);
        tabs.addTab("Calculator", calculatorPanel);
        tabs.addTab("Add Record", addRecordPanel);
        tabs.addTab("History", historyPanel);
        tabs.addTab("Monthly History", monthlyHistoryPanel);
        tabs.addTab("Reports", reportsPanel);
        tabs.addTab("Household Profile", householdPanel);

        // Reload data every time the user opens a tab
        tabs.addChangeListener(e -> {
            Component selected = tabs.getSelectedComponent();
            if (selected instanceof Refreshable refreshable) {
                refreshable.refreshData();
            }
        });

        add(header, BorderLayout.NORTH);
        add(tabs, BorderLayout.CENTER);
    }

    private void logout() {
        if (UiUtil.confirm(this, "Log out now?")) {
            Session.logout();
            new LoginFrame().setVisible(true);
            dispose();
        }
    }
}

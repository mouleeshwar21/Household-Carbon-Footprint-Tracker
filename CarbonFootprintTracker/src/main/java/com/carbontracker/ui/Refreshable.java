package com.carbontracker.ui;

/**
 * Implemented by every tab of the main window.
 * MainFrame calls refreshData() each time the tab is opened,
 * so the tab always shows fresh data from the database.
 */
public interface Refreshable {

    void refreshData();
}

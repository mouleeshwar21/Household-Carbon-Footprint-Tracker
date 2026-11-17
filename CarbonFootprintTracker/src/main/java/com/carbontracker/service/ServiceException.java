package com.carbontracker.service;

/**
 * Thrown by the service layer when something goes wrong.
 * The message is written for the END USER, so the UI can show it directly.
 * This keeps java.sql.SQLException out of the ui package.
 */
public class ServiceException extends Exception {

    public ServiceException(String message) {
        super(message);
    }

    public ServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}

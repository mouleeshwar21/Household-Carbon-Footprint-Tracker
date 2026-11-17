package com.carbontracker.utils;

import com.carbontracker.config.AppConfig;
import java.util.regex.Pattern;

/**
 * Input-checking helpers used by the service layer and the UI.
 *
 * The xxxProblem(...) methods return null when the input is fine, or a
 * ready-to-show error message when it is not. This lets the same rule be
 * used for the final check (AuthService) and for live hints (RegisterFrame).
 */
public final class Validator {

    private static final Pattern EMAIL =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    // Starts with a letter; then letters, spaces, dots, apostrophes and hyphens (any language)
    private static final Pattern NAME =
            Pattern.compile("^[\\p{L}][\\p{L} .'\\-]*$");

    // Plain numbers only: 250   14.2   0.5   .5   (no letters, signs, commas or exponents)
    private static final Pattern PLAIN_NUMBER =
            Pattern.compile("^(\\d+(\\.\\d*)?|\\.\\d+)$");

    private Validator() {
    }

    // ---------- Registration / login rules ----------

    /** @return null if the name is acceptable, otherwise an error message */
    public static String nameProblem(String name) {
        if (isBlank(name)) {
            return "Please enter your full name.";
        }
        String trimmed = name.trim();
        if (trimmed.length() < 2) {
            return "Full name must be at least 2 characters long.";
        }
        if (trimmed.length() > 100) {
            return "Full name must be 100 characters or fewer.";
        }
        if (!NAME.matcher(trimmed).matches()) {
            return "Full name can only contain letters, spaces, dots, apostrophes and hyphens.";
        }
        return null;
    }

    /** @return null if the email looks valid, otherwise an error message */
    public static String emailProblem(String email) {
        if (isBlank(email)) {
            return "Please enter your email address.";
        }
        String trimmed = email.trim();
        if (trimmed.length() > 150) {
            return "Email must be 150 characters or fewer.";
        }
        if (!EMAIL.matcher(trimmed).matches()) {
            return "Please enter a valid email address (for example name@example.com).";
        }
        return null;
    }

    /** @return null if the password follows the rules, otherwise an error message */
    public static String passwordProblem(String password) {
        if (password == null || password.isEmpty()) {
            return "Please enter a password.";
        }
        if (password.length() < AppConfig.MIN_PASSWORD_LENGTH) {
            return "Password must be at least " + AppConfig.MIN_PASSWORD_LENGTH + " characters long.";
        }
        if (password.length() > AppConfig.MAX_PASSWORD_LENGTH) {
            return "Password must be " + AppConfig.MAX_PASSWORD_LENGTH + " characters or fewer.";
        }
        boolean hasLetter = false;
        boolean hasDigit = false;
        for (char c : password.toCharArray()) {
            if (Character.isLetter(c)) {
                hasLetter = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            }
        }
        if (!hasLetter) {
            return "Password must contain at least one letter.";
        }
        if (!hasDigit) {
            return "Password must contain at least one number.";
        }
        return null;
    }

    // ---------- General helpers ----------

    public static boolean isBlank(String text) {
        return text == null || text.trim().isEmpty();
    }

    public static boolean isValidEmail(String email) {
        return emailProblem(email) == null;
    }

    public static boolean isValidPassword(String password) {
        return passwordProblem(password) == null;
    }

    /** @return the number, or null if the text is empty or not a valid number */
    public static Double parseDouble(String text) {
        if (isBlank(text)) {
            return null;
        }
        try {
            double value = Double.parseDouble(text.trim());
            return (Double.isNaN(value) || Double.isInfinite(value)) ? null : value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Strict parser for quantity fields.
     *
     * @return the number (0 or more) if the text is a plain number such as 250 or 14.2,
     *         otherwise null (also null for empty text)
     */
    public static Double parseNonNegativeNumber(String text) {
        if (isBlank(text)) {
            return null;
        }
        String trimmed = text.trim();
        if (!PLAIN_NUMBER.matcher(trimmed).matches()) {
            return null;
        }
        try {
            return Double.parseDouble(trimmed);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** @return the number if it is greater than zero, otherwise null */
    public static Double parsePositiveDouble(String text) {
        Double value = parseDouble(text);
        return (value != null && value > 0) ? value : null;
    }

    /** @return the whole number if it is greater than zero, otherwise null */
    public static Integer parsePositiveInt(String text) {
        if (isBlank(text)) {
            return null;
        }
        try {
            int value = Integer.parseInt(text.trim());
            return value > 0 ? value : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

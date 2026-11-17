package com.carbontracker.utils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

/**
 * Converts between java.time.LocalDate (used in our model classes) and
 * java.util.Date (used by Swing's JSpinner).
 */
public final class DateUtil {

    private DateUtil() {
    }

    public static Date toDate(LocalDate date) {
        return Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    public static LocalDate toLocalDate(Date date) {
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }
}

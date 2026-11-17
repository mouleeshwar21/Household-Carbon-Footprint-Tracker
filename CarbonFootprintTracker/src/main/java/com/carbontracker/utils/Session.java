package com.carbontracker.utils;

import com.carbontracker.model.User;

/**
 * Remembers who is logged in, so every screen can call Session.getUserId().
 * (There is only one user at a time in a desktop app, so static is fine.)
 */
public final class Session {

    private static User currentUser;

    private Session() {
    }

    public static void login(User user) {
        currentUser = user;
    }

    public static void logout() {
        currentUser = null;
    }

    public static boolean isLoggedIn() {
        return currentUser != null;
    }

    public static User getCurrentUser() {
        return currentUser;
    }

    public static int getUserId() {
        if (currentUser == null) {
            throw new IllegalStateException("No user is logged in.");
        }
        return currentUser.getUserId();
    }
}

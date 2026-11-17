package com.carbontracker.service;

import com.carbontracker.dao.UserDAO;
import com.carbontracker.model.User;
import com.carbontracker.utils.PasswordUtil;
import com.carbontracker.utils.Validator;
import java.sql.SQLException;
import java.sql.SQLIntegrityConstraintViolationException;
import java.util.Locale;

/** Registration and login rules. The UI calls these two methods and shows any error message. */
public class AuthService {

    private final UserDAO userDAO = new UserDAO();

    /**
     * Validates the input, hashes the password and stores the new user.
     *
     * @return the new user (with its generated user_id)
     * @throws ServiceException with a user-friendly message if anything is wrong
     */
    public User register(String fullName, String email, String password, String confirmPassword)
            throws ServiceException {

        // 1. Validation - each check returns null (OK) or a message
        String problem = Validator.nameProblem(fullName);
        if (problem == null) {
            problem = Validator.emailProblem(email);
        }
        if (problem == null) {
            problem = Validator.passwordProblem(password);
        }
        if (problem == null && !password.equals(confirmPassword)) {
            problem = "The two passwords do not match.";
        }
        if (problem != null) {
            throw new ServiceException(problem);
        }

        // 2. Store in MySQL (email is saved in lower case so "A@x.com" and "a@x.com" are the same account)
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        try {
            if (userDAO.emailExists(cleanEmail)) {
                throw new ServiceException("An account with this email already exists. Try logging in instead.");
            }
            User user = new User(fullName.trim(), cleanEmail, PasswordUtil.hashPassword(password));
            user.setUserId(userDAO.insert(user));
            return user;
        } catch (SQLIntegrityConstraintViolationException e) {
            // Rare: someone registered the same email a split second earlier.
            // The UNIQUE key on users.email stopped the duplicate.
            throw new ServiceException("An account with this email already exists. Try logging in instead.", e);
        } catch (SQLException e) {
            throw new ServiceException("Could not create the account (database error): " + e.getMessage(), e);
        }
    }

    /**
     * Checks the email and password against the database.
     *
     * @return the logged-in user
     * @throws ServiceException "Invalid email or password." if they do not match
     */
    public User login(String email, String password) throws ServiceException {
        if (Validator.isBlank(email)) {
            throw new ServiceException("Please enter your email address.");
        }
        if (password == null || password.isEmpty()) {
            throw new ServiceException("Please enter your password.");
        }
        try {
            User user = userDAO.findByEmail(email.trim().toLowerCase(Locale.ROOT));
            // Same message for "no such user" and "wrong password" on purpose:
            // it does not tell an attacker which emails have accounts.
            if (user == null || !PasswordUtil.verifyPassword(password, user.getPasswordHash())) {
                throw new ServiceException("Invalid email or password.");
            }
            return user;
        } catch (SQLException e) {
            throw new ServiceException("Could not log in (database error): " + e.getMessage(), e);
        }
    }
}

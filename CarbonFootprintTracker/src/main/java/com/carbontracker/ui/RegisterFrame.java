package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.service.AuthService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.UiUtil;
import com.carbontracker.utils.Validator;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;

/** Create-account window with live hints under the password fields. */
public class RegisterFrame extends JFrame {

    private static final String PASSWORD_RULES = "At least " + AppConfig.MIN_PASSWORD_LENGTH
            + " characters, with a letter and a number.";

    private final AuthService authService = new AuthService();
    private final JTextField txtName = new JTextField(22);
    private final JTextField txtEmail = new JTextField(22);
    private final JPasswordField txtPassword = new JPasswordField(22);
    private final JPasswordField txtConfirm = new JPasswordField(22);
    private final JCheckBox chkShowPassword = new JCheckBox("Show passwords");
    private final char defaultEchoChar = txtPassword.getEchoChar();

    private final JLabel lblPasswordHint = UiUtil.mutedLabel(PASSWORD_RULES);
    private final JLabel lblConfirmHint = UiUtil.mutedLabel(" ");

    public RegisterFrame() {
        setTitle(AppConfig.APP_NAME + " - Create Account");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        buildUi();
        addLiveHints();
        pack();
        setResizable(false);
        setLocationRelativeTo(null);
    }

    private void buildUi() {
        JPanel root = new JPanel(new BorderLayout(0, 18));
        root.setBackground(AppConfig.BACKGROUND);
        root.setBorder(BorderFactory.createEmptyBorder(28, 36, 28, 36));

        JPanel header = new JPanel(new GridLayout(0, 1, 0, 4));
        header.setOpaque(false);
        header.add(UiUtil.titleLabel("Create Account"));
        header.add(UiUtil.mutedLabel("Register to start tracking your household emissions"));

        chkShowPassword.setOpaque(false);
        chkShowPassword.addActionListener(e -> {
            char echo = chkShowPassword.isSelected() ? (char) 0 : defaultEchoChar;
            txtPassword.setEchoChar(echo);
            txtConfirm.setEchoChar(echo);
        });

        JPanel form = new JPanel(new GridBagLayout());
        form.setOpaque(false);
        UiUtil.addRow(form, 0, "Full name", txtName);
        UiUtil.addRow(form, 1, "Email", txtEmail);
        UiUtil.addRow(form, 2, "Password", txtPassword);
        UiUtil.addRow(form, 3, "", lblPasswordHint);
        UiUtil.addRow(form, 4, "Confirm password", txtConfirm);
        UiUtil.addRow(form, 5, "", lblConfirmHint);
        UiUtil.addRow(form, 6, "", chkShowPassword);

        JButton btnRegister = UiUtil.primaryButton("Register");
        JButton btnBack = UiUtil.secondaryButton("Back to Log In");
        btnRegister.addActionListener(e -> doRegister());
        btnBack.addActionListener(e -> backToLogin(""));
        getRootPane().setDefaultButton(btnRegister);

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        buttons.setOpaque(false);
        buttons.add(btnBack);
        buttons.add(btnRegister);

        root.add(header, BorderLayout.NORTH);
        root.add(form, BorderLayout.CENTER);
        root.add(buttons, BorderLayout.SOUTH);
        setContentPane(root);
    }

    /** Updates the two hint labels while the user types. */
    private void addLiveHints() {
        DocumentListener listener = new DocumentListener() {
            @Override public void insertUpdate(DocumentEvent e) { updateHints(); }
            @Override public void removeUpdate(DocumentEvent e) { updateHints(); }
            @Override public void changedUpdate(DocumentEvent e) { updateHints(); }
        };
        txtPassword.getDocument().addDocumentListener(listener);
        txtConfirm.getDocument().addDocumentListener(listener);
    }

    private void updateHints() {
        String password = new String(txtPassword.getPassword());
        String confirm = new String(txtConfirm.getPassword());

        if (password.isEmpty()) {
            setHint(lblPasswordHint, PASSWORD_RULES, false);
        } else {
            String problem = Validator.passwordProblem(password);
            if (problem == null) {
                setHint(lblPasswordHint, "Password looks good.", true);
            } else {
                setHint(lblPasswordHint, problem, false);
            }
        }

        if (confirm.isEmpty()) {
            setHint(lblConfirmHint, " ", false);
        } else if (confirm.equals(password)) {
            setHint(lblConfirmHint, "Passwords match.", true);
        } else {
            setHint(lblConfirmHint, "Passwords do not match yet.", false);
        }
    }

    private void setHint(JLabel label, String text, boolean good) {
        label.setText(text);
        label.setForeground(good ? AppConfig.PRIMARY : AppConfig.TEXT_MUTED);
    }

    private void doRegister() {
        try {
            authService.register(
                    txtName.getText(),
                    txtEmail.getText(),
                    new String(txtPassword.getPassword()),
                    new String(txtConfirm.getPassword()));
            UiUtil.showInfo(this, "Account created! Please log in.");
            backToLogin(txtEmail.getText().trim());
        } catch (ServiceException ex) {
            UiUtil.showError(this, ex.getMessage());
        }
    }

    private void backToLogin(String email) {
        new LoginFrame(email).setVisible(true);
        dispose();
    }
}

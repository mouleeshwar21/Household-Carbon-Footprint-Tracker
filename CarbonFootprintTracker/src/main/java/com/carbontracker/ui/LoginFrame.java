package com.carbontracker.ui;

import com.carbontracker.config.AppConfig;
import com.carbontracker.model.User;
import com.carbontracker.service.AuthService;
import com.carbontracker.service.ServiceException;
import com.carbontracker.utils.Session;
import com.carbontracker.utils.UiUtil;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridBagLayout;
import java.awt.GridLayout;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;

/** The first window: email + password, with a link to the Register window. */
public class LoginFrame extends JFrame {

    private final AuthService authService = new AuthService();
    private final JTextField txtEmail = new JTextField(22);
    private final JPasswordField txtPassword = new JPasswordField(22);
    private final JCheckBox chkShowPassword = new JCheckBox("Show password");
    private final char defaultEchoChar = txtPassword.getEchoChar();

    public LoginFrame() {
        this("");
    }

    /** @param prefillEmail email to fill in automatically (used right after registration) */
    public LoginFrame(String prefillEmail) {
        setTitle(AppConfig.APP_NAME + " - Log In");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        txtEmail.setText(prefillEmail == null ? "" : prefillEmail);
        buildUi();
        pack();
        setResizable(false);
        setLocationRelativeTo(null); // centre on screen

        // Put the cursor in the first empty field when the window opens
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowOpened(WindowEvent e) {
                (txtEmail.getText().isEmpty() ? txtEmail : txtPassword).requestFocusInWindow();
            }
        });
    }

    private void buildUi() {
        JPanel root = new JPanel(new BorderLayout(0, 18));
        root.setBackground(AppConfig.BACKGROUND);
        root.setBorder(BorderFactory.createEmptyBorder(28, 36, 28, 36));

        JPanel header = new JPanel(new GridLayout(0, 1, 0, 4));
        header.setOpaque(false);
        header.add(UiUtil.titleLabel("Carbon Footprint Tracker"));
        header.add(UiUtil.mutedLabel("Log in to track your household emissions"));

        chkShowPassword.setOpaque(false);
        chkShowPassword.addActionListener(e ->
                txtPassword.setEchoChar(chkShowPassword.isSelected() ? (char) 0 : defaultEchoChar));

        JPanel form = new JPanel(new GridBagLayout());
        form.setOpaque(false);
        UiUtil.addRow(form, 0, "Email", txtEmail);
        UiUtil.addRow(form, 1, "Password", txtPassword);
        UiUtil.addRow(form, 2, "", chkShowPassword);

        JButton btnLogin = UiUtil.primaryButton("Log In");
        JButton btnRegister = UiUtil.secondaryButton("Create Account");
        btnLogin.addActionListener(e -> doLogin());
        btnRegister.addActionListener(e -> openRegister());
        getRootPane().setDefaultButton(btnLogin); // Enter key = Log In

        JPanel buttons = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        buttons.setOpaque(false);
        buttons.add(btnRegister);
        buttons.add(btnLogin);

        root.add(header, BorderLayout.NORTH);
        root.add(form, BorderLayout.CENTER);
        root.add(buttons, BorderLayout.SOUTH);
        setContentPane(root);
    }

    private void doLogin() {
        try {
            User user = authService.login(txtEmail.getText(), new String(txtPassword.getPassword()));
            Session.login(user);              // remember who is logged in
            new MainFrame().setVisible(true); // open the main window
            dispose();                        // close this login window
        } catch (ServiceException ex) {
            txtPassword.setText("");
            UiUtil.showError(this, ex.getMessage());
            txtPassword.requestFocusInWindow();
        }
    }

    private void openRegister() {
        new RegisterFrame().setVisible(true);
        dispose();
    }
}

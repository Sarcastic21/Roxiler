import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/db.js';
import auth from "../middleware/auth.js";
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const otpStore = {};
const pendingRegistrations = {};

// Email transporter for OTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email (Enhanced with black and white theme)
async function sendOTPEmail(email, otp, purpose = 'registration') {
  let subject, html;

  if (purpose === 'password_reset') {
    subject = 'Password Reset OTP Code';
    html = `
      <div style="font-family: Arial, sans-serif; color: #fff; background-color: #111; padding: 20px;">
        <h2 style="color: #fff; border-bottom: 1px solid #222; padding-bottom: 10px;">Password Reset Request</h2>
        <p style="color: #999;">You have requested to reset your password. Use the following OTP code to proceed:</p>
        <p style="font-size: 1.2rem; color: #fff;"><strong>${otp}</strong></p>
        <p style="color: #999;">This code will expire in 10 minutes.</p>
        <p style="color: #999;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;
  } else {
    subject = 'Your OTP Code for Registration';
    html = `
      <div style="font-family: Arial, sans-serif; color: #fff; background-color: #111; padding: 20px;">
        <h2 style="color: #fff; border-bottom: 1px solid #222; padding-bottom: 10px;">Registration OTP</h2>
        <p style="color: #999;">Thank you for registering! Use the following OTP code to verify your email:</p>
        <p style="font-size: 1.2rem; color: #fff;"><strong>${otp}</strong></p>
        <p style="color: #999;">This code will expire in 10 minutes.</p>
      </div>
    `;
  }

  try {
    await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: subject,
      html: html
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Initialize Super Admin (existing code remains same)
async function initializeSuperAdmin() {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = \$1',
      ['superadmin@example.com']
    );
    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (username, email, password, address, role, verified) 
         VALUES (\$1, \$2, \$3, \$4, \$5, \$6)`,
        ['superadmin', 'superadmin@example.com', hashedPassword, 'none', 'super_admin', true]
      );
      console.log('Super admin created successfully');
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
}
initializeSuperAdmin();


router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, address } = req.body;

    // Check if user already exists in database (verified users)
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = \$1 OR username = \$2',
      [email, username]
    );

    if (userResult.rows.length > 0) {
      const existingUser = userResult.rows[0];
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      } else {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Check if email is already in pending registration
    if (pendingRegistrations[email]) {
      return res.status(400).json({ message: 'Registration already in process for this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data temporarily (NOT in database yet)
    pendingRegistrations[email] = {
      username,
      email,
      password: hashedPassword,
      address: address || '',
      role: 'user',
      createdAt: Date.now()
    };

    // Generate and send OTP
    const otp = generateOTP();
    otpStore[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      delete pendingRegistrations[email];
      delete otpStore[email];
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.status(200).json({
      message: 'OTP sent to email. Please verify to complete registration.',
      email: email,
      redirectTo: '/verify-otp',  // ✅ Tell frontend to navigate to verify-otp page
      requiresVerification: true  // ✅ Flag indicating OTP verification needed
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP and COMPLETE REGISTRATION
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    const otpData = otpStore[email];
    if (!otpData || otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > otpData.expires) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check the purpose of the OTP
    if (otpData.purpose === 'password_reset') {
      // Password reset verification

      delete otpStore[email]; // Remove OTP after successful verification
      return res.json({ message: 'OTP verified successfully.' }); // Different message for password reset

    } else {
      // Registration verification
      const pendingUser = pendingRegistrations[email];
      if (!pendingUser) {
        return res.status(400).json({ message: 'No pending registration found' });
      }

      // Create the user in the database (as before)
      const newUser = await pool.query(
        `INSERT INTO users (username, email, password, address, role, verified) 
         VALUES (\$1, \$2, \$3, \$4, \$5, \$6) RETURNING id, username, email, address, role, verified`,
        [pendingUser.username, pendingUser.email, pendingUser.password, pendingUser.address, 'user', true]
      );

      // Clean up
      delete otpStore[email];
      delete pendingRegistrations[email];

      return res.json({
        message: 'Email verified successfully. Registration completed!',
        userId: newUser.rows[0].id,
        user: {
          id: newUser.rows[0].id,
          username: newUser.rows[0].username,
          email: newUser.rows[0].email
        }
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login - CHECK IF USER IS VERIFIED
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user in DATABASE (only verified users exist here)
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = \$1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Check if user is in pending registration
      if (pendingRegistrations[email]) {
        return res.status(400).json({
          message: 'Please verify your email first. Check your inbox for OTP.'
        });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ✅ User is already verified (since they're in the database)

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP for pending registration
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if pending registration exists
    if (!pendingRegistrations[email]) {
      return res.status(400).json({ message: 'No pending registration found' });
    }

    // Generate and send new OTP
    const otp = generateOTP();
    otpStore[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Forgot password - send OTP
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = \$1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate and send OTP
    const otp = generateOTP();
    otpStore[email] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      purpose: 'password_reset'
    };

    const emailSent = await sendOTPEmail(email, otp, 'password_reset'); // Specify purpose
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.json({ message: 'OTP sent successfully', email:email }); //send also email
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password with OTP
// Reset password with OTP (NO OTP NEEDED NOW)
router.post('/reset-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, newPassword } = req.body;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = \$1 WHERE email = \$2',
      [hashedPassword, email]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put("/update-password", auth,
  [
    body("currentPassword").exists().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userResult = await pool.query("SELECT * FROM users WHERE id = \$1", [req.user.id]);
      const user = userResult.rows[0];
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = \$1 WHERE id = \$2", [hashedPassword, req.user.id]);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/delete-account", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = \$1", [req.user.id]);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/user-details', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query(
      'SELECT id, username, email, address, role, verified, created_at FROM users WHERE id = \$1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(userResult.rows[0]);
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

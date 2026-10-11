const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../services/emailService');
const logAudit = async (req, auditInfo) => {
  const logger = require('../utils/auditLogger');
  await logger(req, auditInfo);
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwttokenkeyfordigital evidenciassystem', {
    expiresIn: '1d',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'anotherrefreshsupersecretkeyforcivicevidence', {
    expiresIn: '7d',
  });
};

/**
 * Register User
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Security Alert: Invalid email format pattern.' });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Security Alert: Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Check if this is the first user in the database
    const isFirstUser = (await User.countDocuments({})) === 0;

    // First user is seeded as active Admin; subsequent users are standard unapproved 'user' role
    const userRole = isFirstUser ? 'admin' : 'user';
    const userStatus = isFirstUser ? 'active' : 'inactive';

    // Generate random 6 digit OTP for verification simulation
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      status: userStatus,
      otp: { code: otpCode, expiresAt: otpExpires },
      isEmailVerified: isFirstUser, // Auto-verified for the first user
    });

    // Dispatch real email with 6-digit verification code
    if (!isFirstUser) {
      await sendOtpEmail(email, otpCode, 'verify');
    }

    await logAudit(req, {
      action: 'REGISTER',
      target: user._id.toString(),
      details: `User registered with role ${userRole}. Status is ${userStatus}. Verification email dispatched.`,
      userId: user._id,
    });

    res.status(201).json({
      message: isFirstUser
        ? 'Admin account created and approved automatically. Please login.'
        : 'Registration successful! A verification code has been dispatched to your email address. Account requires Admin approval after email verification.',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Login User
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Security Alert: Invalid email format pattern.' });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Security Alert: Password does not meet complexity requirements (must be at least 8 characters long and contain uppercase, lowercase, digit, and special characters).' 
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      await logAudit(req, {
        action: 'LOGIN_FAIL',
        target: email,
        details: 'Failed login attempt with invalid credentials',
        status: 'failure',
      });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email using the OTP before logging in.' });
    }

    if (user.status !== 'active') {
      await logAudit(req, {
        action: 'LOGIN_FAIL',
        target: user._id.toString(),
        details: 'Attempted login to inactive/unapproved account',
        status: 'failure',
        userId: user._id,
      });
      return res.status(403).json({ message: 'Account is unapproved or deactivated. Please contact an Admin.' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await logAudit(req, {
      action: 'LOGIN',
      target: user._id.toString(),
      details: `User successfully logged in. Role: ${user.role}`,
      userId: user._id,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify OTP/Email
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    if (!user.otp || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
      await logAudit(req, {
        action: 'VERIFY_EMAIL_FAIL',
        target: user._id.toString(),
        details: 'Failed email verification: invalid or expired OTP',
        status: 'failure',
        userId: user._id,
      });
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // Verify user
    user.isEmailVerified = true;
    user.status = 'inactive'; // remains inactive until manually approved and assigned a role by the Admin
    user.otp = undefined; // clear otp
    await user.save();

    await logAudit(req, {
      action: 'VERIFY_EMAIL',
      target: user._id.toString(),
      details: 'Email successfully verified via OTP.',
      userId: user._id,
    });

    res.json({ message: 'Email verified successfully. Account is pending Administrator approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = { code: otpCode, expiresAt: otpExpires };
    await user.save();

    // Dispatch real email with 6-digit verification code
    await sendOtpEmail(email, otpCode, 'forgot');

    await logAudit(req, {
      action: 'FORGOT_PASSWORD',
      target: user._id.toString(),
      details: `Password reset verification code dispatched to email address.`,
      userId: user._id,
    });

    res.json({
      message: 'A 6-digit verification code has been dispatched to your registered email address.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields (email, otp, newPassword) are required.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Security Alert: Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.otp || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
      await logAudit(req, {
        action: 'RESET_PASSWORD_FAIL',
        target: user._id.toString(),
        details: 'Failed password reset: invalid/expired OTP',
        status: 'failure',
        userId: user._id,
      });
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.password = newPassword;
    user.isEmailVerified = true; // Automatically mark email as verified upon successful OTP password reset
    user.otp = undefined; // clear otp
    await user.save();

    await logAudit(req, {
      action: 'RESET_PASSWORD',
      target: user._id.toString(),
      details: 'Password reset successfully.',
      userId: user._id,
    });

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Logout User
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      await logAudit(req, {
        action: 'LOGOUT',
        target: req.user._id.toString(),
        details: 'User logged out',
      });
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
};

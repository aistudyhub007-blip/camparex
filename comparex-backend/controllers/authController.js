// =============================================
//   CompareX — Auth Controller
//   File: controllers/authController.js
// =============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
  isValidEmail, 
  isValidPassword, 
  isValidPhone,
  sanitizeString 
} = require('../utils/validators');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

// ── Helper: Send token response ───────────────
const sendToken = (user, statusCode, res, message = 'Success') => {
  const token = user.getJWT();
  sendSuccess(res, statusCode, message, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar
    }
  });
};

// ── POST /api/auth/signup ─────────────────────
exports.signup = async (req, res, next) => {
  try {
    let { name, email, password, phone } = req.body;

    // Validate required fields
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    if (!email || !isValidEmail(email)) {
      errors.push('Valid email is required');
    }
    if (!password) {
      errors.push('Password is required');
    } else {
      const passValidation = isValidPassword(password);
      if (!passValidation.valid) {
        errors.push(passValidation.message);
      }
    }
    if (phone && !isValidPhone(phone)) {
      errors.push('Phone number format is invalid');
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    // Sanitize inputs
    name = sanitizeString(name);
    email = email.toLowerCase().trim();
    if (phone) phone = sanitizeString(phone);

    // Check existing user
    const exists = await User.findOne({ email });
    if (exists) {
      return sendError(res, 409, 'Email already registered', ['This email has already been used']);
    }

    const user = await User.create({ name, email, password, phone });
    sendToken(user, 201, res, 'Account created successfully! Welcome to CompareX 🎉');

  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/login ──────────────────────
exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!email || !isValidEmail(email)) {
      errors.push('Valid email is required');
    }
    if (!password || password.length < 1) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    email = email.toLowerCase().trim();

    // Select password explicitly (it's hidden by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    if (user.status === 'blocked') {
      return sendError(res, 403, 'Account blocked', ['Your account has been blocked. Please contact support.']);
    }

    sendToken(user, 200, res, 'Login successful! Welcome back 👋');

  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/me ──────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 200, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/auth/update-profile ──────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = { name: 1, phone: 1, avatar: 1 };
    let updates = {};

    // Sanitize and validate allowed fields
    const errors = [];
    Object.keys(req.body).forEach(k => {
      if (allowedFields[k]) {
        if (k === 'name' && req.body[k].trim().length < 2) {
          errors.push('Name must be at least 2 characters');
        } else if (k === 'phone' && req.body[k] && !isValidPhone(req.body[k])) {
          errors.push('Phone number format is invalid');
        } else {
          updates[k] = sanitizeString(req.body[k]);
        }
      }
    });

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields to update');
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/admin/login ────────────────────
exports.adminLogin = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // Validate required fields
    const errors = [];
    if (!email || !isValidEmail(email)) {
      errors.push('Valid email is required');
    }
    if (!password || password.length < 1) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== 'admin') {
      return sendError(res, 401, 'Invalid admin credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid admin credentials');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    sendSuccess(res, 200, 'Admin login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/auth/change-password ─────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    const errors = [];
    if (!currentPassword) errors.push('Current password is required');
    if (!newPassword) errors.push('New password is required');
    if (!confirmPassword) errors.push('Password confirmation is required');

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    if (newPassword && currentPassword && newPassword === currentPassword) {
      errors.push('New password must be different from current password');
    }

    const passValidation = newPassword ? isValidPassword(newPassword) : { valid: true };
    if (!passValidation.valid) {
      errors.push(passValidation.message);
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    sendToken(user, 200, res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

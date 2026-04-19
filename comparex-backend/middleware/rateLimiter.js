// =============================================
//   CompareX — Rate Limiter
//   File: middleware/rateLimiter.js
// =============================================

const rateLimit = require('express-rate-limit');

// General API limit
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      200,
  message:  { success: false, message: 'Too many requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false
});

// Strict limit for auth routes
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false
});

// Payment routes
exports.paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      5,
  message:  { success: false, message: 'Too many payment requests. Please wait.' }
});

// =============================================
//   CompareX — Payment Routes
//   File: routes/paymentRoutes.js
// =============================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

router.post('/create-order', protect, paymentLimiter, ctrl.createRazorpayOrder);
router.post('/verify',       protect, paymentLimiter, ctrl.verifyPayment);
router.post('/refund',       protect, adminOnly,      ctrl.initiateRefund);

module.exports = router;

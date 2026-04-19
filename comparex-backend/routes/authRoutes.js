// =============================================
//   CompareX — Auth Routes
//   File: routes/authRoutes.js
// =============================================

const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/authController');
const { protect }= require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/signup',          authLimiter, ctrl.signup);
router.post('/login',           authLimiter, ctrl.login);
router.get('/me',               protect,     ctrl.getMe);
router.put('/update-profile',   protect,     ctrl.updateProfile);
router.put('/change-password',  protect,     ctrl.changePassword);

module.exports = router;

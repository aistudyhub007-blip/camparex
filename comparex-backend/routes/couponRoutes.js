// =============================================
//   CompareX — Coupon Routes
//   File: routes/couponRoutes.js
// =============================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/apply',   protect,              ctrl.applyCoupon);
router.get('/',         protect, adminOnly,   ctrl.getAllCoupons);
router.post('/',        protect, adminOnly,   ctrl.createCoupon);
router.delete('/:id',   protect, adminOnly,   ctrl.deleteCoupon);

module.exports = router;

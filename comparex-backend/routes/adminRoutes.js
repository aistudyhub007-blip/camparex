// =============================================
//   CompareX — Admin Routes
//   File: routes/adminRoutes.js
// =============================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const authCtrl = require('../controllers/authController');
const { protect, adminOnly, adminAuth } = require('../middleware/auth');
const Product = require('../models/Product');

// Admin login (no protect needed)
router.post('/login', authCtrl.adminLogin);

// Protected admin routes
router.use(protect, adminOnly);

router.get('/dashboard',             ctrl.getDashboard);
router.get('/users',                 ctrl.getAllUsers);
router.patch('/users/:id/toggle-block', ctrl.toggleBlockUser);
router.get('/orders',                ctrl.getAllOrders);
router.patch('/orders/:id/status',   ctrl.updateOrderStatus);
router.get('/reports/sales',         ctrl.salesReport);

// Product management
// Add product
router.post('/product', adminAuth, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

router.put('/product/:id',           ctrl.updateProduct);
router.delete('/product/:id',        adminAuth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

// Coupon management
router.post('/coupon',               ctrl.createCoupon);
router.delete('/coupon/:id',         ctrl.deleteCoupon);
router.get('/coupons',               ctrl.getCoupons);

module.exports = router;

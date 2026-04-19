// =============================================
//   CompareX — Coupon Controller
//   File: controllers/couponController.js
// =============================================

const Coupon = require('../models/Coupon');
const Cart   = require('../models/Cart');

// ── POST /api/coupons/apply ───────────────────
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    // Get cart total for validation
    const cart = await Cart.findOne({ user: req.user._id });
    const cartAmount = cart ? cart.subtotal : 0;

    const validity = coupon.isValid(req.user._id, cartAmount);
    if (!validity.valid) {
      return res.status(400).json({ success: false, message: validity.message });
    }

    const discount = coupon.calculateDiscount(cartAmount);

    // Save coupon to cart
    if (cart) {
      cart.couponApplied = { code: coupon.code, discount };
      await cart.save();
    }

    res.json({
      success:  true,
      message:  `Coupon applied! You save ₹${discount}`,
      coupon: {
        code:          coupon.code,
        discountType:  coupon.discountType,
        discountValue: coupon.discountValue,
        discount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/coupons (Admin) ──────────────────
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/coupons (Admin) ─────────────────
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Coupon created', coupon });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/coupons/:id (Admin) ───────────
exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

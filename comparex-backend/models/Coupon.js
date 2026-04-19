// =============================================
//   CompareX — Coupon Model
//   File: models/Coupon.js
// =============================================

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type:      String,
    required:  [true, 'Coupon code is required'],
    unique:    true,
    uppercase: true,
    trim:      true
  },
  description:   { type: String, default: '' },
  discountType: {
    type:    String,
    enum:    ['flat', 'percentage'],
    default: 'flat'
  },
  discountValue: {
    type:     Number,
    required: [true, 'Discount value is required'],
    min:      [0, 'Discount cannot be negative']
  },
  minimumAmount: { type: Number, default: 0 },
  maximumDiscount: { type: Number, default: 0 },  // max cap for percentage
  usageLimit:    { type: Number, default: null },  // null = unlimited
  usageCount:    { type: Number, default: 0 },
  usedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  validFrom:     { type: Date, default: Date.now },
  validTill:     { type: Date, default: null },
  status: {
    type:    String,
    enum:    ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User'
  }
}, {
  timestamps: true
});

// ── Check if coupon is valid ──────────────────
couponSchema.methods.isValid = function (userId, cartAmount) {
  const now = new Date();
  if (this.status !== 'active') return { valid: false, message: 'Coupon is inactive' };
  if (this.validTill && now > this.validTill) return { valid: false, message: 'Coupon has expired' };
  if (this.validFrom && now < this.validFrom) return { valid: false, message: 'Coupon is not yet active' };
  if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (this.usedBy.includes(userId)) return { valid: false, message: 'You have already used this coupon' };
  if (cartAmount < this.minimumAmount) return { valid: false, message: `Minimum order amount is ₹${this.minimumAmount}` };
  return { valid: true };
};

// ── Calculate discount ────────────────────────
couponSchema.methods.calculateDiscount = function (amount) {
  let discount = 0;
  if (this.discountType === 'flat') {
    discount = Math.min(this.discountValue, amount);
  } else {
    discount = (amount * this.discountValue) / 100;
    if (this.maximumDiscount > 0) discount = Math.min(discount, this.maximumDiscount);
  }
  return Math.round(discount);
};

module.exports = mongoose.model('Coupon', couponSchema);

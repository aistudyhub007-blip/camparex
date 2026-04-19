// =============================================
//   CompareX — Order Model
//   File: models/Order.js
// =============================================

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productTitle: { type: String },
  productImage: { type: String },
  price:        { type: Number, required: true },
  quantity:     { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type:   String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true
  },
  items: [orderItemSchema],
  subtotal:       { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount:      { type: Number, default: 0 },
  total:          { type: Number, required: true },
  currency:       { type: String, default: 'INR' },
  couponCode:     { type: String, default: '' },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'cod'],
    default: 'razorpay'
  },
  paymentStatus: {
    type:    String,
    enum:    ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type:    String,
    enum:    ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  downloadLinks: [{
    product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    downloadCount: { type: Number, default: 0 },
    downloadLimit: { type: Number, default: 5 },
    expiresAt:     { type: Date }
  }],
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// ── Auto-generate order number ────────────────
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'CX-' + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

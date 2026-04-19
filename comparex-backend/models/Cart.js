// =============================================
//   CompareX — Cart Model
//   File: models/Cart.js
// =============================================

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true
  },
  quantity: {
    type:    Number,
    default: 1,
    min:     1
  },
  price: {
    type:     Number,
    required: true
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true
  },
  items: [cartItemSchema],
  couponApplied: {
    code:     { type: String, default: '' },
    discount: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON:     { virtuals: true }
});

// ── Virtual: subtotal ─────────────────────────
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.virtual('total').get(function () {
  const sub = this.subtotal;
  return Math.max(0, sub - (this.couponApplied.discount || 0));
});

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);

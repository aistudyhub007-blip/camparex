// =============================================
//   CompareX — Payment Controller (Razorpay)
//   File: controllers/paymentController.js
// =============================================

const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ── POST /api/payment/create-order ────────────
// Creates a Razorpay order before payment
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Order already paid' });
    }

    const rzp = getRazorpay();
    const razorpayOrder = await rzp.orders.create({
      amount:   Math.round(order.total * 100),  // paise
      currency: order.currency || 'INR',
      receipt:  order.orderNumber,
      notes:    { orderId: order._id.toString(), userId: req.user._id.toString() }
    });

    // Save razorpay order id
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
      orderNumber:     order.orderNumber,
      user: {
        name:  req.user.name,
        email: req.user.email,
        phone: req.user.phone || ''
      }
    });

  } catch (error) {
    // Razorpay not configured — mock response for dev
    if (error.error?.description?.includes('key')) {
      return res.json({
        success:         true,
        mock:            true,
        razorpayOrderId: 'order_mock_' + Date.now(),
        amount:          100000,
        currency:        'INR',
        keyId:           'rzp_test_mock',
        message:         'Mock Razorpay order (add real keys in .env)'
      });
    }
    next(error);
  }
};

// ── POST /api/payment/verify ──────────────────
// Verifies Razorpay signature after payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Verify signature
    const body     = razorpayOrderId + '|' + razorpayPaymentId;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      // For mock/dev — allow if razorpayOrderId starts with 'order_mock_'
      if (!razorpayOrderId.startsWith('order_mock_')) {
        return res.status(400).json({ success: false, message: 'Payment signature invalid' });
      }
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.paymentStatus     = 'completed';
    order.orderStatus       = 'completed';
    order.razorpayOrderId   = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    res.json({
      success: true,
      message: 'Payment verified! Your products are ready to download 🎉',
      order:   { _id: order._id, orderNumber: order.orderNumber, paymentStatus: 'completed' }
    });

  } catch (error) {
    next(error);
  }
};

// ── POST /api/payment/refund (Admin) ─────────
exports.initiateRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason = 'Customer request' } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'No payment ID found for this order' });
    }

    const rzp = getRazorpay();
    const refund = await rzp.payments.refund(order.razorpayPaymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes:  { reason }
    });

    order.paymentStatus = 'refunded';
    await order.save();

    res.json({ success: true, message: 'Refund initiated', refund });
  } catch (error) {
    next(error);
  }
};

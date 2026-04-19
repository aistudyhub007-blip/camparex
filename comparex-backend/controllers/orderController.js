// =============================================
//   CompareX — Order Controller
//   File: controllers/orderController.js
// =============================================

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { validatePagination, isValidMongoId, sanitizeString } = require('../utils/validators');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseFormatter');

const TAX_RATE = 0.18;

// ── POST /api/orders ──────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    let { paymentMethod = 'razorpay', couponCode, notes = '' } = req.body;

    // Validate payment method
    const validPaymentMethods = ['razorpay', 'cod', 'upi'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return sendError(res, 400, 'Invalid payment method', ['Payment method must be one of: razorpay, cod, upi']);
    }

    // Sanitize notes
    if (notes) {
      notes = sanitizeString(notes).substring(0, 500);
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'title price image status');

    if (!cart || cart.items.length === 0) {
      return sendError(res, 400, 'Cart is empty', ['Add products to cart before creating order']);
    }

    // Validate products still active and have valid quantities
    const validationErrors = [];
    const invalidItems = [];

    for (const item of cart.items) {
      if (!item.product || item.product.status !== 'active') {
        invalidItems.push(item);
      }
      if (!item.quantity || item.quantity < 1) {
        validationErrors.push(`Item has invalid quantity: ${item.quantity}`);
      }
    }

    if (invalidItems.length > 0) {
      return sendError(res, 400, 'Some products are no longer available', [
        `${invalidItems.length} product(s) in your cart are no longer available`
      ]);
    }

    if (validationErrors.length > 0) {
      return sendError(res, 400, 'Cart validation failed', validationErrors);
    }

    const subtotal = cart.subtotal;

    // Validate subtotal
    if (!subtotal || subtotal <= 0) {
      return sendError(res, 400, 'Invalid cart total', ['Cart total must be greater than 0']);
    }

    // Apply coupon
    let discountAmount = 0;
    let coupon = null;
    if (couponCode && typeof couponCode === 'string' && couponCode.trim().length > 0) {
      couponCode = couponCode.toUpperCase().trim();
      coupon = await Coupon.findOne({ code: couponCode });
      if (coupon) {
        const validity = coupon.isValid(req.user._id, subtotal);
        if (validity.valid) {
          discountAmount = coupon.calculateDiscount(subtotal);
        } else {
          // Log invalid coupon but don't fail the order
          coupon = null;
        }
      }
    }

    // Calculate taxes and total
    const taxAmount = Math.round((subtotal - discountAmount) * TAX_RATE);
    const total = subtotal - discountAmount + taxAmount;

    if (total <= 0) {
      return sendError(res, 400, 'Invalid order total', ['Order total must be greater than 0']);
    }

    // Build order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      productTitle: item.product.title,
      productImage: item.product.image,
      price: item.price,
      quantity: item.quantity
    }));

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      couponCode: couponCode || '',
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes,
      downloadLinks: orderItems.map(item => ({
        product: item.product,
        downloadLimit: 5,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }))
    });

    // Mark coupon as used
    if (coupon) {
      try {
        coupon.usageCount += 1;
        coupon.usedBy.push(req.user._id);
        await coupon.save();
      } catch (err) {
        console.error('Error updating coupon:', err);
        // Don't fail the order if coupon update fails
      }
    }

    // Clear cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], couponApplied: { code: '', discount: 0 } }
    );

    sendSuccess(res, 201, 'Order created successfully', {
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod
      }
    });

  } catch (error) {
    next(error);
  }
};

// ── GET /api/orders (user's orders) ──────────
exports.getMyOrders = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    // Validate pagination
    const { page: pageNum, limit: limitNum } = validatePagination(page, limit);

    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments({ user: req.user._id })
    ]);

    sendPaginated(res, orders, total, pageNum, limitNum, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/orders/:id ───────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || !isValidMongoId(id)) {
      return sendError(res, 400, 'Invalid order ID format');
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user._id
    }).populate('items.product', 'title image filePath');

    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    sendSuccess(res, 200, 'Order retrieved successfully', { order });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/orders/:id/confirm-payment ──────
exports.confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate request data
    const errors = [];
    if (!id || !isValidMongoId(id)) {
      errors.push('Invalid order ID format');
    }
    if (!razorpayOrderId || typeof razorpayOrderId !== 'string' || razorpayOrderId.trim().length === 0) {
      errors.push('Razorpay Order ID is required');
    }
    if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string' || razorpayPaymentId.trim().length === 0) {
      errors.push('Razorpay Payment ID is required');
    }
    if (!razorpaySignature || typeof razorpaySignature !== 'string' || razorpaySignature.trim().length === 0) {
      errors.push('Razorpay Signature is required');
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Check if payment already confirmed
    if (order.paymentStatus === 'completed') {
      return sendError(res, 400, 'Payment already confirmed');
    }

    // Verify Razorpay signature
    const crypto = require('crypto');
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      return sendError(res, 400, 'Payment verification failed', ['Invalid payment signature']);
    }

    order.paymentStatus = 'completed';
    order.orderStatus = 'completed';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    sendSuccess(res, 200, 'Payment verified successfully! Order confirmed.', { order });
  } catch (error) {
    next(error);
  }
};

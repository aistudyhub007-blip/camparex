// =============================================
//   CompareX — Admin Controller
//   File: controllers/adminController.js
// =============================================

const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Coupon  = require('../models/Coupon');

// ── GET /api/admin/dashboard ──────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueResult,
      recentOrders,
      topProducts
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, tax: { $sum: '$taxAmount' }, discount: { $sum: '$discountAmount' } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('user', 'name email')
        .lean(),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', title: { $first: '$items.productTitle' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, unitsSold: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } },
        { $limit: 8 }
      ])
    ]);

    const revenue = revenueResult[0] || { total: 0, tax: 0, discount: 0 };

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue:  Math.round(revenue.total),
          totalTax:      Math.round(revenue.tax),
          totalDiscounts: Math.round(revenue.discount)
        },
        recentOrders,
        topProducts,
        monthlyRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/users ──────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query)
    ]);
    res.json({ success: true, total, users });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/admin/users/:id/toggle-block ───
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot block an admin' });

    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();
    res.json({ success: true, message: `User ${user.status === 'active' ? 'unblocked' : 'blocked'}`, status: user.status });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/orders ─────────────────────
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, paymentStatus, orderStatus } = req.query;
    const query = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (orderStatus)   query.orderStatus   = orderStatus;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'name email')
        .lean(),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, total, pages: Math.ceil(total / limit), orders });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/admin/orders/:id/status ────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { paymentStatus, orderStatus } = req.body;
    const update = {};
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (orderStatus)   update.orderStatus   = orderStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/reports/sales ─────────────
exports.salesReport = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const groupBy = period === 'daily'
      ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }
      : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };

    const report = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: groupBy, revenue: { $sum: '$total' }, orders: { $sum: 1 }, tax: { $sum: '$taxAmount' } } },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: period === 'daily' ? 30 : 12 }
    ]);

    res.json({ success: true, report: report.reverse() });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/admin/product ──────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/admin/product/:id ───────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/admin/product/:id ────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/admin/coupon ───────────────────
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created', coupon });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/admin/coupon/:id ─────────────
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/admin/coupons ───────────────────
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

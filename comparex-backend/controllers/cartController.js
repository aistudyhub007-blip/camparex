// =============================================
//   CompareX — Cart Controller
//   File: controllers/cartController.js
// =============================================

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validateNumber, isValidMongoId } = require('../utils/validators');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

// ── GET /api/cart ─────────────────────────────
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'title price originalPrice discount image category status');

    if (!cart) {
      return sendSuccess(res, 200, 'Cart is empty', {
        cart: { items: [], subtotal: 0, total: 0, itemCount: 0 }
      });
    }

    // Filter out inactive/deleted products and validate data
    const validItems = cart.items.filter(item => {
      if (!item.product || item.product.status !== 'active') return false;
      if (!item.quantity || item.quantity < 1) return false;
      return true;
    });

    // If items were filtered out, update the cart
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    sendSuccess(res, 200, 'Cart retrieved successfully', {
      cart: {
        _id: cart._id,
        items: cart.items,
        subtotal: cart.subtotal,
        total: cart.total,
        itemCount: cart.itemCount,
        couponApplied: cart.couponApplied
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/cart/add ────────────────────────
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    // Validate input
    const errors = [];
    if (!productId || !isValidMongoId(productId)) {
      errors.push('Valid product ID is required');
    }

    const qty = validateNumber(quantity, { min: 1, max: 1000, defaultValue: 1 });
    if (qty < 1) {
      errors.push('Quantity must be at least 1');
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) {
      return sendError(res, 404, 'Product not found or unavailable');
    }

    // Check stock if available
    if (product.stock !== undefined && product.stock < qty) {
      return sendError(res, 400, 'Insufficient stock', [`Only ${product.stock} items available`]);
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIdx = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingIdx > -1) {
      // Update quantity with stock check
      const newQty = cart.items[existingIdx].quantity + qty;
      if (product.stock !== undefined && newQty > product.stock) {
        return sendError(res, 400, 'Insufficient stock', [`Only ${product.stock} items available`]);
      }
      cart.items[existingIdx].quantity = newQty;
    } else {
      // Add new item
      cart.items.push({ product: productId, price: product.price, quantity: qty });
    }

    await cart.save();
    await cart.populate('items.product', 'title price originalPrice discount image category');

    sendSuccess(res, 200, `${product.title} added to cart`, {
      cart: {
        items: cart.items,
        subtotal: cart.subtotal,
        total: cart.total,
        itemCount: cart.itemCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/cart/remove/:productId ────────
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    if (!productId || !isValidMongoId(productId)) {
      return sendError(res, 400, 'Invalid product ID format');
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return sendError(res, 404, 'Cart is empty');
    }

    const before = cart.items.length;
    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    if (cart.items.length === before) {
      return sendError(res, 404, 'Item not found in cart');
    }

    await cart.save();
    sendSuccess(res, 200, 'Item removed from cart', { itemCount: cart.itemCount });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/cart/update ──────────────────────
exports.updateQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    // Validate input
    const errors = [];
    if (!productId || !isValidMongoId(productId)) {
      errors.push('Valid product ID is required');
    }

    const qty = validateNumber(quantity, { min: 1, max: 1000 });
    if (qty < 1) {
      errors.push('Quantity must be at least 1');
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) {
      return sendError(res, 404, 'Item not in cart');
    }

    // Validate stock if product has stock info
    const product = await Product.findById(productId);
    if (product && product.stock !== undefined && qty > product.stock) {
      return sendError(res, 400, 'Insufficient stock', [`Only ${product.stock} items available`]);
    }

    item.quantity = qty;
    await cart.save();

    sendSuccess(res, 200, 'Quantity updated', {
      subtotal: cart.subtotal,
      total: cart.total,
      itemCount: cart.itemCount
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/cart/clear ────────────────────
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], couponApplied: { code: '', discount: 0 } },
      { new: true }
    );

    if (!cart) {
      return sendError(res, 404, 'Cart not found');
    }

    sendSuccess(res, 200, 'Cart cleared successfully', { cart });
  } catch (error) {
    next(error);
  }
};

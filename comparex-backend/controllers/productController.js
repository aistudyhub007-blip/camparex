// =============================================
//   CompareX — Product Controller
//   File: controllers/productController.js
// =============================================

const Product = require('../models/Product');
const { 
  validatePagination, 
  validateNumber, 
  validateProductData,
  sanitizeFilters,
  isValidMongoId
} = require('../utils/validators');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseFormatter');

// ── GET /api/products ─────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    let {
      search, category, minPrice, maxPrice,
      sort = 'newest', page = 1, limit = 12, featured
    } = req.query;

    // Validate and sanitize pagination
    const { page: pageNum, limit: limitNum } = validatePagination(page, limit);

    const query = { status: 'active' };

    // Search - sanitize input
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitized = search.trim().substring(0, 100); // Limit search length
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } }
      ];
    }

    // Filters - sanitize
    if (category && typeof category === 'string' && category.trim().length > 0) {
      query.category = category.trim().substring(0, 50);
    }

    if (featured === 'true') {
      query.featured = true;
    }

    // Price filters - validate numeric
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        const min = validateNumber(minPrice, { min: 0, max: 1000000 });
        if (!isNaN(min)) query.price.$gte = min;
      }
      if (maxPrice) {
        const max = validateNumber(maxPrice, { min: 0, max: 1000000 });
        if (!isNaN(max)) query.price.$lte = max;
      }
    }

    // Sort - validate input
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      popular: { totalReviews: -1 }
    };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    // Calculate skip
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortQuery).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query)
    ]);

    sendPaginated(res, products, total, pageNum, limitNum, 'Products retrieved successfully');

  } catch (error) {
    next(error);
  }
};

// ── GET /api/products/:id ─────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    const query = {
      status: 'active',
      $or: [
        { _id: isValidMongoId(id) ? id : null },
        { slug: id }
      ].filter(q => q._id !== null || q.slug)
    };

    const product = await Product.findOne(query).lean();

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    // Related products (same category)
    const related = await Product.find({
      category: product.category,
      status: 'active',
      _id: { $ne: product._id }
    }).limit(4).select('title price originalPrice discount rating category image slug').lean();

    sendSuccess(res, 200, 'Product retrieved successfully', { product, related });

  } catch (error) {
    next(error);
  }
};

// ── POST /api/products (Admin) ────────────────
exports.createProduct = async (req, res, next) => {
  try {
    // Validate product data
    const validation = validateProductData(req.body);
    if (!validation.valid) {
      return sendError(res, 400, 'Validation failed', validation.errors);
    }

    // Sanitize input
    const productData = {
      title: req.body.title?.trim().substring(0, 200),
      description: req.body.description?.trim().substring(0, 5000),
      category: req.body.category?.trim().substring(0, 50),
      price: parseFloat(req.body.price),
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
      image: req.body.image,
      status: req.body.status || 'active',
      featured: req.body.featured || false,
      tags: Array.isArray(req.body.tags) ? req.body.tags.slice(0, 10) : [],
      createdBy: req.user._id
    };

    const product = await Product.create(productData);
    sendSuccess(res, 201, 'Product created successfully', { product });

  } catch (error) {
    next(error);
  }
};

// ── PUT /api/products/:id (Admin) ─────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!isValidMongoId(id)) {
      return sendError(res, 400, 'Invalid product ID format');
    }

    // Validate product data if provided
    if (Object.keys(req.body).length > 0) {
      const validation = validateProductData(req.body);
      if (!validation.valid) {
        return sendError(res, 400, 'Validation failed', validation.errors);
      }
    }

    // Sanitize updateable fields
    const updates = {};
    const allowedFields = ['title', 'description', 'category', 'price', 'originalPrice', 'image', 'status', 'featured', 'tags'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'originalPrice') {
          updates[field] = parseFloat(req.body[field]);
        } else if (field === 'title' || field === 'description') {
          updates[field] = req.body[field]?.trim().substring(0, field === 'title' ? 200 : 5000);
        } else if (field === 'tags' && Array.isArray(req.body[field])) {
          updates[field] = req.body[field].slice(0, 10);
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    sendSuccess(res, 200, 'Product updated successfully', { product });

  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/products/:id (Admin) ──────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!isValidMongoId(id)) {
      return sendError(res, 400, 'Invalid product ID format');
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    sendSuccess(res, 200, 'Product deleted successfully (soft delete)', { product });

  } catch (error) {
    next(error);
  }
};

// ── GET /api/products/categories ─────────────
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { status: 'active' });

    if (!categories || categories.length === 0) {
      return sendSuccess(res, 200, 'No categories found', { categories: [] });
    }

    sendSuccess(res, 200, 'Categories retrieved successfully', { categories });
  } catch (error) {
    next(error);
  }
};

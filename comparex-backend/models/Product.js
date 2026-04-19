// =============================================
//   CompareX — Product Model
//   File: models/Product.js
// =============================================

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type:      String,
    required:  [true, 'Product title is required'],
    trim:      true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  slug: {
    type:   String,
    unique: true,
    lowercase: true
  },
  description: {
    type:    String,
    default: ''
  },
  shortDescription: {
    type:      String,
    maxlength: [300, 'Short description cannot exceed 300 characters'],
    default:   ''
  },
  price: {
    type:     Number,
    required: [true, 'Price is required'],
    min:      [0, 'Price cannot be negative']
  },
  originalPrice: {
    type:    Number,
    default: 0
  },
  discount: {
    type:    Number,
    default: 0,
    min:     0,
    max:     100
  },
  category: {
    type:     String,
    required: [true, 'Category is required'],
    enum:     ['Course', 'Template', 'Tool', 'eBook', 'Plugin', 'Other'],
    default:  'Other'
  },
  image: {
    type:    String,
    default: ''
  },
  screenshots: [{
    type: String
  }],
  rating: {
    type:    Number,
    default: 0,
    min:     0,
    max:     5
  },
  totalReviews: {
    type:    Number,
    default: 0
  },
  filePath: {
    type:    String,
    default: ''
  },
  fileSize: {
    type:    String,
    default: ''
  },
  status: {
    type:    String,
    enum:    ['active', 'inactive'],
    default: 'active'
  },
  featured: {
    type:    Boolean,
    default: false
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User'
  }
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true }
});

// ── Auto-generate slug ────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now();
  }
  // Auto-calculate discount %
  if (this.originalPrice > this.price) {
    this.discount = Math.round((1 - this.price / this.originalPrice) * 100);
  }
  next();
});

// ── Text search index ─────────────────────────
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);

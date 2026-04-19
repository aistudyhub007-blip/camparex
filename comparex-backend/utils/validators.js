// =============================================
//   CompareX — Data Validation Utilities
//   File: utils/validators.js
// =============================================

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength (min 8 chars, 1 uppercase, 1 number)
 * @param {string} password
 * @returns {object} { valid: boolean, message: string }
 */
const isValidPassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Password is valid' };
};

/**
 * Validate phone number (basic international format)
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize string (remove special characters, trim whitespace)
 * @param {string} str
 * @returns {string}
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>\"'%;()&+]/g, '');
};

/**
 * Validate and parse pagination params
 * @param {number} page
 * @param {number} limit
 * @returns {object} { page: number, limit: number }
 */
const validatePagination = (page = 1, limit = 12) => {
  let pageNum = parseInt(page);
  let limitNum = parseInt(limit);

  // Default and bounds checking
  pageNum = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  limitNum = isNaN(limitNum) || limitNum < 1 ? 12 : limitNum;
  limitNum = Math.min(limitNum, 100); // Max 100 per page

  return { page: pageNum, limit: limitNum };
};

/**
 * Validate and parse numeric value
 * @param {any} value
 * @param {object} options { min, max, default }
 * @returns {number}
 */
const validateNumber = (value, options = {}) => {
  const { min = -Infinity, max = Infinity, defaultValue = 0 } = options;
  let num = parseFloat(value);

  if (isNaN(num)) return defaultValue;
  if (num < min) return min;
  if (num > max) return max;

  return num;
};

/**
 * Check if value is a valid MongoDB ID
 * @param {string} id
 * @returns {boolean}
 */
const isValidMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate product data
 * @param {object} data
 * @returns {object} { valid: boolean, errors: array }
 */
const validateProductData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!data.category || data.category.trim().length < 2) {
    errors.push('Category is required');
  }

  if (data.price === undefined || data.price === null) {
    errors.push('Price is required');
  } else {
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      errors.push('Price must be a positive number');
    }
  }

  if (data.originalPrice !== undefined && data.originalPrice !== null) {
    const origPrice = parseFloat(data.originalPrice);
    if (isNaN(origPrice) || origPrice < 0) {
      errors.push('Original price must be a positive number');
    }
  }

  if (data.category && data.category.trim().length > 50) {
    errors.push('Category must be 50 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate order data
 * @param {object} data
 * @returns {object} { valid: boolean, errors: array }
 */
const validateOrderData = (data) => {
  const errors = [];

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, idx) => {
      if (!item.productId || !isValidMongoId(item.productId)) {
        errors.push(`Item ${idx + 1}: Invalid product ID`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${idx + 1}: Quantity must be at least 1`);
      }
    });
  }

  if (data.paymentMethod && !['razorpay', 'cod', 'upi'].includes(data.paymentMethod)) {
    errors.push('Invalid payment method');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize filter input for queries
 * @param {object} filters
 * @returns {object}
 */
const sanitizeFilters = (filters) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = validateNumber(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => 
        typeof v === 'string' ? sanitizeString(v) : v
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  sanitizeString,
  validatePagination,
  validateNumber,
  isValidMongoId,
  validateProductData,
  validateOrderData,
  sanitizeFilters
};

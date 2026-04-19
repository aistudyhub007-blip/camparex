// =============================================
//   CompareX — Response Formatter Utilities
//   File: utils/responseFormatter.js
// =============================================

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {any} data - Response data
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {array} errors - Array of error details
 */
const sendError = (res, statusCode = 400, message = 'Error', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && Array.isArray(errors) && errors.length > 0 && { errors })
  };
  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {object} res - Express response object
 * @param {array} items - Array of items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Response message
 */
const sendPaginated = (res, items, total, page, limit, message = 'Success') => {
  const pages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    },
    data: items
  });
};

/**
 * Validate and extract request data
 * @param {object} req - Express request object
 * @param {array} requiredFields - Array of required field names
 * @returns {object} { valid: boolean, data: object, errors: array }
 */
const extractValidatedData = (req, requiredFields = []) => {
  const data = { ...req.body };
  const errors = [];

  // Check for required fields
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  return {
    valid: errors.length === 0,
    data,
    errors
  };
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
  extractValidatedData
};

// =============================================
//   CompareX — Error Handler Middleware
//   File: middleware/errorHandler.js
// =============================================

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose CastError (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
    errors = [`Expected valid MongoDB ID, received: ${err.kind}`];
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate entry`;
    errors = [`${field.charAt(0).toUpperCase() + field.slice(1)} "${err.keyValue[field]}" already exists`];
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map(e => e.message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication failed';
    errors = ['Invalid or malformed token'];
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication expired';
    errors = ['Token has expired. Please login again'];
  }

  // RangeError (usually from invalid data)
  if (err.name === 'RangeError') {
    statusCode = 400;
    message = 'Invalid input data';
    errors = [err.message];
  }

  // TypeError (usually from null/undefined access)
  if (err.name === 'TypeError') {
    statusCode = 400;
    message = 'Invalid request data';
    errors = [err.message];
  }

  // Log error with context
  const errorLog = {
    timestamp: new Date().toISOString(),
    statusCode,
    message,
    errors,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      body: req.body,
      query: req.query
    })
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error Details:', JSON.stringify(errorLog, null, 2));
  } else {
    console.error('❌ Error:', { timestamp: errorLog.timestamp, statusCode, message });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      debug: {
        errorName: err.name,
        path: req.path,
        method: req.method
      }
    })
  });
};

module.exports = errorHandler;

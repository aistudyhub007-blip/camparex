// =============================================
//   CompareX — Product Routes
//   File: routes/productRoutes.js
// =============================================

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

// Public
router.get('/',            ctrl.getProducts);
router.get('/categories',  ctrl.getCategories);
router.get('/:id',         ctrl.getProduct);

// Admin only
router.post('/',           protect, adminOnly, ctrl.createProduct);
router.put('/:id',         protect, adminOnly, ctrl.updateProduct);
router.delete('/:id',      protect, adminOnly, ctrl.deleteProduct);

module.exports = router;

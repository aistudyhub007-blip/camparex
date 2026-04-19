// =============================================
//   CompareX — Cart Routes
//   File: routes/cartRoutes.js
// =============================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/',                    ctrl.getCart);
router.post('/add',                ctrl.addToCart);
router.put('/update',              ctrl.updateQuantity);
router.delete('/remove/:productId',ctrl.removeFromCart);
router.delete('/clear',            ctrl.clearCart);

module.exports = router;

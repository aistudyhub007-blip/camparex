// =============================================
//   CompareX — Order Routes
//   File: routes/orderRoutes.js
// =============================================
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/',                        ctrl.createOrder);
router.get('/',                         ctrl.getMyOrders);
router.get('/:id',                      ctrl.getOrder);
router.post('/:id/confirm-payment',     ctrl.confirmPayment);

module.exports = router;

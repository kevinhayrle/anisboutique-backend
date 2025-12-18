const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { adminLogin } = require('../controllers/adminAuthController');

const {
  getAllProducts,
  deleteProduct,
  addProduct,
  updateProduct,
  updateProductOrder     // ✅ ALREADY EXISTS IN CONTROLLER
} = require('../controllers/productController');

const {
  addCoupon,
  getAllCoupons,
  deleteCoupon
} = require('../controllers/couponController');

/* =======================
   EXISTING ROUTES
======================= */

router.post('/login', adminLogin);

router.get('/products', verifyToken, getAllProducts);

router.delete('/delete/:id', verifyToken, deleteProduct);

router.post('/add', verifyToken, addProduct);

router.put('/update/:id', verifyToken, updateProduct);

/* ✅✅✅ MISSING ROUTE (FIX) ✅✅✅ */
router.put('/products/reorder', verifyToken, updateProductOrder);

/* =======================
   COUPON ROUTES
======================= */

router.post('/coupons/add', verifyToken, addCoupon);
router.get('/coupons', verifyToken, getAllCoupons);
router.delete('/coupons/delete/:id', verifyToken, deleteCoupon);

module.exports = router;

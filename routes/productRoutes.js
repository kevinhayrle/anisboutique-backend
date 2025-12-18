const express = require('express');
const router = express.Router();

const {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllCategories,
  updateProductOrder   // ✅ ALREADY EXISTS IN CONTROLLER
} = require('../controllers/productController');

/* ============================
   TEST ROUTE
============================ */
router.get('/test', (req, res) => {
  res.json({ message: '✅ Product route is working!' });
});

/* ============================
   ADMIN / PRODUCT ROUTES
============================ */

/* Add product */
router.post('/', addProduct);

/* Get ALL products (used by main site & admin) */
router.get('/', getAllProducts);

/* Reorder products (drag & drop) ✅ REQUIRED */
router.put('/reorder', updateProductOrder);

/* Categories */
router.get('/categories', getAllCategories);

/* Get single product */
router.get('/:id', getProductById);

/* Update product */
router.put('/:id', updateProduct);

/* Delete product */
router.delete('/:id', deleteProduct);

module.exports = router;

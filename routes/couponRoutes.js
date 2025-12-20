const express = require('express');
const router = express.Router();
const db = require('../db');
const { applyCoupon } = require('../controllers/couponController');

/*
=================================
✅ GET ACTIVE COUPONS (PUBLIC)
GET /api/coupons
→ Used by cart.html to SHOW available coupons
=================================
*/
router.get('/', async (req, res) => {
  try {
    const [coupons] = await db.query(`
      SELECT 
        coupon_code,
        discount_type,
        discount_value,
        min_cart_value,
        max_discount,
        expiry_date
      FROM coupons
      WHERE is_active = 1
        AND (expiry_date IS NULL OR expiry_date >= CURDATE())
      ORDER BY created_at DESC
    `);

    res.json(coupons);
  } catch (err) {
    console.error('Error fetching public coupons:', err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

/*
=================================
✅ APPLY COUPON (USER / CART)
POST /api/coupons/apply
→ Validated server-side (safe)
=================================
*/
router.post('/apply', applyCoupon);

module.exports = router;

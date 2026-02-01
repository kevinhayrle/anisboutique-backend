const Razorpay = require("razorpay");
const db = require("../db");
const { sendOrderEmail } = require("../utils/mailer");
require("dotenv").config();

/* =====================================================
   RAZORPAY INSTANCE
===================================================== */
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =====================================================
   CREATE RAZORPAY ORDER
   POST /api/payment/create-order
===================================================== */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { total_amount } = req.body;

    if (!total_amount || isNaN(total_amount) || total_amount < 100) {
      return res.status(400).json({
        error: "Invalid amount. Minimum ₹1 required."
      });
    }

    const options = {
      amount: Math.round(total_amount), // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpayInstance.orders.create(options);

    res.json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({
      error: "Failed to create Razorpay order"
    });
  }
};

/* =====================================================
   HANDLE CHECKOUT (SAVE ORDER)
   POST /api/checkout
===================================================== */
exports.handleCheckout = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      cart,
      payment,
      total_amount
    } = req.body;

    /* ---------- BASIC VALIDATION ---------- */
    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !payment ||
      !Array.isArray(cart) ||
      cart.length === 0 ||
      !total_amount
    ) {
      return res.status(400).json({
        error: "Missing required checkout details."
      });
    }

    /* ---------- CREATE ORDER ---------- */
    const [orderResult] = await db.query(
      `INSERT INTO orders
       (name, email, phone, address, payment, total_amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name, email, phone, address, payment, total_amount]
    );

    const orderId = orderResult.insertId;

    /* ---------- INSERT ORDER ITEMS ---------- */
    const orderItemsQueries = cart.map(item => {
      if (!item.id || !item.quantity || !item.price) {
        throw new Error("Invalid cart item");
      }

      return db.query(
        `INSERT INTO order_items
         (order_id, product_id, size, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.size || null,
          item.quantity,
          item.price
        ]
      );
    });

    await Promise.all(orderItemsQueries);

    /* ---------- SEND EMAIL ---------- */
    try {
      await sendOrderEmail({
        name,
        email,
        phone,
        address,
        cart,
        payment,
        total_amount,
        orderId
      });
    } catch (mailErr) {
      console.error("Order placed but email failed:", mailErr);
      // Email failure should NOT block order success
    }

    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order_id: orderId
    });

  } catch (err) {
    console.error("Error during checkout:", err);
    res.status(500).json({
      error: "Failed to process order"
    });
  }
};

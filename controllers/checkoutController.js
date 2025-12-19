
const Razorpay = require("razorpay");
const pool = require("../db");
const { sendOrderEmail } = require("../utils/mailer");

require("dotenv").config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { total_amount } = req.body;

    if (!total_amount || total_amount < 100) {
      return res.status(400).json({ message: "Invalid amount." });
    }

    const options = {
      amount: total_amount, 
      currency: "INR",
      receipt: "receipt_order_" + new Date().getTime(),
      payment_capture: 1, 
    };

    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

exports.handleCheckout = async (req, res) => {
  try {
    const { name, email, phone, address, cart, payment, total_amount } = req.body;

    if (!payment || !cart || cart.length === 0) {
      return res.status(400).json({ message: "Missing payment or cart info" });
    }

    const [orderResult] = await pool.query(
      `INSERT INTO orders (name, email, phone, address, payment, total_amount) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, address, payment, total_amount]
    );

    const orderId = orderResult.insertId;

    const orderItemsPromises = cart.map((item) => {
      return pool.query(
        `INSERT INTO order_items (order_id, product_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.id, item.size, item.quantity, item.price]
      );
    });

    await Promise.all(orderItemsPromises);

    await sendOrderEmail({ name, email, phone, address, cart, payment, total_amount });

    res.status(200).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Error in handleCheckout:", error);
    res.status(500).json({ message: "Failed to process order" });
  }
};
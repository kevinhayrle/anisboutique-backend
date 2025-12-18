const express = require('express');
const cors = require("cors");
require('dotenv').config();

const app = express();
console.log('👋 Anis Boutique backend started');

const allowedOrigins = [
  'https://anisboutique.netlify.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
console.log('✅ CORS configured');

app.use(express.json());
console.log('✅ express.json middleware loaded');

try {
  const adminRoutes = require('./routes/adminRoutes');
  const authRoutes = require('./routes/auth');
  const productRoutes = require('./routes/productRoutes');
  const couponRoutes = require('./routes/couponRoutes'); // ✅ ADDED
  const checkoutRoutes = require("./routes/checkoutRoutes");
  const orderRoutes = require("./routes/orderRoutes");

  app.use('/api/admin', adminRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/coupons', couponRoutes); // ✅ ADDED
  app.use("/api/checkout", checkoutRoutes);
  app.use("/api", orderRoutes);
  console.log('✅ Routes registered');
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
}

app.get('/', (req, res) => {
  res.send('Pasheon backend is running ✅');
});

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("❌ Render's PORT is not defined in environment");
}

app.listen(PORT, () => {
  console.log(`🚀 Anis Boutique backend running on port ${PORT}`);
});

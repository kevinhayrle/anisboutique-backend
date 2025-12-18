# Pasheon — Backend
This is the backend repository for *Pasheon*, a minimalist and mobile-friendly e-commerce platform for fashion and accessories. Built using Node.js, Express, and MySQL, this backend handles product management, checkout processing with Razorpay, and customer data handling — all optimized for simplicity, speed, and manual delivery workflow.

# Core Responsibilities
- Product CRUD with support for sizes and multiple images
- Category-based product filtering
- Razorpay integration for online payments
- Secure order and customer data storage
- Order notification via email to admin
- API endpoints for cart, checkout, and product browsing
- Simple OTP-based email verification for sign-up

# API ENDPOINTS 

# Auth
- POST /api/auth/signup → Register a new user (with OTP email)
- POST /api/auth/login → Login using email + password
- POST /api/auth/verify-otp → Verify OTP to complete signup
- POST /api/auth/forgot-password → Request password reset via OTP
- POST /api/auth/reset-password → Reset password using OTP

# Products
- GET /api/products/ → Fetch all products
- GET /api/products/:id → Get single product by ID
- POST /api/products/ → Add a new product (admin only)
- PUT /api/products/:id → Update product (admin only)
- DELETE /api/products/:id → Delete product (admin only)

# Categories
- GET /api/products/categories → Get all product categories

# Checkout
- POST /api/checkout/create-order → Create Razorpay order
- POST /api/checkout/ → Capture payment, store order, send email

# Orders
- GET /api/orders/:phone → Fetch order(s) by phone number

> Note: Some routes require authentication or admin access.
> All checkout/payment is guest-based — no login required to place order.

# Technologies Used
- Node.js + Express.js
- MySQL with mysql2
- Razorpay for payment gateway
- Nodemailer for order email notifications
- JWT for user authentication
- Bcrypt for password hashing
- dotenv for environment management

# Security & Privacy
- Passwords are securely hashed with bcrypt
- No card or sensitive payment info is stored
- Checkout works without login; only customer data is saved
- All private/admin routes are protected via middleware

# Deployment
Backend is hosted on Render (or any Node.js-compatible server).  
To deploy:
- Push code to GitHub
- Connect Render app to this repo
- Set environment variables in Render dashboard

# Developer
**Kevin Antony**  
*Full-stack Developer & Creator of Pasheon*   

# License
Backend code © 2025 **Kevin Antony**  
All rights reserved. Redistribution or replication is not permitted without written consent.  


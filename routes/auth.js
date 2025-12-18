const express = require('express');
const router = express.Router();

const {
  signupUser,
  loginUser,
  verifyOTP,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/signup', signupUser);

router.post('/verify-otp', verifyOTP);

router.post('/login', loginUser);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

module.exports = router;
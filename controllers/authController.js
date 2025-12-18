const db = require('../db');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/hash');
const { sendOTPEmail } = require('../utils/mailer');
const JWT_SECRET = 'your_jwt_secret_key';
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.signupUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Please fill all the fields.' });
  }

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email is already registered. Please log in.' });
    }

    const otp = generateOTP();
    const hashedPassword = await hashPassword(password);

    await db.query('DELETE FROM pending_users WHERE email = ?', [email]);

    await db.query(
      'INSERT INTO pending_users (name, email, phone, password, otp, expires_at) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [name, email, phone, hashedPassword, otp]
    );

    await sendOTPEmail(email, otp, name);

    res.status(200).json({ message: 'OTP sent to your email. Please verify to complete signup.' });

  } catch (err) {
    console.error('Signup error (OTP):', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM pending_users WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const userData = rows[0];

    const [result] = await db.query(
      'INSERT INTO users (email, name, phone, password, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userData.email, userData.name, userData.phone, userData.password]
    );

    await db.query('DELETE FROM pending_users WHERE email = ?', [email]);

    const token = jwt.sign({ id: result.insertId }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'Signup complete', token, name: userData.name });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
};


exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please fill all the fields' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No account found for this email' });
    }

    const user = rows[0];
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user.user_id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token: token,
      name: user.name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(`
      INSERT INTO password_reset_requests (email, otp, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)
    `, [email, otp, expiresAt]);

    await sendOTPEmail(email, otp); 

    res.json({ success: true, message: 'OTP sent to your email.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};


exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM password_reset_requests WHERE email = ? AND otp = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    await db.query('DELETE FROM password_reset_requests WHERE email = ?', [email]);

    res.status(200).json({ message: 'Password reset successful.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error during password reset.' });
  }
};
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool } = require('./db');

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-this-later';

// Verify JWT token and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const result = await pool.query('SELECT id, email, name, user_type FROM users WHERE id = $1', [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    req.user = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      userType: user.user_type
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if authenticated user is an admin
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Forbidden — admin access required' });
  }
  next();
};

// Rate limit login/register attempts: 10 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authenticate, requireAdmin, loginLimiter };

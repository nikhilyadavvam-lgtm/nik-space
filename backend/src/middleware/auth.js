const jwt = require('jsonwebtoken');
const User = require('../models/User');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error in admin authentication' });
  }
}

module.exports = { requireAuth, requireAdmin };

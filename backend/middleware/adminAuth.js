const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Admin access token required' });
    }

    // Verify token and then fetch user from DB to check role (don't trust client-supplied JWT claims)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: 'Admin account not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    req.admin = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid admin token' });
  }
};

module.exports = adminAuth;
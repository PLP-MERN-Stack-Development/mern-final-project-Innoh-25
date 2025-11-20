const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const router = express.Router();

// Admin-only login
router.post('/login', async (req, res) => {
  try {
    const { email, password, adminKey } = req.body;

    console.log('Admin login attempt:', { email, adminKey: adminKey ? 'provided' : 'missing' });

    // Verify admin security key
    if (adminKey !== process.env.ADMIN_SECURITY_KEY) {
      console.log('Invalid admin key attempt');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid admin access credentials' 
      });
    }

    // Find user and verify admin role
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Administrator access required'
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate admin-specific token
    const token = jwt.sign(
      { 
        id: user._id,
        role: 'admin',
        isAdmin: true,
        access: 'admin_panel'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Shorter session for security
    );

    console.log('Admin login successful:', user.email);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
});

// Verify admin token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Admin user not found' });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

module.exports = router;
const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/Users');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

// Get all pending pharmacy approvals
router.get('/pharmacies/pending', adminAuth, async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ status: 'pending_approval' })
      .populate('owner', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pharmacies
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all approved pharmacies
router.get('/pharmacies/approved', adminAuth, async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ status: 'approved' })
      .populate('owner', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pharmacies
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve pharmacy
router.put('/pharmacies/:id/approve', adminAuth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        isVerified: true,
        approvedBy: req.admin._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'firstName lastName email phone');

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      message: 'Pharmacy approved successfully',
      data: pharmacy
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject pharmacy
router.put('/pharmacies/:id/reject', adminAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectionReason,
        isVerified: false
      },
      { new: true }
    ).populate('owner', 'firstName lastName email phone');

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      message: 'Pharmacy rejected',
      data: pharmacy
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalPharmacies,
      pendingPharmacies,
      approvedPharmacies,
      totalUsers,
      totalPatients,
      totalPharmacists
    ] = await Promise.all([
      Pharmacy.countDocuments(),
      Pharmacy.countDocuments({ status: 'pending_approval' }),
      Pharmacy.countDocuments({ status: 'approved' }),
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'pharmacist' })
    ]);

    res.json({
      success: true,
      data: {
        totalPharmacies,
        pendingPharmacies,
        approvedPharmacies,
        totalUsers,
        totalPatients,
        totalPharmacists
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users with detailed information
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    // Build query
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Get additional statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          totalUsers: total
        },
        stats: userStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get user by ID with complete details
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user is pharmacist, get their pharmacy info
    let pharmacy = null;
    if (user.role === 'pharmacist') {
      pharmacy = await Pharmacy.findOne({ owner: user._id });
    }

    res.json({
      success: true,
      data: {
        user,
        pharmacy
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update user account (activate/deactivate, change role, etc.)
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { isActive, role, isVerified } = req.body;
    
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Reject pharmacy with reason
router.put('/pharmacies/:id/reject', adminAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const pharmacy = await Pharmacy.findById(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    // UPDATE PHARMACY STATUS AND REASON (DON'T DELETE)
    pharmacy.status = 'rejected';
    pharmacy.rejectionReason = rejectionReason;
    await pharmacy.save();

    res.json({
      success: true,
      message: 'Pharmacy rejected successfully',
      pharmacy: pharmacy
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pharmacies with detailed information
router.get('/all-pharmacies', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }

    const pharmacies = await Pharmacy.find(query)
      .populate('owner', 'firstName lastName email phone username')
      .populate('approvedBy', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Pharmacy.countDocuments(query);

    // Get pharmacy statistics by status
    const pharmacyStats = await Pharmacy.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        pharmacies,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          totalPharmacies: total
        },
        stats: pharmacyStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get comprehensive dashboard statistics
router.get('/comprehensive-stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalPharmacists,
      totalAdmins,
      totalPharmacies,
      pendingPharmacies,
      approvedPharmacies,
      rejectedPharmacies,
      recentUsers,
      recentPharmacies
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'pharmacist' }),
      User.countDocuments({ role: 'admin' }),
      Pharmacy.countDocuments(),
      Pharmacy.countDocuments({ status: 'pending_approval' }),
      Pharmacy.countDocuments({ status: 'approved' }),
      Pharmacy.countDocuments({ status: 'rejected' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt'),
      Pharmacy.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'firstName lastName')
    ]);

    // Get registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          patients: totalPatients,
          pharmacists: totalPharmacists,
          admins: totalAdmins
        },
        pharmacies: {
          total: totalPharmacies,
          pending: pendingPharmacies,
          approved: approvedPharmacies,
          rejected: rejectedPharmacies
        },
        recentActivity: {
          users: recentUsers,
          pharmacies: recentPharmacies
        },
        trends: registrationTrends
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // If user is pharmacist, handle their pharmacy
    if (user.role === 'pharmacist') {
      await Pharmacy.deleteMany({ owner: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


module.exports = router;
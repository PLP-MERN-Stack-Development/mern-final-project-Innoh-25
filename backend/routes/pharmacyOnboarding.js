const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Check if pharmacist has completed pharmacy profile
router.get('/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    
    if (!pharmacy) {
      return res.json({
        hasPharmacy: false,
        status: 'no_pharmacy'
      });
    }

    res.json({
      hasPharmacy: true,
      status: pharmacy.status,
      rejectionReason: pharmacy.rejectionReason,
      pharmacy: pharmacy
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// NEW ROUTE: Handle file uploads
router.post('/upload-certificates', auth, upload.array('certificates', 5), async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileUrls = req.files.map(file => ({
      name: file.originalname,
      fileUrl: `/uploads/certificates/${file.filename}`,
      uploadedAt: new Date()
    }));

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      certificates: fileUrls
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed', 
      error: error.message 
    });
  }
});

// Create or update pharmacy profile
router.post('/complete-profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      name,
      licenseNumber,
      email,
      phone,
      address,
      coordinates,
      operatingHours,
      services,
      description,
      certificates
    } = req.body;

    // Check if pharmacy already exists for this user
    let pharmacy = await Pharmacy.findOne({ owner: req.user.id });

    // MODIFIED: Allow updates if pharmacy is rejected or draft
    if (pharmacy && pharmacy.status === 'approved') {
      return res.status(400).json({ 
        message: 'Pharmacy profile already approved and cannot be modified' 
      });
    }

    const pharmacyData = {
      name,
      licenseNumber,
      email,
      phone,
      address,
      location: {
        type: 'Point',
        coordinates: coordinates || [0, 0]
      },
      operatingHours,
      services,
      description,
      certificates,
      status: 'pending_approval', // Reset to pending when resubmitting
      rejectionReason: '', // Clear rejection reason when resubmitting
      isVerified: false
    };

    if (pharmacy) {
      // Update existing pharmacy (including rejected ones)
      pharmacy = await Pharmacy.findByIdAndUpdate(
        pharmacy._id,
        pharmacyData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new pharmacy
      pharmacyData.owner = req.user.id;
      pharmacy = new Pharmacy(pharmacyData);
      await pharmacy.save();
    }

    await pharmacy.populate('owner', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Pharmacy profile submitted for approval',
      pharmacy: pharmacy
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Pharmacy with this license number or email already exists' 
      });
    }
    res.status(400).json({ message: 'Profile completion failed', error: error.message });
  }
});


// Get pharmacy profile for editing
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy profile not found' });
    }

    res.json(pharmacy);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
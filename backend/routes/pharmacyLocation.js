const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const auth = require('../middleware/auth');

const router = express.Router();

// Set pharmacy location (after approval)
router.post('/set-location', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    // Find pharmacist's pharmacy (allow setting location even before approval)
    const pharmacy = await Pharmacy.findOne({ 
      owner: req.user.id
    });

    if (!pharmacy) {
      return res.status(404).json({ 
        success: false,
        message: 'No pharmacy found for this account. Please create a pharmacy first.' 
      });
    }

    // Update location in MongoDB GeoJSON format
    pharmacy.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)] // [lng, lat]
    };
    
    // Initialize address object if it doesn't exist
    if (!pharmacy.address) {
      pharmacy.address = {};
    }
    
    // Update address coordinates in lat/lng format
    pharmacy.address.coordinates = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude)
    };
    
    // Update address text if provided
    if (address) {
      pharmacy.address.address = address;
    }
    
    pharmacy.locationSet = true;

    await pharmacy.save();

    res.json({
      success: true,
      message: 'Pharmacy location set successfully',
      pharmacy: pharmacy
    });

  } catch (error) {
    console.error('Set location error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to set location', 
      error: error.message 
    });
  }
});

// Get pharmacy location status
router.get('/location-status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.json({
      success: true,
      locationSet: pharmacy.locationSet,
      coordinates: pharmacy.location.coordinates,
      address: pharmacy.address
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to get location status', 
      error: error.message 
    });
  }
});

module.exports = router;
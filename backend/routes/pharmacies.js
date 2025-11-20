const express = require('express');
const Pharmacy = require('../models/Pharmacy');
const auth = require('../middleware/auth');

const router = express.Router();

// Create pharmacy (pharmacist only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Only pharmacists can create pharmacies' });
    }

    const pharmacyData = {
      ...req.body,
      owner: req.user.id,
      location: {
        type: 'Point',
        coordinates: req.body.coordinates || [0, 0]
      }
    };

    const pharmacy = new Pharmacy(pharmacyData);
    await pharmacy.save();

    res.status(201).json(pharmacy);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Pharmacy with this email or license already exists' });
    }
    res.status(400).json({ message: 'Failed to create pharmacy', error: error.message });
  }
});

// Get all pharmacies with filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      service,
      is24Hours,
      latitude,
      longitude,
      maxDistance = 10000 // 10km default
    } = req.query;

    let query = { isActive: true, isVerified: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // City filter
    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    // Service filter
    if (service) {
      query.services = service;
    }

    // 24 hours filter
    if (is24Hours !== undefined) {
      query.is24Hours = is24Hours === 'true';
    }

    // Location-based search
    let locationQuery = {};
    if (latitude && longitude) {
      locationQuery = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        },
        locationSet: true 
      };
    }

    const pharmacies = await Pharmacy.find({ ...query, ...locationQuery, locationSet: true })
      .populate('owner', 'firstName lastName email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'rating.average': -1 });

    const total = await Pharmacy.countDocuments({ ...query, ...locationQuery });

    res.json({
      pharmacies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pharmacy by ID
router.get('/:id', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id)
      .select('+location') // Explicitly include location
      .populate('owner', 'firstName lastName email phone');

    if (!pharmacy || !pharmacy.isActive) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    // Log to verify
    console.log('📍 Pharmacy:', pharmacy.name);
    console.log('   Location object:', JSON.stringify(pharmacy.location));
    
    // Convert to plain object to ensure all nested fields are included
    const pharmacyObj = pharmacy.toObject();
    
    console.log('   Sending location:', JSON.stringify(pharmacyObj.location));

    res.json(pharmacyObj);
  } catch (error) {
    console.error('Get pharmacy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update pharmacy (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    if (pharmacy.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedUpdates = [
      'name', 'phone', 'contact', 'address', 'operatingHours', 'is24Hours',
      'services', 'description', 'images', 'location'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      const invalidFields = updates.filter(u => !allowedUpdates.includes(u));
      return res.status(400).json({ message: 'Invalid updates', invalidFields });
    }

    updates.forEach(update => pharmacy[update] = req.body[update]);
    await pharmacy.save();

    res.json(pharmacy);
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
});

// Delete pharmacy (owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    if (pharmacy.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    pharmacy.isActive = false;
    await pharmacy.save();

    res.json({ message: 'Pharmacy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
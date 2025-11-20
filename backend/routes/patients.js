// backend/routes/patients.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
// Order model removed while ordering feature is disabled
const Pharmacy = require('../models/Pharmacy');
const Drug = require('../models/Drug');
const Inventory = require('../models/Inventory');

// @route   GET /api/patients/profile
// @desc    Get patient profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    let patient = await Patient.findOne({ user: req.user.id })
      .populate('user', ['name', 'email', 'phone'])
      .populate('favoritePharmacies', 'businessName address phone');

    if (!patient) {
      // Create a default patient profile if it doesn't exist
      patient = new Patient({
        user: req.user.id,
        addresses: [],
        favoritePharmacies: []
      });
      
      await patient.save();
      await patient.populate('user', ['name', 'email', 'phone']);
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/patients/profile
// @desc    Update patient profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    let patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      patient = new Patient({
        user: req.user.id,
        addresses: [],
        favoritePharmacies: []
      });
    }

    await patient.save();
    await patient.populate('user', ['name', 'email', 'phone']);

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/patients/addresses
// @desc    Get patient addresses
// @access  Private
router.get('/addresses', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: patient.addresses || []
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/patients/addresses
// @desc    Add patient address
// @access  Private
router.post('/addresses', auth, async (req, res) => {
  try {
    const { label, address, city, coordinates, isDefault } = req.body;

    let patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      patient = new Patient({
        user: req.user.id,
        addresses: [],
        favoritePharmacies: []
      });
    }

    const newAddress = {
      label,
      address,
      city,
      coordinates,
      isDefault: isDefault || false
    };

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      patient.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    patient.addresses.push(newAddress);
    await patient.save();

    res.json({
      success: true,
      data: newAddress
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/patients/addresses/:addressId
// @desc    Update patient address
// @access  Private
router.put('/addresses/:addressId', auth, async (req, res) => {
  try {
    const { label, address, city, coordinates, isDefault } = req.body;

    const patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const addressIndex = patient.addresses.findIndex(
      addr => addr._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting as default, remove default from others
    if (isDefault) {
      patient.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    patient.addresses[addressIndex] = {
      ...patient.addresses[addressIndex].toObject(),
      label: label || patient.addresses[addressIndex].label,
      address: address || patient.addresses[addressIndex].address,
      city: city || patient.addresses[addressIndex].city,
      coordinates: coordinates || patient.addresses[addressIndex].coordinates,
      isDefault: isDefault !== undefined ? isDefault : patient.addresses[addressIndex].isDefault
    };

    await patient.save();

    res.json({
      success: true,
      data: patient.addresses[addressIndex]
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/patients/addresses/:addressId
// @desc    Delete patient address
// @access  Private
router.delete('/addresses/:addressId', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    patient.addresses = patient.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    await patient.save();

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/patients/addresses/:addressId/set-default
// @desc    Set address as default
// @access  Private
router.patch('/addresses/:addressId/set-default', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Remove default from all addresses
    patient.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set the specified address as default
    const addressIndex = patient.addresses.findIndex(
      addr => addr._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    patient.addresses[addressIndex].isDefault = true;
    await patient.save();

    res.json({
      success: true,
      data: patient.addresses[addressIndex]
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Order-related patient endpoints removed while ordering feature is disabled

// @route   GET /api/patients/favorites/pharmacies
// @desc    Get favorite pharmacies
// @access  Private
router.get('/favorites/pharmacies', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id })
      .populate('favoritePharmacies', 'businessName address phone rating');

    if (!patient) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: patient.favoritePharmacies || []
    });
  } catch (error) {
    console.error('Get favorite pharmacies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/patients/favorites/pharmacies/:pharmacyId/toggle
// @desc    Toggle favorite pharmacy
// @access  Private
router.post('/favorites/pharmacies/:pharmacyId/toggle', auth, async (req, res) => {
  try {
    let patient = await Patient.findOne({ user: req.user.id });
    
    if (!patient) {
      patient = new Patient({
        user: req.user.id,
        addresses: [],
        favoritePharmacies: []
      });
    }

    const pharmacyId = req.params.pharmacyId;
    const isFavorite = patient.favoritePharmacies.includes(pharmacyId);

    if (isFavorite) {
      // Remove from favorites
      patient.favoritePharmacies = patient.favoritePharmacies.filter(
        fav => fav.toString() !== pharmacyId
      );
    } else {
      // Add to favorites
      patient.favoritePharmacies.push(pharmacyId);
    }

    await patient.save();
    await patient.populate('favoritePharmacies', 'businessName address phone rating');

    res.json({
      success: true,
      data: patient.favoritePharmacies,
      isFavorite: !isFavorite
    });
  } catch (error) {
    console.error('Toggle favorite pharmacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/patients/search
// @desc    Search drugs with pharmacy availability
// @access  Private
router.post('/search', auth, async (req, res) => {
  try {
    const { searchTerm, category, filters = {}, userLocation } = req.body;

    // Build drug search query
    let drugQuery = { isActive: true };
    
    if (searchTerm) {
      drugQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { genericName: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      drugQuery.category = { $regex: category, $options: 'i' };
    }

    // Find matching drugs
    const drugs = await Drug.find(drugQuery);
    
    if (drugs.length === 0) {
      return res.json({ 
        success: true, 
        data: [], 
        message: 'No drugs found matching your search' 
      });
    }

    // Get all active pharmacies
    const pharmacies = await Pharmacy.find({ isActive: true, isVerified: true });

    // Get inventory for matching drugs in pharmacies
    const inventoryQuery = {
      drugId: { $in: drugs.map(d => d._id) },
      pharmacyId: { $in: pharmacies.map(p => p._id) }
    };

    if (filters.inStock !== undefined && filters.inStock) {
      inventoryQuery.quantity = { $gt: 0 };
    }

    if (filters.priceRange) {
      inventoryQuery.price = {
        $gte: filters.priceRange[0],
        $lte: filters.priceRange[1]
      };
    }

    const inventoryItems = await Inventory.find(inventoryQuery)
      .populate('drugId')
      .populate('pharmacyId');

    // Format results
    const results = inventoryItems.map(item => {
      // Calculate approximate distance (mock - replace with real calculation)
      let distance = 'N/A';
      if (userLocation && userLocation.latitude) {
        // Mock distance calculation
        distance = (Math.random() * 10 + 0.5).toFixed(1); // 0.5km to 10.5km
      }

      return {
        drug: {
          _id: item.drugId._id,
          name: item.drugId.name,
          description: item.drugId.description,
          category: item.drugId.category,
          manufacturer: item.drugId.manufacturer,
          prescriptionRequired: item.drugId.prescriptionRequired
        },
        pharmacy: {
          _id: item.pharmacyId._id,
          businessName: item.pharmacyId.businessName,
          address: item.pharmacyId.address,
          phone: item.pharmacyId.phone,
          email: item.pharmacyId.email,
          operatingHours: item.pharmacyId.operatingHours,
          rating: item.pharmacyId.rating || 4.0
        },
        price: item.price,
        distance: distance,
        inStock: item.quantity > 0,
        quantity: item.quantity
      };
    });

    // Sort by distance (closest first)
    results.sort((a, b) => {
      if (a.distance === 'N/A') return 1;
      if (b.distance === 'N/A') return -1;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });

    // Apply distance filter
    const filteredResults = filters.distance ? 
      results.filter(result => result.distance === 'N/A' || parseFloat(result.distance) <= filters.distance) :
      results;

    res.json({
      success: true,
      data: filteredResults,
      total: filteredResults.length
    });

  } catch (error) {
    console.error('Drug search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

module.exports = router;
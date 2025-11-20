const express = require('express');
const Inventory = require('../models/Inventory');
const Drug = require('../models/Drug');
const Pharmacy = require('../models/Pharmacy');
const auth = require('../middleware/auth');

const router = express.Router();

// Add inventory item (pharmacist only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Only pharmacists can manage inventory' });
    }
    // Ensure the inventory item is associated with the pharmacist's pharmacy
    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    if (!pharmacy) {
      return res.status(400).json({ message: 'Pharmacy profile not found for this user' });
    }

    // Merge provided body with the pharmacy id
    const inventoryData = {
      ...req.body,
      pharmacy: pharmacy._id
    };

    const inventory = new Inventory(inventoryData);
    await inventory.save();
    
    await inventory.populate('drug');
    res.status(201).json(inventory);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This drug already exists in your inventory' });
    }
    res.status(400).json({ message: 'Failed to add inventory', error: error.message });
  }
});

// Get pharmacy inventory
router.get('/pharmacy/:pharmacyId', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, inStock } = req.query;
    const { pharmacyId } = req.params;

    let query = { pharmacy: pharmacyId };

    // Stock filter
    if (inStock === 'true') {
      query.quantity = { $gt: 0 };
      query.isAvailable = true;
    } else if (inStock === 'false') {
      query.$or = [{ quantity: 0 }, { isAvailable: false }];
    }

    const inventory = await Inventory.find(query)
      .populate('drug')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'drug.name': 1 });

    // Apply additional filters after population
    let filteredInventory = inventory;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filteredInventory = inventory.filter(item => 
        item.drug.name.match(searchRegex) || 
        item.drug.genericName?.match(searchRegex)
      );
    }

    if (category) {
      filteredInventory = filteredInventory.filter(item => 
        item.drug.category === category
      );
    }

    res.json({
      inventory: filteredInventory,
      totalPages: Math.ceil(filteredInventory.length / limit),
      currentPage: page,
      total: filteredInventory.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update inventory item
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const inventory = await Inventory.findById(req.params.id).populate('pharmacy');
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Check if user owns the pharmacy
    if (inventory.pharmacy.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

  const allowedUpdates = ['quantity', 'price', 'priceUnit', 'discount', 'expiryDate', 'isAvailable', 'minStockLevel', 'maxStockLevel'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    updates.forEach(update => inventory[update] = req.body[update]);
    
    // Update last restocked if quantity increased
    if (updates.includes('quantity') && req.body.quantity > inventory.quantity) {
      inventory.lastRestocked = new Date();
    }

    await inventory.save();
    await inventory.populate('drug');

    res.json(inventory);
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
});

// Search drugs across all pharmacies
router.get('/search/drugs', async (req, res) => {
  try {
    const {
      drugName,
      latitude,
      longitude,
      maxDistance = 10000,
      inStock = true
    } = req.query;

    if (!drugName) {
      return res.status(400).json({ message: 'Drug name is required' });
    }

    // First, find matching drugs
    const drugs = await Drug.find({
      $or: [
        { name: { $regex: drugName, $options: 'i' } },
        { genericName: { $regex: drugName, $options: 'i' } }
      ],
      isActive: true
    });

    if (drugs.length === 0) {
      return res.json([]);
    }

    const drugIds = drugs.map(drug => drug._id);

    // Build inventory query
    let inventoryQuery = {
      drug: { $in: drugIds },
      quantity: { $gt: 0 },
      isAvailable: true
    };

    // Add location filter if coordinates provided
    let locationQuery = {};
    if (latitude && longitude) {
      locationQuery = {
        pharmacy: {
          $in: await getNearbyPharmacies(latitude, longitude, maxDistance)
        }
      };
    }

    const inventory = await Inventory.find({ ...inventoryQuery, ...locationQuery })
      .populate('drug')
      .populate({
        path: 'pharmacy',
        match: { isActive: true, isVerified: true },
        select: 'name address location phone operatingHours rating'
      })
      .sort({ 'price': 1 });

    // Filter out inventory items where pharmacy population failed (inactive/unverified)
    const validInventory = inventory.filter(item => item.pharmacy !== null);

    res.json(validInventory);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Helper function to get nearby pharmacies
async function getNearbyPharmacies(latitude, longitude, maxDistance) {
  const pharmacies = await Pharmacy.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(maxDistance)
      }
    },
    isActive: true,
    isVerified: true
  }).select('_id');

  return pharmacies.map(pharmacy => pharmacy._id);
}

module.exports = router;
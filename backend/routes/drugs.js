const express = require('express');
const Drug = require('../models/Drug');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');
const Pharmacy = require('../models/Pharmacy');

const router = express.Router();

// Get pharmacist's pharmacy
const getPharmacistPharmacy = async (authHeader) => {
  try {
    const response = await fetch('http://localhost:5000/api/pharmacy-onboarding/profile', {
      headers: { Authorization: authHeader }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch pharmacy');
    }
    return await response.json();
  } catch (error) {
    throw new Error('Could not fetch pharmacy information');
  }
};

// Create drug (pharmacist only - for their pharmacy)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Only pharmacists can create drugs' });
    }

    // Find pharmacist's pharmacy
    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const drugData = {
      ...req.body,
      pharmacy: pharmacy._id
    };

    const drug = new Drug(drugData);
    await drug.save();

    res.status(201).json(drug);
  } catch (error) {
    console.error('Drug creation error:', error);
    res.status(400).json({ 
      message: 'Failed to create drug', 
      error: error.message,
      details: error.errors 
    });
  }
});

// Get pharmacy's drugs with filters
router.get('/pharmacy-drugs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find pharmacist's pharmacy
    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const {
      page = 1,
      limit = 20,
      search,
      category,
      form,
      prescriptionRequired
    } = req.query;

    let query = { pharmacy: pharmacy._id, isActive: true };

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Form filter
    if (form) {
      query.form = form;
    }

    // Prescription filter
    if (prescriptionRequired !== undefined) {
      query.prescriptionRequired = prescriptionRequired === 'true';
    }

    const drugs = await Drug.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ category: 1, name: 1 });

    const total = await Drug.countDocuments(query);

    res.json({
      drugs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching pharmacy drugs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get drugs not yet in inventory
router.get('/not-in-inventory', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find pharmacist's pharmacy
    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    // Get all drugs for this pharmacy
    const allDrugs = await Drug.find({ pharmacy: pharmacy._id, isActive: true });
    
    // Get drugs already in inventory
    const inventoryDrugs = await Inventory.find({ pharmacy: pharmacy._id }).distinct('drug');
    
    // Filter out drugs that are already in inventory
    const drugsNotInInventory = allDrugs.filter(drug => 
      !inventoryDrugs.some(invDrug => invDrug.toString() === drug._id.toString())
    );

    res.json({
      drugs: drugsNotInInventory,
      total: drugsNotInInventory.length
    });
  } catch (error) {
    console.error('Error fetching drugs not in inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all drugs (for search - public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      form,
      prescriptionRequired
    } = req.query;

    let query = { isActive: true };

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Form filter
    if (form) {
      query.form = form;
    }

    // Prescription filter
    if (prescriptionRequired !== undefined) {
      query.prescriptionRequired = prescriptionRequired === 'true';
    }

    const drugs = await Drug.find(query)
      .populate('pharmacy', 'name address location phone operatingHours')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Drug.countDocuments(query);

    res.json({
      drugs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get drug by ID
router.get('/:id', async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id).populate('pharmacy');
    
    if (!drug || !drug.isActive) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    res.json(drug);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete drug (pharmacist only - permanent delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find pharmacist's pharmacy
    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const drug = await Drug.findOne({ 
      _id: req.params.id, 
      pharmacy: pharmacy._id 
    });
    
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    // First delete from inventory if it exists
    await Inventory.deleteMany({ 
      drug: drug._id, 
      pharmacy: pharmacy._id 
    });

    // Then delete the drug permanently
    await Drug.findByIdAndDelete(drug._id);

    res.json({ message: 'Drug deleted successfully' });
  } catch (error) {
    console.error('Error deleting drug:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update drug (pharmacist only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find pharmacist's pharmacy
    const pharmacy = await Pharmacy.findOne({ owner: req.user.id });
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const drug = await Drug.findOne({ 
      _id: req.params.id, 
      pharmacy: pharmacy._id 
    });

    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }

    // Update drug fields
    const allowedUpdates = ['name', 'genericName', 'brand', 'description', 'category', 'form', 'strength', 'prescriptionRequired', 'manufacturer', 'barcode', 'dosageInstructions'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    updates.forEach(update => drug[update] = req.body[update]);
    await drug.save();

    res.json(drug);
  } catch (error) {
    console.error('Error updating drug:', error);
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
});

module.exports = router;
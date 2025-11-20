const express = require('express');
const router = express.Router();
const Drug = require('../models/Drug');
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');

// Search drugs with location-based pharmacy results
router.post('/search', async (req, res) => {
  try {
    const { searchTerm, category, filters, userLocation } = req.body;
    
    // Build search query
    let drugQuery = {};
    
    if (searchTerm) {
      drugQuery.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { genericName: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (category) {
      drugQuery.category = category;
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

    // Get all pharmacies within distance
    let pharmacyQuery = { isActive: true, isVerified: true };
    
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      pharmacyQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLocation.longitude, userLocation.latitude]
          },
          $maxDistance: (filters?.distance || 10) * 1000 // Convert km to meters
        }
      };
    }

    const pharmacies = await Pharmacy.find(pharmacyQuery);

    // Get inventory for matching drugs in nearby pharmacies
    const inventoryItems = await Inventory.find({
      drug: { $in: drugs.map(d => d._id) },
      pharmacy: { $in: pharmacies.map(p => p._id) },
      ...(filters?.inStock && { isAvailable: true })
    })
    .populate('drug')
    .populate('pharmacy');

    // Format results
    const results = inventoryItems.map(item => {
  const pharmacy = item.pharmacy;
  const drug = item.drug;
      
      // Calculate distance (simplified - in production use proper haversine)
      let distance = 'N/A';
      if (userLocation && userLocation.latitude && userLocation.longitude && pharmacy.location) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          pharmacy.location.coordinates[1],
          pharmacy.location.coordinates[0]
        ).toFixed(1);
      }

      return {
        drug: {
          _id: drug._id,
          name: drug.name,
          description: drug.description,
          category: drug.category,
          manufacturer: drug.manufacturer,
          prescriptionRequired: drug.prescriptionRequired
        },
        pharmacy: {
          _id: pharmacy._id,
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.contact?.phone || null,
          email: pharmacy.contact?.email || null,
          operatingHours: pharmacy.operatingHours,
          rating: pharmacy.rating || null
        },
        price: item.price,
        distance: distance,
        inStock: item.isAvailable,
        // quantity field not present in schema; include null for compatibility
        quantity: item.quantity || null
      };
    });

    // Sort by distance (closest first)
    results.sort((a, b) => {
      if (a.distance === 'N/A') return 1;
      if (b.distance === 'N/A') return -1;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });

    res.json({
      success: true,
      data: results,
      total: results.length
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
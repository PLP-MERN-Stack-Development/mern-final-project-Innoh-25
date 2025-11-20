const express = require('express');
const axios = require('axios');
const router = express.Router();

// Geocode coordinates to address
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false,
        message: 'Latitude and longitude are required' 
      });
    }

    // Use your actual Google Maps API key here
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured'
      });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: apiKey
        }
      }
    );

    if (response.data.status === 'OK' && response.data.results[0]) {
      res.json({
        success: true,
        address: response.data.results[0].formatted_address
      });
    } else {
      res.json({
        success: false,
        address: null,
        message: 'Could not find address for these coordinates'
      });
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Geocoding service unavailable'
    });
  }
});

module.exports = router;
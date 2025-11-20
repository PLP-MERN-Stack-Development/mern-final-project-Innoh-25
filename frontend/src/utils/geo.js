/**
 * Extract latitude and longitude from pharmacy object
 * This version handles ANY coordinate format
 */
export const getLatLngFromPharmacy = (pharmacy) => {
  if (!pharmacy) {
    console.log('❌ No pharmacy provided');
    return null;
  }

  console.log('🔍 Checking pharmacy:', pharmacy.name);
  console.log('📍 Raw coordinates:', pharmacy.location?.coordinates);

  // Check location.coordinates array
  if (pharmacy.location?.coordinates?.length === 2) {
    const [first, second] = pharmacy.location.coordinates;
    
    console.log('  First value:', first);
    console.log('  Second value:', second);
    
    // Skip if both are 0
    if (first === 0 && second === 0) {
      console.log('❌ Coordinates are [0,0] - not set');
      return null;
    }

    // FOR NAIROBI: 
    // Latitude is around -1.3 (small number, can be negative)
    // Longitude is around 36.8 (larger number, always positive for East Africa)
    
    let lat, lng;
    
    // Simple logic: The LARGER absolute value is probably longitude
    if (Math.abs(first) > Math.abs(second)) {
      // first is bigger, so it's probably longitude
      lng = first;
      lat = second;
      console.log('  Detected: first is LNG, second is LAT');
    } else {
      // second is bigger, so it's probably longitude  
      lng = second;
      lat = first;
      console.log('  Detected: first is LAT, second is LNG');
    }
    
    console.log('✅ Returning:', { lat, lng });
    return { lat, lng };
  }

  // Try address.coordinates as backup
  if (pharmacy.address?.coordinates?.lat && pharmacy.address?.coordinates?.lng) {
    console.log('✅ Using address.coordinates');
    return {
      lat: pharmacy.address.coordinates.lat,
      lng: pharmacy.address.coordinates.lng
    };
  }

  console.log('❌ No valid coordinates found');
  return null;
};

/**
 * Check if pharmacy has valid coordinates set
 */
export const hasValidCoordinates = (pharmacy) => {
  if (!pharmacy) return false;
  
  // Check location.coordinates
  if (pharmacy.location?.coordinates?.length === 2) {
    const [first, second] = pharmacy.location.coordinates;
    // Valid if not [0, 0]
    return !(first === 0 && second === 0);
  }
  
  // Check address.coordinates
  if (pharmacy.address?.coordinates?.lat && pharmacy.address?.coordinates?.lng) {
    return true;
  }
  
  return false;
};

/**
 * Calculate distance between two coordinates in km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return (R * c).toFixed(1);
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat, lng) => {
  if (!lat || !lng) return 'Not set';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

/**
 * Get Google Maps URL for directions
 */
export const getDirectionsUrl = (pharmacy, userLocation = null) => {
  const coords = getLatLngFromPharmacy(pharmacy);
  
  if (!coords) return null;
  
  const { lat, lng } = coords;
  
  if (userLocation?.latitude && userLocation?.longitude) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${lat},${lng}`;
  } else {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
};
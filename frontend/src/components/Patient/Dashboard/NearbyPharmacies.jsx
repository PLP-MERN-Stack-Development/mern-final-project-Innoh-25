import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { calculateDistance } from '../../../utils/geo';

const NearbyPharmacies = ({ userLocation }) => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      fetchNearbyPharmacies();
    } else {
      setLoading(false);
    }
  }, [userLocation]);

  const fetchNearbyPharmacies = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pharmacies', {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          maxDistance: 10000, // 10km
          limit: 5
        }
      });

      // Calculate distances and add to pharmacy data
      const pharmaciesWithDistance = response.data.pharmacies.map(pharmacy => {
        let distance = 'N/A';
        
        // Calculate distance if coordinates available
        if (pharmacy.location?.coordinates?.length === 2) {
          const [lng, lat] = pharmacy.location.coordinates;
          if (lat !== 0 || lng !== 0) {
            distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              lat,
              lng
            );
          }
        }

        return { ...pharmacy, distance };
      });

      setPharmacies(pharmaciesWithDistance);
    } catch (error) {
      console.error('Error fetching nearby pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading nearby pharmacies...</div>;
  }

  if (!userLocation) {
    return <div className="feature-card">
      <p>📍 Enable location to see nearby pharmacies</p>
    </div>;
  }

  if (pharmacies.length === 0) {
    return <div className="feature-card">
      <p>No pharmacies found nearby. Try expanding your search area.</p>
    </div>;
  }

  return (
    <div>
      {pharmacies.map(pharmacy => (
        <div key={pharmacy._id} className="feature-card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>{pharmacy.name}</h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                📍 {pharmacy.distance !== 'N/A' ? `${pharmacy.distance} km away` : 'Distance unavailable'}
              </p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                {pharmacy.address?.city || 'Location not set'}
              </p>
            </div>
            <Link 
              to={`/patient/pharmacy/${pharmacy._id}`}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem' }}
            >
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NearbyPharmacies;
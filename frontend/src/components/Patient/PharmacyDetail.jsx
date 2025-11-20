import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/Shared/UI/LoadingSpinner';
import { getLatLngFromPharmacy } from '../../utils/geo';

const PharmacyDetail = () => {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchPharmacyDetails();
    getUserLocation();
  }, [id]);

  const fetchPharmacyDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/pharmacies/${id}`);
      setPharmacy(response.data);
    } catch (error) {
      console.error('Error fetching pharmacy details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied');
        }
      );
    }
  };

  const getDirections = () => {
     const coords = getLatLngFromPharmacy(pharmacy);
  
  if (coords && coords.lat !== 0 && coords.lng !== 0) {
    const { lat, lng } = coords;
    
    // Open Google Maps with directions
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${lat},${lng}`;
      window.open(url, '_blank');
      } else {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
      }
    } else if (pharmacy?.address?.address && pharmacy?.address?.city) {
      // Fallback to address string
      const addressString = `${pharmacy.address.address}, ${pharmacy.address.city}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressString)}`;
      window.open(url, '_blank');
    } else {
      alert('⚠️ This pharmacy has not set their location yet. Please contact them directly.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!pharmacy) {
    return <div>Pharmacy not found</div>;
  }

  return (
    <div className="pharmacy-detail-container">
      <div className="pharmacy-header">
        <h1>{pharmacy.name}</h1>
        <button 
          onClick={getDirections}
          className="btn btn-primary directions-btn"
        >
          🗺️ Get Directions
        </button>
      </div>

      <div className="pharmacy-info-grid">
        <div className="info-card">
          <h3>📍 Address</h3>
          <p>{pharmacy.address.address}</p>
          <p>{pharmacy.address.city}</p>
        </div>

        <div className="info-card">
          <h3>📞 Contact</h3>
          <p>Phone: {pharmacy.contact.phone}</p>
          <p>Email: {pharmacy.contact.email}</p>
        </div>

        <div className="info-card">
          <h3>🕒 Operating Hours</h3>
          <p>{pharmacy.operatingHours.open} - {pharmacy.operatingHours.close}</p>
          <p>Days: {pharmacy.operatingHours.days?.join(', ')}</p>
        </div>

        <div className="info-card">
          <h3>📍 Location Status</h3>
          <p>
            {pharmacy.locationSet ? 
              '✅ Location set - Patients can get directions' : 
              '❌ Location not set'
            }
          </p>
        </div>
      </div>

      {/* You can add more sections like available drugs, reviews, etc. */}
    </div>
  );
};

export default PharmacyDetail;
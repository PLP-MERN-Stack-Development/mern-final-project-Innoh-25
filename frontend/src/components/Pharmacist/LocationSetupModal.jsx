import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const LocationSetupModal = ({ isOpen, onClose, onLocationSet }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (isOpen) {
      getCurrentLocation();
    }
  }, [isOpen]);

  const getCurrentLocation = () => {
  setLoading(true);
  setError('');

  if (!navigator.geolocation) {
    setError('Geolocation is not supported by your browser');
    setLoading(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });
      
      // Set a default address that pharmacist can edit
      setAddress(`Pharmacy at coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      
      setLoading(false);
    },
    (error) => {
      console.error('Geolocation error:', error);
      setError('Unable to get your current location. Please ensure location services are enabled and you have granted permission.');
      setLoading(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};
  const handleSetLocation = async () => {
    if (!location) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/pharmacy-location/set-location', {
        latitude: location.latitude,
        longitude: location.longitude,
        address: address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Location set response:', response.data);

      if (response.data.success) {
        onLocationSet();
        onClose();
      } else {
        setError(response.data.message || 'Failed to set location');
      }
    } catch (err) {
      console.error('Location set error:', err);
      setError(err.response?.data?.message || 'Failed to set location. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    getCurrentLocation();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content location-setup-modal">
        <div className="modal-header">
          <h2>Set Your Pharmacy Location</h2>
          <p>This location will be used to help patients find your pharmacy</p>
        </div>

        <div className="modal-body">
          {loading && !location && (
            <div className="location-loading">
              <div className="loading-spinner"></div>
              <p>Getting your current location...</p>
              <p className="location-hint">
                Please ensure you're at your pharmacy location and location services are enabled
              </p>
            </div>
          )}

          {error && (
            <div className="location-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button 
                onClick={handleRetry}
                className="btn btn-secondary"
              >
                Try Again
              </button>
            </div>
          )}

          {location && !error && (
            <div className="location-success">
              <div className="success-icon">✅</div>
              <p><strong>Location found!</strong></p>
              <div className="location-details">
                <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
                <div className="address-section">
                  <label>Pharmacy Address (Optional):</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your pharmacy address manually"
                    className="address-input"
                  />
                  <p className="address-hint">You can manually enter your pharmacy address if needed</p>
                </div>
              </div>
              <p className="location-confirm">
                Is this your correct pharmacy location?
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSetLocation}
            disabled={!location || loading}
            className="btn btn-primary"
          >
            {loading ? 'Setting Location...' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSetupModal;
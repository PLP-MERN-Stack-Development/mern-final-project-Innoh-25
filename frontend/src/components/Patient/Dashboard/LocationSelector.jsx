import React, { useState, useEffect } from 'react';

const LocationSelector = ({ onLocationChange }) => {
  const [location, setLocation] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const parsedLocation = JSON.parse(savedLocation);
      setLocation(parsedLocation.address || '');
    }
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setUseCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=YOUR_GEOAPIFY_KEY`
          );
          const data = await response.json();
          
          const address = data.features[0]?.properties?.formatted || `${latitude}, ${longitude}`;
          
          const locationData = {
            latitude,
            longitude,
            address
          };
          
          setLocation(address);
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          onLocationChange(locationData);
          
        } catch (error) {
          console.error('Geocoding failed:', error);
          const locationData = {
            latitude,
            longitude,
            address: `${latitude}, ${longitude}`
          };
          setLocation(`${latitude}, ${longitude}`);
          localStorage.setItem('userLocation', JSON.stringify(locationData));
          onLocationChange(locationData);
        }
      },
      (error) => {
        console.error('Location access failed:', error);
        alert('Unable to retrieve your location');
        setUseCurrentLocation(false);
      }
    );
  };

  const handleManualLocation = (e) => {
    e.preventDefault();
    if (location.trim()) {
      const locationData = {
        address: location.trim(),
        manual: true
      };
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      onLocationChange(locationData);
    }
  };

  return (
    <div className="location-selector">
      <h4>📍 Set Your Location</h4>
      <div className="location-options">
        <button 
          onClick={getCurrentLocation}
          className="btn btn-secondary"
          disabled={useCurrentLocation}
        >
          {useCurrentLocation ? '📍 Using Current Location' : '📍 Use Current Location'}
        </button>
        
        <div className="manual-location">
          <p>Or enter your location manually:</p>
          <form onSubmit={handleManualLocation} className="location-form">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your area, street, or town"
              className="location-input"
            />
            <button type="submit" className="btn btn-primary">
              Set Location
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
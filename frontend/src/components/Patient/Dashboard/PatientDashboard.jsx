// src/components/Patient/Dashboard/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import QuickSearch from './QuickSearch';
// RecentOrders removed while ordering feature is disabled
import NearbyPharmacies from './NearbyPharmacies';
import LocationSelector from './LocationSelector';

const PatientDashboard = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const { user, patientProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Try to get saved location first
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setUserLocation(JSON.parse(savedLocation));
    } else {
      // Fallback to geolocation
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          // Save to localStorage for future use
          localStorage.setItem('userLocation', JSON.stringify(location));
          setLocationError('');
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
          setLocationError('Enable location for better pharmacy recommendations');
          // Set default Nairobi coordinates as fallback
          const defaultLocation = {
            latitude: -1.2921,
            longitude: 36.8219,
            address: 'Nairobi, Kenya'
          };
          setUserLocation(defaultLocation);
          localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
      // Set default location
      const defaultLocation = {
        latitude: -1.2921,
        longitude: 36.8219,
        address: 'Nairobi, Kenya'
      };
      setUserLocation(defaultLocation);
      localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
    }
  };

  const handleLocationChange = (newLocation) => {
    setUserLocation(newLocation);
    localStorage.setItem('userLocation', JSON.stringify(newLocation));
    setLocationError('');
  };

  const handleQuickAction = (category) => {
    navigate(`/patient/search?category=${category}`);
  };

  const handleViewAllPharmacies = () => {
    navigate('/patient/search?view=pharmacies');
  };

  return (
    <div className="patient-dashboard">
      {/* Welcome Message */}
      {user && (
        <div className="welcome-banner">
          <h2>Welcome back, {user.name || 'Patient'}! 👋</h2>
          <p>Ready to find your medications?</p>
        </div>
      )}

      {/* Location Selector */}
      <LocationSelector onLocationChange={handleLocationChange} />

      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Find Your Medications</h1>
        <p>Search for drugs, compare prices, and get them delivered to your doorstep</p>
      </div>

      {/* Quick Search */}
      <QuickSearch />

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Nearby Pharmacies Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📍 Nearby Pharmacies</h2>
            <button 
              onClick={handleViewAllPharmacies}
              className="view-all-link"
            >
              View All
            </button>
          </div>
          <NearbyPharmacies userLocation={userLocation} />
        </div>

        {/* Recent Orders Section */}
        <div className="dashboard-section">
          <div className="section-header">
              <h2>📦 Recent Orders</h2>
              <span className="view-all-link">Disabled</span>
            </div>
            <div className="recent-orders empty">
              <p>Order features are currently disabled.</p>
            </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>🚀 Quick Actions</h2>
        <div className="quick-actions-grid">
          <div 
            className="action-card"
            onClick={() => handleQuickAction('pain-relief')}
          >
            <div className="action-icon">💊</div>
            <div className="action-content">
              <h3>Pain Relief</h3>
              <p>Paracetamol, Ibuprofen, Aspirin</p>
            </div>
          </div>

          <div 
            className="action-card"
            onClick={() => handleQuickAction('antibiotics')}
          >
            <div className="action-icon">🦠</div>
            <div className="action-content">
              <h3>Antibiotics</h3>
              <p>Amoxicillin, Azithromycin</p>
            </div>
          </div>

          <div 
            className="action-card"
            onClick={() => handleQuickAction('vitamins')}
          >
            <div className="action-icon">🌿</div>
            <div className="action-content">
              <h3>Vitamins</h3>
              <p>Vitamin C, Multivitamins</p>
            </div>
          </div>

          <div 
            className="action-card"
            onClick={() => navigate('/patient/search')}
          >
            <div className="action-icon">🔍</div>
            <div className="action-content">
              <h3>All Medications</h3>
              <p>Browse complete catalog</p>
            </div>
          </div>

          <div 
            className="action-card"
            onClick={() => navigate('/patient/profile')}
          >
            <div className="action-icon">👤</div>
            <div className="action-content">
              <h3>My Profile</h3>
              <p>Manage addresses & preferences</p>
            </div>
          </div>

          {/* Order History action removed while ordering is disabled */}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {patientProfile?.favoritePharmacies?.length || 0}
          </div>
          <div className="stat-label">Favorite Pharmacies</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {patientProfile?.addresses?.length || 0}
          </div>
          <div className="stat-label">Saved Addresses</div>
        </div>
      </div>

      {/* Location Error Warning */}
      {locationError && (
        <div className="location-warning">
          <p>⚠️ {locationError}</p>
          <button onClick={getCurrentLocation} className="btn btn-secondary btn-sm">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
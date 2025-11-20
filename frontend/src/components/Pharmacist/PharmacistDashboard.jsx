import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddDrugModal from './AddDrugModal';
import LocationSetupModal from './LocationSetupModal';
import '../../styles/Pharmacist.css';

const PharmacistDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalRevenue: 0
  });
  // Orders feature temporarily disabled: recentOrders removed
  const [loading, setLoading] = useState(true);
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSet, setLocationSet] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // fetchDashboardData optionally skips reopening the location modal when called
  // immediately after the user has set the location (to avoid a race with the backend)
  const fetchDashboardData = async (skipModalOpen = false) => {
    try {
      setLoading(true);
      
      const pharmacyResponse = await axios.get('http://localhost:5000/api/pharmacy-onboarding/profile');
      setPharmacy(pharmacyResponse.data);

      // CHECK LOCATION STATUS
      try {
        const locationResponse = await axios.get('http://localhost:5000/api/pharmacy-location/location-status');
        console.log('Location status response:', locationResponse.data); //debug log
        setLocationSet(locationResponse.data.locationSet);

        // Show location modal if pharmacy is approved but location not set
        // Skip this behavior when caller asked to (e.g., after user confirmed location)
        if (!skipModalOpen && pharmacyResponse.data.status === 'approved' && !locationResponse.data.locationSet) {
          setShowLocationModal(true);
        }
      } catch (locationError) {
        console.log('Location status check failed, endpoint might not exist yet');

        // If endpoint doesn't exist, avoid using possibly-stale `locationSet` state value.
        // Do not forcibly reopen the modal here; instead assume the app will open it when
        // appropriate on a subsequent check or via explicit user action.
        // This prevents a race where `handleLocationSet` sets the state and immediately
        // calls fetchDashboardData which would read the old state and reopen the modal.
      }

  // Orders endpoint removed; skipping orders fetch

      const inventoryResponse = await axios.get(`http://localhost:5000/api/inventory/pharmacy/${pharmacyResponse.data._id}?inStock=true`);
      const lowStockItems = inventoryResponse.data.inventory.filter(item => item.quantity <= item.minStockLevel).length;

      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        lowStockItems,
        totalRevenue: 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSet = () => {
    // Mark location set locally and close modal immediately to avoid reopening during fetch
    setLocationSet(true);
    setShowLocationModal(false);
    // Refresh dashboard data but skip the modal re-open check to avoid a race condition
    fetchDashboardData(true);
  };

  const handleLogout = () => {
    logout();
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'manage-drugs':
        navigate('/pharmacist/manage-drugs');
        break;
      case 'view-inventory':
        navigate('/pharmacist/inventory-drugs');
        break;
      case 'add-drug':
        setShowAddDrugModal(true);
        break;
      case 'manage-inventory':
        navigate('/pharmacist/inventory');
        break;
      // 'view-orders' action removed while ordering is disabled
      case 'reports':
        navigate('/pharmacist/reports');
        break;
      default:
        break;
    }
  };

  const handleDrugAdded = () => {
    // Refresh dashboard data when new drug is added
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Location Setup Modal */}
      <LocationSetupModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSet={handleLocationSet}
      />
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="dashboard-title">
            PharmaPin Dashboard
          </div>
          <div className="user-menu">
            <span className="user-greeting">Welcome, {user?.firstName}</span>
            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-main">
        {/* Pharmacy Info Banner */}
        {pharmacy && (
          <div className="pharmacy-banner">
            <div className="banner-content">
              <div className="pharmacy-info">
                <h2>{pharmacy.name}</h2>
                <p className="pharmacy-address">{pharmacy.fullAddress}</p>
                <div className="pharmacy-meta">
                  <span>📞 {pharmacy.phone}</span>
                  <span>🕒 {pharmacy.operatingHours.opening} - {pharmacy.operatingHours.closing}</span>
                  <span className="status-badge">✅ Approved</span>
                </div>
              </div>
              <button 
                className="edit-profile-btn"
                onClick={() => navigate('/pharmacist/profile')} 
              
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon blue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="stat-text">
                <p className="stat-label">Total Orders</p>
                <p className="stat-value">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon yellow">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-text">
                <p className="stat-label">Pending Orders</p>
                <p className="stat-value">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon red">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="stat-text">
                <p className="stat-label">Low Stock Items</p>
                <p className="stat-value">{stats.lowStockItems}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon green">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 6v0m0 0v0" />
                </svg>
              </div>
              <div className="stat-text">
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">KSh {stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div> 
        </div>

        <div className="dashboard-content">

          {/* Quick Actions */}
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="section-content">
              <div className="quick-actions-grid">

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('manage-drugs')}
                >
                  <div className="action-icon action-circle">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="action-label">Manage Drugs</p>
                </button>

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('add-drug')}
                >
                  <div className="action-icon action-circle">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="action-label">Add Drug to Inventory</p>
                </button>

                <button 
                  className="action-card"
                  onClick={() => handleQuickAction('manage-inventory')}
                >
                  <div className="action-icon action-circle">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="action-label">Manage Inventory</p>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      <AddDrugModal
        isOpen={showAddDrugModal}
        onClose={() => setShowAddDrugModal(false)}
        onDrugAdded={handleDrugAdded}
      />
          {/* Floating Add Drug button for quick access */}
          <button
            className="fab"
            title="Add drug"
            onClick={() => setShowAddDrugModal(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
    </div>


  
  );
};

export default PharmacistDashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const RejectedPharmacy = () => {
  const navigate = useNavigate();
  const [pharmacyData, setPharmacyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPharmacyStatus();
  }, []);

  const fetchPharmacyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pharmacy-onboarding/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Pharmacy status response:', response.data); // Debug log
      
      if (response.data.hasPharmacy && response.data.status === 'rejected') {
        setPharmacyData(response.data);
      } else {
        // If not rejected, redirect to appropriate page
        if (response.data.status === 'approved') {
          navigate('/pharmacist/dashboard');
        } else if (response.data.status === 'pending_approval') {
          navigate('/pharmacist/pending-approval');
        } else {
          navigate('/pharmacist/onboarding');
        }
      }
    } catch (error) {
      console.error('Error fetching pharmacy status:', error);
      alert('Error loading pharmacy information');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    // Navigate to onboarding with existing data pre-filled
    try {
      console.log('Navigating to onboarding from RejectedPharmacy');
      navigate('/pharmacist/onboarding');

      // Fallback: if router navigation doesn't take effect (rare), force a full-page redirect
      setTimeout(() => {
        if (window.location.pathname !== '/pharmacist/onboarding') {
          console.warn('Router navigation did not change location, forcing redirect');
          window.location.href = '/pharmacist/onboarding';
        }
      }, 200);
    } catch (err) {
      console.error('Navigation error, forcing redirect', err);
      window.location.href = '/pharmacist/onboarding';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="pending-approval-container">
        <div className="pending-approval-card">
          <div className="loading-spinner"></div>
          <p>Loading your pharmacy information...</p>
        </div>
      </div>
    );
  }

  if (!pharmacyData) {
    return (
      <div className="pending-approval-container">
        <div className="pending-approval-card">
          <p>No pharmacy data found. Please contact support.</p>
          <button onClick={() => navigate('/pharmacist/onboarding')} className="btn btn-primary">
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-approval-container">
      <div className="pending-approval-card rejected">
        <div className="pending-icon rejected">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1>Application Rejected</h1>
        
        <div className="rejection-details">
          <div className="rejection-reason">
            <h3>Reason for Rejection:</h3>
            <p className="rejection-text">
              {pharmacyData.rejectionReason || 'No specific reason provided.'}
            </p>
          </div>
          
          <div className="pharmacy-info-summary">
            <h4>Your Submitted Information:</h4>
            <div className="info-grid">
              <div className="info-item">
                <strong>Pharmacy Name:</strong>
                <span>{pharmacyData.pharmacy?.name || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <strong>License Number:</strong>
                <span>{pharmacyData.pharmacy?.licenseNumber || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <strong>Location:</strong>
                <span>
                  {pharmacyData.pharmacy?.address?.address && pharmacyData.pharmacy?.address?.city 
                    ? `${pharmacyData.pharmacy.address.address}, ${pharmacyData.pharmacy.address.city}`
                    : 'Not provided'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="rejection-instruction">
          Please review the rejection reason above and update your application with the required changes.
          Your previous information has been saved and will be pre-filled when you click "Update Application".
        </p>
        
        <div className="pending-actions">
          <button
            onClick={handleTryAgain}
            className="btn btn-primary"
          >
            Update Application
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Back to Home
          </button>
          
          <button
            onClick={handleLogout}
            className="btn btn-outline"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectedPharmacy;
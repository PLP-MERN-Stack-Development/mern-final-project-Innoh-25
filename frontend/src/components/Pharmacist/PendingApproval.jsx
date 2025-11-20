import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const PendingApproval = () => {
  const navigate = useNavigate();
  const [pharmacyStatus, setPharmacyStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPharmacyStatus();
  }, []);

  const checkPharmacyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pharmacy-onboarding/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Status check:', response.data); // Debug log
      
      // Redirect if status is not pending_approval
      if (response.data.hasPharmacy) {
        if (response.data.status === 'approved') {
          navigate('/pharmacist/dashboard');
          return;
        } else if (response.data.status === 'rejected') {
          navigate('/pharmacist/rejected');
          return;
        }
      }
      
      setPharmacyStatus(response.data);
    } catch (error) {
      console.error('Error checking pharmacy status:', error);
    } finally {
      setLoading(false);
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
          <p>Checking status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-approval-container">
      <div className="pending-approval-card">
        <div className="pending-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1>Approval Pending</h1>
        
        <p>
          Your pharmacy profile has been submitted and is currently under review by our admin team. 
          You'll be notified once your account is approved.
        </p>
        
        <div className="pending-actions">
          <button
            onClick={handleLogout}
            className="btn btn-primary"
          >
            Logout
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
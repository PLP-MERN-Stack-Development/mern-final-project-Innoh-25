import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [pendingPharmacies, setPendingPharmacies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allPharmacies, setAllPharmacies] = useState([]);
  const [comprehensiveStats, setComprehensiveStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userManagementTab, setUserManagementTab] = useState('users');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  
  // ADDED: State for rejection modal
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    pharmacy: null
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Re-fetch admin data whenever the active tab changes so
    // users/pharmacies lists are loaded when their tab is selected.
    fetchAdminData();
  }, [activeTab]);

  // Ensure any open pharmacy detail modal is closed when switching tabs
  useEffect(() => {
    if (showPharmacyModal) {
      setShowPharmacyModal(false);
      setSelectedPharmacy(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token'); // Changed from adminToken to token
      console.log('🔑 Token present:', !!token);
      
      // Add debug logging
      console.log('Fetching admin data with token:', token ? 'present' : 'missing');
      
      const requests = [
        axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/admin/pharmacies/pending', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ];

      // Fetch additional data based on active tab
      if (activeTab === 'users') {
        console.log('📥 Fetching users...');
        requests.push(
          axios.get('http://localhost:5000/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      } else if (activeTab === 'pharmacies') {
        console.log('📥 Fetching pharmacies...');
        requests.push(
          axios.get('http://localhost:5000/api/admin/all-pharmacies', {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      } else if (activeTab === 'dashboard') {
        console.log('📥 Fetching comprehensive stats...');
        requests.push(
          axios.get('http://localhost:5000/api/admin/comprehensive-stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      }

      console.log('🚀 Making API requests...');
      const [statsRes, pendingRes, ...additionalRes] = await Promise.all(requests);

       // DEBUG: Log all responses
      console.log('📊 Stats Response:', statsRes.data);
      console.log('⏳ Pending Pharmacies Response:', pendingRes.data);
      
      if (additionalRes[0]) {
        console.log('📦 Additional Response:', additionalRes[0].data);
        console.log('🔍 Additional Response data structure:', {
          fullResponse: additionalRes[0].data,
          success: additionalRes[0].data.success,
          data: additionalRes[0].data.data,
          dataType: typeof additionalRes[0].data.data,
          isArray: Array.isArray(additionalRes[0].data.data),
          length: Array.isArray(additionalRes[0].data.data) ? additionalRes[0].data.data.length : 'N/A'
        });
      }


      setStats(statsRes.data.data || {});
      setPendingPharmacies(pendingRes.data.data || []);

        // Handle additional responses
      if (activeTab === 'users' && additionalRes[0]) {
        setAllUsers(additionalRes[0].data.data.users || []);
      } else if (activeTab === 'pharmacies' && additionalRes[0]) {
        setAllPharmacies(additionalRes[0].data.data.pharmacies || []);
      } else if (activeTab === 'dashboard' && additionalRes[0]) {
        setComprehensiveStats(additionalRes[0].data.data || {});
      }

      console.log('✅ Data fetch completed');
      console.log('📈 Current state - allUsers:', allUsers.length, 'allPharmacies:', allPharmacies.length);

    } catch (error) {
      console.error('Admin data fetch error:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchAdminData();
      alert('User updated successfully!');
    } catch (error) {
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchAdminData();
      alert('User deleted successfully!');
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const handleApprovePharmacy = async (pharmacyId) => {
    try {
      const token = localStorage.getItem('token'); // Changed from adminToken
      await axios.put(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchAdminData();
      alert('Pharmacy approved successfully!');
    } catch (error) {
      alert('Error approving pharmacy');
    }
  };

  // ADDED: New function to open rejection modal
  const handleOpenRejectModal = (pharmacy) => {
    setRejectionModal({
      isOpen: true,
      pharmacy: pharmacy
    });
  };

  // ADDED: New function to confirm rejection with modal
  const handleConfirmRejection = async (rejectionReason) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/pharmacies/${rejectionModal.pharmacy._id}/reject`, 
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRejectionModal({ isOpen: false, pharmacy: null });
      fetchAdminData();
      alert('Pharmacy rejected successfully!');
    } catch (error) {
      alert('Error rejecting pharmacy');
    }
  };

  // KEEP: Original reject function (for backward compatibility if needed)
  const handleRejectPharmacy = async (pharmacyId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        const token = localStorage.getItem('token'); // Changed from adminToken
        await axios.put(`http://localhost:5000/api/admin/pharmacies/${pharmacyId}/reject`, 
          { rejectionReason: reason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        fetchAdminData();
        alert('Pharmacy rejected');
      } catch (error) {
        alert('Error rejecting pharmacy');
      }
    }
  };

  const handleViewPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowPharmacyModal(true);
  };

  // ADDED: RejectionModal component
  const RejectionModal = ({ isOpen, onClose, onConfirm, pharmacy }) => {
    const [rejectionReason, setRejectionReason] = useState('');

    const handleSubmit = () => {
      if (!rejectionReason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }
      onConfirm(rejectionReason);
      setRejectionReason('');
    };

    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Reject Pharmacy Application</h3>
            <button onClick={onClose} className="close-btn">&times;</button>
          </div>
          
          <div className="modal-body">
            <p>Please provide a reason for rejecting<strong>{pharmacy?.name}</strong>'s application:</p>
            
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what needs to be corrected or improved..."
                rows="4"
                required
                className="form-textarea"
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-danger">
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/secure-admin-access');
  };

  // Get currently logged-in user from localStorage (rename to avoid shadowing)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header - UNCHANGED */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>🏥 PharmaPin Admin</h1>
          <div className="admin-user-menu">
            <span>Welcome, {currentUser.firstName || 'Admin'}</span>
            <button onClick={handleLogout} className="admin-logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation - ENHANCED WITH NEW TABS */}
      <nav className="admin-nav">
        <button 
          className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          ⏳ Pending Approvals ({pendingPharmacies.length})
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === 'pharmacies' ? 'active' : ''}`}
          onClick={() => setActiveTab('pharmacies')}
        >
          🏪 All Pharmacies
        </button>
      </nav>

      {/* Main Content - ENHANCED WITH NEW SECTIONS */}
      <div className="admin-main">
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard-content">
            <h2>Comprehensive System Overview</h2>
            
            {/* Enhanced Statistics Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>Total Users</h3>
                <p className="admin-stat-number">{comprehensiveStats.users?.total || stats.totalUsers || 0}</p>
                <div className="stat-breakdown">
                  <span>Patients: {comprehensiveStats.users?.patients || stats.totalPatients || 0}</span>
                  <span>Pharmacists: {comprehensiveStats.users?.pharmacists || stats.totalPharmacists || 0}</span>
                  <span>Admins: {comprehensiveStats.users?.admins || 0}</span>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <h3>Total Pharmacies</h3>
                <p className="admin-stat-number">{comprehensiveStats.pharmacies?.total || stats.totalPharmacies || 0}</p>
                <div className="stat-breakdown">
                  <span>Approved: {comprehensiveStats.pharmacies?.approved || stats.approvedPharmacies || 0}</span>
                  <span>Pending: {comprehensiveStats.pharmacies?.pending || stats.pendingPharmacies || 0}</span>
                  <span>Rejected: {comprehensiveStats.pharmacies?.rejected || 0}</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <h3>Recent Activity</h3>
                <p className="admin-stat-number">{comprehensiveStats.recentActivity?.users?.length || 0} New Users</p>
                <p className="admin-stat-number">{comprehensiveStats.recentActivity?.pharmacies?.length || 0} New Pharmacies</p>
              </div>
            </div>

            {/* Recent Users Table */}
            {comprehensiveStats.recentActivity?.users && comprehensiveStats.recentActivity.users.length > 0 && (
              <div className="recent-activity-section">
                <h3>Recent User Registrations</h3>
                <div className="activity-table">
                  {comprehensiveStats.recentActivity.users.map((user, index) => (
                    <div key={user._id} className="activity-item">
                      <span>{user.firstName} {user.lastName}</span>
                      <span className={`role-badge role-${user.role}`}>{user.role}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          // YOUR EXISTING APPROVALS CONTENT - MODIFIED REJECT BUTTON
          <div className="admin-approvals-content">
            <h2>Pending Pharmacy Approvals</h2>
            {pendingPharmacies.length === 0 ? (
              <div className="admin-empty-state">
                <p>No pending pharmacy approvals</p>
              </div>
            ) : (
              <div className="admin-pharmacy-list">
                {pendingPharmacies.map(pharmacy => (
                  <div key={pharmacy._id} className="admin-pharmacy-card">
                    <div className="pharmacy-info">
                      <h3>{pharmacy.name}</h3>
                      <p><strong>License:</strong> {pharmacy.licenseNumber}</p>
                      <p><strong>Owner:</strong> {pharmacy.owner?.firstName} {pharmacy.owner?.lastName}</p>
                      <p><strong>Email:</strong> {pharmacy.owner?.email}</p>
                      <p><strong>Phone:</strong> {pharmacy.owner?.phone}</p>
                      <p><strong>Location:</strong> {pharmacy.address?.address}, {pharmacy.address?.city}</p>
                      {pharmacy.description && (
                        <p><strong>Description:</strong> {pharmacy.description}</p>
                      )}

                      {pharmacy.certificates && pharmacy.certificates.length > 0 && (
                        <div className="pharmacy-certificates">
                          <h4>Uploaded Certificates:</h4>
                          <div className="certificates-list">
                            {pharmacy.certificates.map((cert, index) => (
                              <div key={index} className="certificate-item">
                                <a 
                                  href={`http://localhost:5000${cert.fileUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="certificate-link"
                                >
                                  📄 {cert.name}
                                </a>
                                <span className="upload-date">
                                  Uploaded: {new Date(cert.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="pharmacy-actions">
                      <button 
                        onClick={() => handleApprovePharmacy(pharmacy._id)}
                        className="admin-approve-btn"
                      >
                        ✅ Approve
                      </button>
                      {/* MODIFIED: Changed to use modal instead of prompt */}
                      <button 
                        onClick={() => handleOpenRejectModal(pharmacy)}
                        className="admin-reject-btn"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEW: User Management Section */}
        {activeTab === 'users' && (
          <div className="admin-users-content">
            <h2>User Management</h2>
            
            <div className="management-tabs">
              <button 
                className={`management-tab ${userManagementTab === 'users' ? 'active' : ''}`}
                onClick={() => setUserManagementTab('users')}
              >
                All Users ({allUsers.length})
              </button>
            </div>

            {userManagementTab === 'users' && (
              <div className="users-table-container">
                {allUsers.length === 0 ? (
                  <div className="admin-empty-state">
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="users-table">
                    <div className="table-header">
                      <span>User</span>
                      <span>Contact</span>
                      <span>Role</span>
                      <span>Joined</span>
                      <span>Actions</span>
                    </div>
                    {allUsers.map(user => (
                      <div key={user._id} className="table-row">
                        <div className="user-info">
                          <strong>{user.firstName} {user.lastName}</strong>
                          <small>@{user.username}</small>
                        </div>
                        <div className="contact-info">
                          <div>{user.email}</div>
                          <div>{user.phone}</div>
                        </div>
                        <div className="role-info">
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="date-info">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleUpdateUser(user._id, { 
                              isVerified: !user.isVerified 
                            })}
                            className={`btn-sm ${user.isVerified ? 'btn-warning' : 'btn-success'}`}
                          >
                            {user.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="btn-sm btn-danger"
                            // Prevent self-deletion: compare the listed user's id to the
                            // currently logged in admin's id (supports both _id or id)
                            disabled={
                              user._id === currentUser._id || user._id === currentUser.id
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* NEW: All Pharmacies Section */}
        {activeTab === 'pharmacies' && (
          <div className="admin-pharmacies-content">
            <h2>All Pharmacies</h2>
            
            {allPharmacies.length === 0 ? (
              <div className="admin-empty-state">
                <p>No pharmacies found</p>
              </div>
            ) : (
              <div className="pharmacies-table">
                <div className="table-header">
                  <span>Pharmacy</span>
                  <span>Owner</span>
                  <span>License</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>
                {allPharmacies.map(pharmacy => (
                  <div key={pharmacy._id} className="table-row">
                    <div className="pharmacy-info">
                      <strong>{pharmacy.name}</strong>
                      <small>{pharmacy.contact?.email}</small>
                      <small>{pharmacy.contact?.phone}</small>
                    </div>
                    <div className="owner-info">
                      {pharmacy.owner?.firstName} {pharmacy.owner?.lastName}
                    </div>
                    <div className="license-info">
                      {pharmacy.licenseNumber}
                    </div>
                    <div className="status-info">
                      <span className={`status-badge status-${pharmacy.status}`}>
                        {pharmacy.status}
                      </span>
                    </div>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewPharmacy(pharmacy)}
                        className="btn-sm btn-info"
                      >
                        View Details
                      </button>

                      {pharmacy.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprovePharmacy(pharmacy._id)}
                            className="btn-sm btn-success"
                          >
                            Approve
                          </button>
                          {/* MODIFIED: Changed to use modal instead of prompt */}
                          <button
                            onClick={() => handleOpenRejectModal(pharmacy)}
                            className="btn-sm btn-danger"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          {/* Pharmacy Details Modal */}
          {showPharmacyModal && selectedPharmacy && (
            <div className="modal-overlay" onClick={() => { setShowPharmacyModal(false); setSelectedPharmacy(null); }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => { setShowPharmacyModal(false); setSelectedPharmacy(null); }}>✕</button>
                <h3>{selectedPharmacy.name}</h3>
                <p><strong>Status:</strong> {selectedPharmacy.status}</p>
                <p><strong>License:</strong> {selectedPharmacy.licenseNumber}</p>
                <p><strong>Owner:</strong> {selectedPharmacy.owner?.firstName} {selectedPharmacy.owner?.lastName}</p>
                <p><strong>Owner Email:</strong> {selectedPharmacy.owner?.email || selectedPharmacy.contact?.email}</p>
                <p><strong>Owner Phone:</strong> {selectedPharmacy.owner?.phone || selectedPharmacy.contact?.phone}</p>
                <p><strong>Address:</strong> {selectedPharmacy.address?.address}, {selectedPharmacy.address?.city}</p>
                {selectedPharmacy.description && (
                  <p><strong>Description:</strong> {selectedPharmacy.description}</p>
                )}

                {selectedPharmacy.certificates && selectedPharmacy.certificates.length > 0 && (
                  <div className="pharmacy-certificates">
                    <h4>Uploaded Certificates:</h4>
                    <div className="certificates-list">
                      {selectedPharmacy.certificates.map((cert, index) => (
                        <div key={index} className="certificate-item">
                          <a
                            href={`http://localhost:5000${cert.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="certificate-link"
                          >
                            📄 {cert.name}
                          </a>
                          <span className="upload-date">Uploaded: {new Date(cert.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADDED: Rejection Modal */}
          <RejectionModal
            isOpen={rejectionModal.isOpen}
            onClose={() => setRejectionModal({ isOpen: false, pharmacy: null })}
            onConfirm={handleConfirmRejection}
            pharmacy={rejectionModal.pharmacy}
          />
        </div>
      </div>
    
  );
};

export default AdminDashboard;
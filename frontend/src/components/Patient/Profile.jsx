import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Patient.css';

const PatientProfile = () => {
  const { user, patientProfile, patientAddresses, updatePatientProfile, updateUser, addPatientAddress, updatePatientAddress, deletePatientAddress, setDefaultAddress } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [newAddress, setNewAddress] = useState({
    label: 'home',
    address: '',
    city: '',
    isDefault: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handlePersonalInfoUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUser(formData);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await addPatientAddress(newAddress);
      setNewAddress({
        label: 'home',
        address: '',
        city: '',
        isDefault: false
      });
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  return (
    <div className="patient-profile">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="user-avatar">
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={activeTab === 'personal' ? 'active' : ''}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button 
          className={activeTab === 'addresses' ? 'active' : ''}
          onClick={() => setActiveTab('addresses')}
        >
          Addresses ({patientAddresses?.length || 0})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && (
          <div className="personal-info">
            <div className="section-header">
              <h2>Personal Information</h2>
              <button 
                className="btn btn-outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handlePersonalInfoUpdate} className="edit-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="info-display">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{user?.firstName} {user?.lastName}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{user?.email}</p>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <p>{user?.phone}</p>
                </div>
                <div className="info-item">
                  <label>Member Since</label>
                  <p>{new Date(user?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="addresses-section">
            <h2>Saved Addresses</h2>
            
            <form onSubmit={handleAddAddress} className="add-address-form">
              <h3>Add New Address</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Label</label>
                  <select
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                    placeholder="Street address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                    />
                    Set as default address
                  </label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Address
              </button>
            </form>

            <div className="addresses-list">
              {patientAddresses?.map((address) => (
                <div key={address._id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
                  <div className="address-header">
                    <span className="address-label">{address.label}</span>
                    {address.isDefault && <span className="default-badge">Default</span>}
                  </div>
                  <p className="address-text">{address.address}</p>
                  <p className="address-city">{address.city}</p>
                  <div className="address-actions">
                    {!address.isDefault && (
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => setDefaultAddress(address._id)}
                      >
                        Set Default
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => deletePatientAddress(address._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              
              {(!patientAddresses || patientAddresses.length === 0) && (
                <div className="empty-state">
                  <p>No addresses saved yet</p>
                  <p>Add your first address to make ordering easier</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../Shared/UI/LoadingSpinner';
import '../../styles/Pharmacist.css';

const Profile = () => {
  const { user } = useAuth();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact: {
      phone: '',
      email: ''
    },
    address: {
      address: '',
      city: '',
      coordinates: {
        lat: '',
        lng: ''
      }
    },
    operatingHours: {
      open: '',
      close: '',
      days: []
    }
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/pharmacy-onboarding/profile');
      const pharmacyData = response.data;
      
      setPharmacy(pharmacyData);
      setFormData({
        name: pharmacyData.name || '',
        contact: {
          phone: pharmacyData.contact?.phone || user?.phone || '',
          email: pharmacyData.contact?.email || user?.email || ''
        },
        address: {
          address: pharmacyData.address?.address || '',
          city: pharmacyData.address?.city || '',
          coordinates: {
            lat: pharmacyData.address?.coordinates?.lat || '',
            lng: pharmacyData.address?.coordinates?.lng || ''
          }
        },
        operatingHours: {
          open: pharmacyData.operatingHours?.open || '08:00',
          close: pharmacyData.operatingHours?.close || '17:00',
          days: pharmacyData.operatingHours?.days || []
        }
      });
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
      setMessage('Failed to load pharmacy data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setMessage('');

    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Set coordinates directly without reverse geocoding
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            coordinates: {
              lat: latitude,
              lng: longitude
            }
          }
        }));
        
        setMessage('Location detected successfully! Coordinates have been set.');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Failed to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        setMessage(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      
      if (subChild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        days: prev.operatingHours.days.includes(day)
          ? prev.operatingHours.days.filter(d => d !== day)
          : [...prev.operatingHours.days, day]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Validate required fields
      if (!formData.contact.phone) {
        setMessage('Phone number is required');
        setSaving(false);
        return;
      }

      if (!formData.contact.email) {
        setMessage('Email is required');
        setSaving(false);
        return;
      }

      // Prepare data for API
      const updateData = {
        contact: formData.contact,
        address: formData.address,
        operatingHours: formData.operatingHours
      };

      await axios.put(`http://localhost:5000/api/pharmacies/${pharmacy._id}`, updateData);
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      await fetchPharmacyData(); // Refresh data
    } catch (error) {
      console.error('Error updating pharmacy:', error);
        // Prefer server-provided message if available
        const serverMessage = error.response?.data?.message || error.message || 'Failed to update profile';
        setMessage(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: pharmacy.name || '',
      contact: {
        phone: pharmacy.contact?.phone || user?.phone || '',
        email: pharmacy.contact?.email || user?.email || ''
      },
      address: {
        address: pharmacy.address?.address || '',
        city: pharmacy.address?.city || '',
        coordinates: {
          lat: pharmacy.address?.coordinates?.lat || '',
          lng: pharmacy.address?.coordinates?.lng || ''
        }
      },
      operatingHours: {
        open: pharmacy.operatingHours?.open || '08:00',
        close: pharmacy.operatingHours?.close || '17:00',
        days: pharmacy.operatingHours?.days || []
      }
    });
    setIsEditing(false);
    setMessage('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Pharmacy Profile</h1>
        <p>Manage your pharmacy information and settings</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Failed') || message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="profile-content">
        {/* Pharmacy Name Display (Non-editable) */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Pharmacy Information</h2>
          </div>
          <div className="card-body">
            <div className="pharmacy-display-info">
              <div className="display-field">
                <label>Pharmacy Name</label>
                <div className="display-value">{pharmacy.name}</div>
                <p className="field-note">Pharmacy name cannot be changed</p>
              </div>
              <div className="display-field">
                <label>License Number</label>
                <div className="display-value">{pharmacy.licenseNumber}</div>
              </div>
              <div className="display-field">
                <label>Status</label>
                <div className={`status-badge ${pharmacy.status}`}>
                  {pharmacy.status.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Contact Information */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Contact Information</h2>
            {!isEditing && (
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Location Information</h2>
          </div>

          <div className="card-body">
            {isEditing ? (
              <div className="location-editing">
                <div className="location-header">
                  <h3>Set Your Pharmacy Location</h3>
                  <button 
                    className="location-detect-btn"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <>
                        <div className="spinner-small"></div>
                        Detecting Location...
                      </>
                    ) : (
                      <>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Detect My Location Automatically
                      </>
                    )}
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Address *</label>
                    <input
                      type="text"
                      name="address.address"
                      value={formData.address.address}
                      onChange={handleInputChange}
                      placeholder="Enter your pharmacy street address"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="address.coordinates.lat"
                      value={formData.address.coordinates.lat}
                      onChange={handleInputChange}
                      placeholder="Will be auto-detected"
                      readOnly
                      className="read-only"
                    />
                  </div>

                  <div className="form-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="address.coordinates.lng"
                      value={formData.address.coordinates.lng}
                      onChange={handleInputChange}
                      placeholder="Will be auto-detected"
                      readOnly
                      className="read-only"
                    />
                  </div>
                </div>

                <div className="location-note">
                  <p>💡 Click "Detect My Location" to automatically set your precise coordinates. Then enter your address and city manually for patients to find you.</p>
                </div>
              </div>
            ) : (
              <div className="location-display">
                <div className="location-details">
                  <p><strong>Address:</strong> {pharmacy.address?.address || 'Not set'}</p>
                  <p><strong>City:</strong> {pharmacy.address?.city || 'Not set'}</p>
                  {pharmacy.address?.coordinates && (
                    <p><strong>Coordinates:</strong> 
                      {pharmacy.address.coordinates.lat && pharmacy.address.coordinates.lng 
                        ? ` ${pharmacy.address.coordinates.lat}, ${pharmacy.address.coordinates.lng}`
                        : ' Not set'
                      }
                    </p>
                  )}
                  <p><strong>Location Status:</strong> 
                    <span className={pharmacy.locationSet ? 'status-active' : 'status-inactive'}>
                      {pharmacy.locationSet ? ' Set' : ' Not Set'}
                    </span>
                  </p>
                </div>
                
                {!pharmacy.locationSet && (
                  <div className="location-warning">
                    <p>⚠️ Your pharmacy location is not set. Patients won't be able to find you in searches.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Operating Hours */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Operating Hours</h2>
          </div>

          <div className="card-body">
            <div className="hours-grid">
              <div className="form-group">
                <label>Opening Time</label>
                <input
                  type="time"
                  name="operatingHours.open"
                  value={formData.operatingHours.open}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                />
              </div>

              <div className="form-group">
                <label>Closing Time</label>
                <input
                  type="time"
                  name="operatingHours.close"
                  value={formData.operatingHours.close}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                />
              </div>
            </div>

            <div className="days-selection">
              <label>Operating Days</label>
              <div className="days-grid">
                {daysOfWeek.map(day => (
                  <div key={day} className="day-checkbox">
                    <input
                      type="checkbox"
                      id={`day-${day}`}
                      checked={formData.operatingHours.days.includes(day)}
                      onChange={() => handleDayToggle(day)}
                      disabled={!isEditing}
                    />
                    <label htmlFor={`day-${day}`}>{day}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="action-buttons">
            <button 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
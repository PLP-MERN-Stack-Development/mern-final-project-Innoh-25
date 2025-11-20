import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const PharmacyOnboarding = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    email: '',
    phone: '',
    address: {
      address: '',
      city: '',
    },
    coordinates: [0, 0],
    operatingHours: {
      opening: '08:00',
      closing: '20:00'
    },
    services: [],
    description: '',
    certificates: []
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const servicesList = [
    'prescription',
    'over-the-counter', 
    'delivery',
    'consultation',
    'vaccination',
    'lab-tests'
  ];

  useEffect(() => {
    checkPharmacyStatus();
  }, []);

  const checkPharmacyStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:5000/api/pharmacy-onboarding/status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Onboarding status check:', response.data); // Debug log
    
    if (response.data.hasPharmacy) {
      if (response.data.status === 'approved') {
        navigate('/pharmacist/dashboard');
      } else if (response.data.status === 'pending_approval') {
        navigate('/pharmacist/pending-approval');
      } else if (response.data.status === 'rejected') {
        // Don't redirect to the Rejected page from onboarding; instead
        // pre-fill the form with the rejected submission so the pharmacist
        // can edit and resubmit. Navigating to the rejected page here
        // would send the user back to the rejection screen immediately
        // after they attempt to go to onboarding (causing a loop).
        const p = response.data.pharmacy || {};
        setFormData({
          name: p.name || '',
          licenseNumber: p.licenseNumber || '',
          email: p.email || '',
          phone: p.phone || '',
          address: {
            address: p.address?.address || '',
            city: p.address?.city || ''
          },
          coordinates: p.location?.coordinates || [0, 0],
          operatingHours: {
            opening: p.operatingHours?.opening || '08:00',
            closing: p.operatingHours?.closing || '20:00'
          },
          services: p.services || [],
          description: p.description || '',
          certificates: p.certificates || []
        });
      } else {
        // If draft status, pre-fill form with existing data
        setFormData(response.data.pharmacy);
      }
    }
  } catch (error) {
    console.error('Error checking pharmacy status:', error);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      const uploadData = new FormData();
      
      // Add all files to FormData
      Array.from(files).forEach(file => {
        uploadData.append('certificates', file);
      });

      const response = await axios.post(
        'http://localhost:5000/api/pharmacy-onboarding/upload-certificates',
        uploadData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        // Add uploaded certificates to form data
        setFormData(prev => ({
          ...prev,
          certificates: [...prev.certificates, ...response.data.certificates]
        }));
        alert('Files uploaded successfully!');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // MODIFIED: Remove file handler
  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/pharmacy-onboarding/complete-profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      navigate('/pharmacist/pending-approval');
    } catch (error) {
      console.error('Error submitting pharmacy profile:', error);
      alert('Error submitting profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Complete Your Pharmacy Profile</h1>
          <p>Please provide your pharmacy details to get started</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`progress-step ${
                  step <= currentStep ? 'active' : 'inactive'
                }`}
              />
            ))}
          </div>
          <div className="progress-labels">
            <span>Basic Info</span>
            <span>Services & Hours</span>
            <span>Documents</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="form-section">
              <h2>Basic Information</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Pharmacy Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>License Number *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Pharmacy Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Pharmacy Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Address*</label>
                  <input
                    type="text"
                    name="address.address"
                    value={formData.address.address}
                    onChange={handleInputChange}
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
                    required
                  />
                </div>

              </div>

              <div className="button-group">
                <div></div>
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Services & Operating Hours */}
          {currentStep === 2 && (
            <div className="form-section">
              <h2>Services & Operating Hours</h2>
              
              <div className="form-group">
                <label>Select Services Offered *</label>
                <div className="services-grid">
                  {servicesList.map(service => (
                    <label 
                      key={service} 
                      className={`service-checkbox ${formData.services.includes(service) ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                      />
                      <span>{service.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Opening Time *</label>
                  <input
                    type="time"
                    name="operatingHours.opening"
                    value={formData.operatingHours.opening}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Closing Time *</label>
                  <input
                    type="time"
                    name="operatingHours.closing"
                    value={formData.operatingHours.closing}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe your pharmacy services and specialties..."
                />
              </div>

              <div className="button-group">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Documents & Submission */}
          {currentStep === 3 && (
            <div className="form-section">
              <h2>Documents & Final Review</h2>
              
              <div className="form-group">
                <label>Upload Certificates & Licenses</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="certificate-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="certificate-upload"
                    className="file-upload-label"
                  >
                    <div className="file-upload-icon">
                      <svg width="50" height="50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <span className="file-upload-text">Click to upload</span>
                    <span className="file-upload-hint"> or drag and drop</span>
                    <p className="file-upload-hint">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </label>
                </div>

                {formData.certificates.length > 0 && (
                  <div className="uploaded-files">
                    <h4>Uploaded Files:</h4>
                    <div className="uploaded-files-list">
                      {formData.certificates.map((cert, index) => (
                        <div key={index} className="uploaded-file">
                          <span className="uploaded-file-name">{cert.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                certificates: prev.certificates.filter((_, i) => i !== index)
                              }));
                            }}
                            className="remove-file-btn"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="review-section">
                <h4>Review Your Information</h4>
                <div className="review-info">
                  <p><strong>Pharmacy:</strong> {formData.name}</p>
                  <p><strong>License:</strong> {formData.licenseNumber}</p>
                  <p><strong>Location:</strong> {formData.address.street}, {formData.address.city}</p>
                  <p><strong>Services:</strong> {formData.services.join(', ')}</p>
                </div>
              </div>

              <div className="button-group">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-success"
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PharmacyOnboarding;
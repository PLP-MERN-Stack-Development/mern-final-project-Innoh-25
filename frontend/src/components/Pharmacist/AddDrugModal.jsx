import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const AddDrugModal = ({ isOpen, onClose, onDrugAdded }) => {
  const [formData, setFormData] = useState({
    drug: '',
    price: '',
    priceUnit: 'tablet', // New field for price unit
    isAvailable: true, // Simplified stock status
  });
  const [availableDrugs, setAvailableDrugs] = useState([]);
  const [loading, setLoading] = useState(false);

  const priceUnits = [
    'tablet', 'capsule', 'bottle', 'syrup', 'injection', 
    'tube', 'pack', 'dose', 'piece', 'other'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchAvailableDrugs();
    }
  }, [isOpen]);

  const fetchAvailableDrugs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/drugs/not-in-inventory');
      setAvailableDrugs(response.data.drugs || []);
    } catch (error) {
      console.error('Error fetching available drugs:', error);
      alert('Error loading available drugs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Convert form data to inventory format
      const inventoryData = {
        drug: formData.drug,
        price: parseFloat(formData.price),
        isAvailable: formData.isAvailable,
        // Set default values for required fields
        quantity: formData.isAvailable ? 1 : 0,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        minStockLevel: 0,
        maxStockLevel: 100
      };

      await axios.post('http://localhost:5000/api/inventory', inventoryData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Drug added to inventory successfully!');
      onDrugAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding drug:', error);
      alert(error.response?.data?.message || 'Error adding drug to inventory');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      drug: '',
      price: '',
      priceUnit: 'tablet',
      isAvailable: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Drug to Inventory</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Select Drug *</label>
            {loading ? (
              <div className="loading-text">Loading available drugs...</div>
            ) : availableDrugs.length === 0 ? (
              <div className="no-drugs-message">
                <p>No drugs available to add to inventory.</p>
                <p className="message-subtitle">
                  All drugs in your database are already in inventory, or you haven't added any drugs yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // You can navigate to drug management here
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Manage Drugs
                </button>
              </div>
            ) : (
              <select
                name="drug"
                value={formData.drug}
                onChange={handleInputChange}
                required
                className="drug-select"
              >
                <option value="">Choose a drug...</option>
                {availableDrugs.map(drug => (
                  <option key={drug._id} value={drug._id}>
                    {drug.name} {drug.genericName && `(${drug.genericName})`} - {drug.form}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Price (KSh) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Price Per *</label>
              <select
                name="priceUnit"
                value={formData.priceUnit}
                onChange={handleInputChange}
                required
              >
                {priceUnits.map(unit => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleInputChange}
              />
              <span>In Stock</span>
            </label>
            <div className="field-note">
              Uncheck if this drug is currently out of stock
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.drug || availableDrugs.length === 0}
              className="btn btn-primary"
            >
              {loading ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDrugModal;
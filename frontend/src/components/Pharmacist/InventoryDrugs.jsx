import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const InventoryDrugs = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const pharmacyResponse = await axios.get('http://localhost:5000/api/pharmacy-onboarding/profile');
      const pharmacyId = pharmacyResponse.data._id;
      
      const inventoryResponse = await axios.get(`http://localhost:5000/api/inventory/pharmacy/${pharmacyId}`);
      setInventory(inventoryResponse.data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (itemId, updates) => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/${itemId}`, updates);
      alert('Inventory updated successfully!');
      setEditingItem(null);
      fetchInventory(); // Refresh data
    } catch (error) {
      // Improve error visibility for debugging
      console.error('Error updating inventory:', error?.response?.data || error.message || error);
      const serverMessage = error?.response?.data?.message || error?.response?.data || error.message;
      alert('Error updating inventory: ' + (serverMessage || 'Please try again'));
    }
  };

  // Get unique categories from inventory
  const categories = [...new Set(inventory.map(item => item.drug?.category).filter(Boolean))].sort();

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.drug?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.drug?.genericName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.drug?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group inventory by category
  const groupedInventory = filteredInventory.reduce((acc, item) => {
    const category = item.drug?.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-drugs-container">
      <div className="inventory-header">
        <h1>Inventory Drugs</h1>
        <p>Manage your current stock and pricing</p>
      </div>

      {/* Filters */}
      <div className="inventory-filters">
        <input
          type="text"
          placeholder="Search drugs in inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Inventory Grid */}
      <div className="inventory-drugs-content">
        {filteredInventory.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No drugs found in inventory</p>
            <p className="empty-state-subtitle">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'Add drugs to your inventory to get started'
              }
            </p>
          </div>
        ) : (
          <div className="inventory-categories">
            {Object.keys(groupedInventory).map(category => (
              <div key={category} className="inventory-category">
                <h3 className="category-title">{category} ({groupedInventory[category].length})</h3>
                <div className="inventory-drugs-grid">
                  {groupedInventory[category].map((item) => (
                    <div key={item._id} className={`inventory-drug-card ${item.isAvailable ? 'in-stock' : 'out-of-stock'}`}>
                      <div className="drug-card-header">
                        <h3>{item.drug?.name}</h3>
                        {item.drug?.genericName && (
                          <p className="drug-generic">({item.drug.genericName})</p>
                        )}
                        <div className="drug-category">{item.drug?.category}</div>
                      </div>

                      <div className="inventory-details">
                        <div className="stock-info">
                          <div className="stock-status">
                            <span className={`status-dot ${item.isAvailable ? 'in-stock' : 'out-of-stock'}`}></span>
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </div>
                        </div>

                        <div className="pricing-info">
                          <div className="price-main">
                            KSh {item.price?.toLocaleString()}
                          </div>
                          <div className="price-unit">
                            per {item.priceUnit}
                          </div>
                        </div>

                        <div className="inventory-meta">
                          <div className="meta-item">
                            <span className="meta-label">Form:</span>
                            <span className="meta-value">{item.drug?.form}</span>
                          </div>
                          
                          {item.drug?.prescriptionRequired && (
                            <div className="meta-item">
                              <span className="meta-label">Prescription:</span>
                              <span className="meta-value prescription">Required</span>
                            </div>
                          )}

                          <div className="meta-item">
                            <span className="meta-label">Added:</span>
                            <span className="meta-value">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="inventory-actions">
                        <button 
                          onClick={() => setEditingItem(item)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Edit Modal */}
                      {editingItem?._id === item._id && (
                        <EditInventoryModal
                          item={item}
                          onSave={handleUpdateInventory}
                          onClose={() => setEditingItem(null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Edit Inventory Modal Component
const EditInventoryModal = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    price: item.price || '',
    priceUnit: item.priceUnit || 'tablet',
    isAvailable: item.isAvailable || true
  });
  const [loading, setLoading] = useState(false);

  const priceUnits = [
    'tablet', 'capsule', 'bottle', 'syrup', 'injection', 
    'tube', 'pack', 'dose', 'piece', 'other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Ensure numeric and boolean types are sent to the server
    const payload = {
      price: formData.price !== '' ? parseFloat(formData.price) : undefined,
      priceUnit: formData.priceUnit,
      isAvailable: !!formData.isAvailable
    };

    await onSave(item._id, payload);
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Inventory - {item.drug?.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Updating...' : 'Update Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryDrugs;
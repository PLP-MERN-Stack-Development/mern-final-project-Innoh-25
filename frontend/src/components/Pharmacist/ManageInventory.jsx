import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const ManageInventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      // First get pharmacy ID
      const pharmacyResponse = await axios.get('http://localhost:5000/api/pharmacy-onboarding/profile');
      const pharmacyId = pharmacyResponse.data._id;
      
      // Then get inventory
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
      console.error('Error updating inventory:', error);
      alert('Error updating inventory');
    }
  };

  // Get unique categories from inventory
  const categories = [...new Set(inventory.map(item => item.drug?.category).filter(Boolean))].sort();

  // Filter inventory based on search and category
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
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Manage Inventory</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search drugs..."
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
      </div>

      <div className="inventory-content">
        {filteredInventory.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No inventory items found</p>
            <p className="empty-state-subtitle">
              {searchTerm || selectedCategory !== 'all' ? 'Try adjusting your search' : 'Add your first drug to get started'}
            </p>
          </div>
        ) : (
          <div className="inventory-categories">
            {Object.keys(groupedInventory).map(category => (
              <div key={category} className="inventory-category">
                <h3 className="category-title">{category} ({groupedInventory[category].length})</h3>
                <div className="inventory-grid">
                  {groupedInventory[category].map((item) => (
                    <div key={item._id} className="inventory-card">
                      <div className="inventory-card-header">
                        <h3>{item.drug?.name}</h3>
                        {item.drug?.genericName && (
                          <p className="drug-generic">({item.drug.genericName})</p>
                        )}
                      </div>

                      <div className="inventory-details">
                        <div className="detail-row">
                          <span>Price:</span>
                          <span>KSh {item.price?.toLocaleString()} per {item.priceUnit}</span>
                        </div>
                        
                        <div className="detail-row">
                          <span>Status:</span>
                          <span className={`status ${item.isAvailable ? 'available' : 'unavailable'}`}>
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        <div className="detail-row">
                          <span>Form:</span>
                          <span className="drug-form">{item.drug?.form}</span>
                        </div>

                        {item.drug?.prescriptionRequired && (
                          <div className="detail-row">
                            <span>Prescription:</span>
                            <span className="prescription-required">Required</span>
                          </div>
                        )}
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

// Updated Edit Inventory Modal Component
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
    await onSave(item._id, formData);
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

export default ManageInventory;
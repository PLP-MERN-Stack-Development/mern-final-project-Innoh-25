import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../styles/Pharmacist.css';

const DrugClassManager = () => {
  const [drugs, setDrugs] = useState([]);
  const [categories, setCategories] = useState([]); // Start empty
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditDrugModal, setShowEditDrugModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllDrugs();
  }, []);

  // Fetch all drugs and extract unique categories
  const fetchAllDrugs = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/drugs/pharmacy-drugs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allDrugs = response.data.drugs || [];
      setDrugs(allDrugs);
      
      // Extract unique categories from drugs (will be empty initially)
      const uniqueCategories = [...new Set(allDrugs.map(drug => drug.category).filter(Boolean))];
      setCategories(uniqueCategories.sort());
      
      // Set first category as selected if available
      if (uniqueCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(uniqueCategories[0]);
      }
      
    } catch (error) {
      console.error('Error fetching drugs:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load drugs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get drugs for the currently selected category
  const getCurrentCategoryDrugs = () => {
    if (!selectedCategory) return [];
    return drugs.filter(drug => drug.category === selectedCategory);
  };

  const handleDrugAdded = () => {
    fetchAllDrugs(); // Refresh all drugs and categories
  };

  const handleDrugUpdated = () => {
    fetchAllDrugs(); // Refresh all drugs and categories
    setShowEditDrugModal(false);
    setEditingDrug(null);
  };

  const handleEditDrug = (drug) => {
    setEditingDrug(drug);
    setShowEditDrugModal(true);
  };

  const handleRemoveDrug = async (drugId, drugName) => {
    if (window.confirm(`Are you sure you want to remove "${drugName}"? This will also remove it from inventory if it exists.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/drugs/${drugId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert('Drug removed successfully!');
        fetchAllDrugs(); // Refresh the list and categories
      } catch (error) {
        console.error('Error removing drug:', error);
        alert('Failed to remove drug: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    const categoryName = newCategoryName.trim();
    
    // Check if category already exists
    if (categories.includes(categoryName)) {
      alert(`Category "${categoryName}" already exists!`);
      return;
    }

    // Add the new category
    const updatedCategories = [...categories, categoryName].sort();
    setCategories(updatedCategories);
    
    // Select the new category
    setSelectedCategory(categoryName);
    
    // Close modal and reset
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    
    alert(`Category "${categoryName}" created successfully! Now you can add drugs to this category.`);
  };

  const handleDeleteCategory = async (categoryName) => {
    const drugsInCategory = drugs.filter(drug => drug.category === categoryName);
    
    if (drugsInCategory.length > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${drugsInCategory.length} drug(s). Please remove all drugs from this category first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      // Remove category from our local state
      const updatedCategories = categories.filter(cat => cat !== categoryName);
      setCategories(updatedCategories);
      
      // Select another category if available
      if (selectedCategory === categoryName) {
        if (updatedCategories.length > 0) {
          setSelectedCategory(updatedCategories[0]);
        } else {
          setSelectedCategory('');
        }
      }
      
      alert('Category deleted successfully!');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/pharmacist/dashboard');
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p>Loading drugs...</p>
        </div>
      </div>
    );
  }

  const currentCategoryDrugs = getCurrentCategoryDrugs();

  return (
    <div className="drug-class-container">
      <div className="drug-class-header">
        <div className="header-with-back">
          <button 
            onClick={handleBackToDashboard}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1>Manage Drug Database</h1>
            <p>Create custom categories and organize your drugs</p>
          </div>
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="category-management">
        <div className="category-section-header">
          <h2>Your Drug Categories</h2>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="btn btn-primary"
            style={{position:'relative',width:'30%'}}
          >
            + New Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="empty-categories">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No categories created yet</p>
            <p className="empty-state-subtitle">
              Create your first category to organize your drugs
            </p>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="btn btn-primary"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="custom-category-tabs">
            {categories.map(category => (
              <div key={category} className="custom-category-tab-container">
                <button
                  className={`custom-category-tab ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="category-name">{category}</span>
                  <span className="drug-count">
                    ({drugs.filter(drug => drug.category === category).length})
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className="delete-category-btn"
                  title="Delete category"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Content - Only show if categories exist */}
      {categories.length > 0 && selectedCategory && (
        <div className="category-content">
          <div className="category-header">
            <h2>{selectedCategory} ({currentCategoryDrugs.length} drugs)</h2>
            <button
              onClick={() => setShowAddDrugModal(true)}
              className="btn btn-primary"
              style={{position:'relative',width:'30%'}}
            >
              Add Drug to {selectedCategory}
            </button>
          </div>

          {currentCategoryDrugs.length === 0 ? (
            <div className="empty-category">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={200} height={200}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No drugs in "{selectedCategory}" category</p>
              <p className="empty-state-subtitle">
                Add your first drug to this category
              </p>
              <button
                onClick={() => setShowAddDrugModal(true)}
                className="btn btn-primary"
                style={{position:'relative',width:'30%'}}
              >
                Add First Drug
              </button>
            </div>
          ) : (
            <div className="drugs-list">
              {currentCategoryDrugs.map(drug => (
                <div key={drug._id} className="drug-item">
                  <div className="drug-info">
                    <h3>{drug.name}</h3>
                    {drug.genericName && (
                      <p className="drug-generic">({drug.genericName})</p>
                    )}
                    <div className="drug-meta">
                      <span className="drug-form">{drug.form}</span>
                      {drug.strength?.value && (
                        <span className="drug-strength">
                          {drug.strength.value} {drug.strength.unit}
                        </span>
                      )}
                      <span className={`prescription-badge ${drug.prescriptionRequired ? 'required' : 'not-required'}`}>
                        {drug.prescriptionRequired ? 'Rx Required' : 'OTC'}
                      </span>
                    </div>
                    {drug.manufacturer && (
                      <p className="drug-manufacturer">By: {drug.manufacturer}</p>
                    )}
                    {drug.description && (
                      <p className="drug-description">{drug.description}</p>
                    )}
                  </div>
                  <div className="drug-actions">
                    <button 
                      onClick={() => handleEditDrug(drug)}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleRemoveDrug(drug._id, drug.name)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Categories Message */}
      {categories.length === 0 && (
        <div className="no-categories-message">
          <div className="message-content">
            <h3>Ready to organize your drugs?</h3>
            <p>Start by creating your first category. Categories help you organize your drugs by type, purpose, or any system that works for your pharmacy.</p>
            <div className="message-examples">
              <p><strong>Examples of categories:</strong></p>
              <ul>
                <li>Antibiotics</li>
                <li>Pain Relief</li>
                <li>Children's Medicine</li>
                <li>First Aid</li>
                <li>Chronic Conditions</li>
                <li>Vitamins & Supplements</li>
              </ul>
            </div>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="btn btn-primary btn-large"
            >
              Create Your First Category
            </button>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Category</h2>
              <button className="close-btn" onClick={() => setShowAddCategoryModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddCategory} className="modal-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Antibiotics, Pain Relief, Children's Medicine..."
                  required
                  maxLength="50"
                  autoFocus
                />
                <div className="char-count">
                  {newCategoryName.length}/50
                </div>
              </div>
              <div className="category-examples">
                <p><strong>Examples:</strong> Antibiotics, Pain Relief, First Aid, Vitamins, Chronic Conditions</p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Drug Modal */}
      <AddDrugModal
        isOpen={showAddDrugModal}
        onClose={() => setShowAddDrugModal(false)}
        onDrugAdded={handleDrugAdded}
        selectedCategory={selectedCategory}
        existingCategories={categories}
      />

      {/* Edit Drug Modal */}
      <EditDrugModal
        isOpen={showEditDrugModal}
        onClose={() => {
          setShowEditDrugModal(false);
          setEditingDrug(null);
        }}
        onDrugUpdated={handleDrugUpdated}
        drug={editingDrug}
        existingCategories={categories}
      />
    </div>
  );
};

// Updated AddDrugModal Component
const AddDrugModal = ({ isOpen, onClose, onDrugAdded, selectedCategory, existingCategories }) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brand: '',
    description: '',
    category: selectedCategory || '',
    form: 'tablet',
    prescriptionRequired: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const forms = [
    'tablet', 'capsule', 'syrup', 'injection', 'ointment', 
    'cream', 'drops', 'inhaler', 'other'
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        category: selectedCategory || '' 
      }));
      setError('');
    }
  }, [isOpen, selectedCategory]);

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
    setError('');

    try {
      if (!formData.category.trim()) {
        throw new Error('Please select a category');
      }

      if (!existingCategories.includes(formData.category)) {
        throw new Error('Please select a valid category from the list');
      }

      const token = localStorage.getItem('token');
      
      // Prepare data for submission
      const submissionData = { ...formData };

      // Remove empty fields
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === '' || submissionData[key] === null || submissionData[key] === undefined) {
          delete submissionData[key];
        }
      });

      await axios.post('http://localhost:5000/api/drugs', submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Drug added successfully!');
      onDrugAdded();
      onClose();
      // Reset form
      setFormData({
        name: '',
        genericName: '',
        brand: '',
        description: '',
        category: selectedCategory || '',
        form: 'tablet',
        prescriptionRequired: false,
      });
    } catch (error) {
      console.error('Error adding drug:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add drug';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Drug to {selectedCategory || 'Category'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Drug Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Amoxicillin"
              />
            </div>

            <div className="form-group">
              <label>Generic Name</label>
              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
                placeholder="e.g., Amoxicillin Trihydrate"
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category...</option>
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="field-note">
                Can't find the category you need? Create it first using the "New Category" button.
              </div>
            </div>

            <div className="form-group">
              <label>Form *</label>
              <select
                name="form"
                value={formData.form}
                onChange={handleInputChange}
                required
              >
                {forms.map(form => (
                  <option key={form} value={form}>
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Amoxil"
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Brief description of the drug..."
                maxLength="500"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="prescriptionRequired"
                checked={formData.prescriptionRequired}
                onChange={handleInputChange}
              />
              <span>Prescription Required</span>
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
              disabled={loading || !formData.category}
              className="btn btn-primary"
            >
              {loading ? 'Adding...' : 'Add Drug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// EditDrugModal Component (similar to AddDrugModal but for editing)
// Updated EditDrugModal Component - Simplified
const EditDrugModal = ({ isOpen, onClose, onDrugUpdated, drug, existingCategories }) => {
  const [formData, setFormData] = useState({
    name: drug?.name || '',
    genericName: drug?.genericName || '',
    brand: drug?.brand || '',
    description: drug?.description || '',
    category: drug?.category || '',
    form: drug?.form || 'tablet',
    prescriptionRequired: drug?.prescriptionRequired || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const forms = [
    'tablet', 'capsule', 'syrup', 'injection', 'ointment', 
    'cream', 'drops', 'inhaler', 'other'
  ];

  useEffect(() => {
    if (isOpen && drug) {
      setFormData({
        name: drug.name || '',
        genericName: drug.genericName || '',
        brand: drug.brand || '',
        description: drug.description || '',
        category: drug.category || '',
        form: drug.form || 'tablet',
        prescriptionRequired: drug.prescriptionRequired || false,
      });
      setError('');
    }
  }, [isOpen, drug]);

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
    setError('');

    try {
      if (!formData.category.trim()) {
        throw new Error('Please select a category');
      }

      if (!existingCategories.includes(formData.category)) {
        throw new Error('Please select a valid category from the list');
      }

      const token = localStorage.getItem('token');
      
      // Prepare data for submission
      const submissionData = { ...formData };

      // Remove empty fields
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === '' || submissionData[key] === null || submissionData[key] === undefined) {
          delete submissionData[key];
        }
      });

      await axios.put(`http://localhost:5000/api/drugs/${drug._id}`, submissionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Drug updated successfully!');
      onDrugUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating drug:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update drug';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !drug) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Drug: {drug.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Drug Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Amoxicillin"
              />
            </div>

            <div className="form-group">
              <label>Generic Name</label>
              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleInputChange}
                placeholder="e.g., Amoxicillin Trihydrate"
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category...</option>
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Form *</label>
              <select
                name="form"
                value={formData.form}
                onChange={handleInputChange}
                required
              >
                {forms.map(form => (
                  <option key={form} value={form}>
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Amoxil"
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Brief description of the drug..."
                maxLength="500"
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="prescriptionRequired"
                checked={formData.prescriptionRequired}
                onChange={handleInputChange}
              />
              <span>Prescription Required</span>
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
              {loading ? 'Updating...' : 'Update Drug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DrugClassManager;
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../../Shared/UI/LoadingSpinner';

const DrugSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    distance: 10,
    inStock: true,
    priceRange: [0, 10000]
  });

  useEffect(() => {
    if (searchTerm) {
      performSearch();
    }
  }, [searchTerm, filters]);

  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userLocation = JSON.parse(localStorage.getItem('userLocation')) || {
        latitude: -1.2921,
        longitude: 36.8219
      };

      // Try API call first, fallback to mock data if it fails
      try {
        // Use the public patient-search endpoint (does not require auth)
        const response = await axios.post('http://localhost:5000/api/patient-search/search', {
          searchTerm: searchTerm.trim(),
          filters,
          userLocation
        });

        if (response.data.success) {
          setResults(response.data.data);
        } else {
          setError('Search failed. Please try again.');
          setResults([]); 
        }
      } catch (apiError) {
        console.warn('API call failed, using mock data');
        setResults([]);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for medications. Using demo data.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/patient/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleOrder = (result) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          returnTo: '/patient/checkout',
          message: 'Please login to place an order' 
        } 
      });
      return;
    }
    navigate('/patient/checkout', { state: { orderData: result } });
  };

  const handleViewDetails = (result) => {
    navigate('/patient/drug-details', { state: { result } });
  };

  return (
    <div className="search-container">
      {/* Search Header */}
      <div className="search-header">
        <h1>Find Medications</h1>
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search for drugs, symptoms, or conditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary search-btn">
              🔍 Search
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="search-filters">
        <div className="filter-group">
          <label>Max Distance:</label>
          <select 
            value={filters.distance} 
            onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={filters.inStock}
              onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
            />
            In Stock Only
          </label>
        </div>

        <div className="filter-group">
          <label>Price Range:</label>
          <select 
            value={filters.priceRange[1]} 
            onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [0, parseInt(e.target.value)] }))}
          >
            <option value={10000}>Any Price</option>
            <option value={100}>Under KSh 100</option>
            <option value={500}>Under KSh 500</option>
            <option value={1000}>Under KSh 1,000</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="search-results">
        {loading && <LoadingSpinner />}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!loading && !error && searchTerm && (
          <div className="results-header">
            <h2>Search Results for "{searchTerm}"</h2>
            <span className="results-count">{results.length} results found</span>
          </div>
        )}

        <div className="results-grid">
          {results.map((result, index) => (
            <div key={index} className="search-result-card">
              <div className="drug-info">
                <h3>{result.drug.name}</h3>
                <p className="drug-description">{result.drug.description}</p>
                <div className="drug-meta">
                  <span className="drug-category">{result.drug.category}</span>
                  {result.drug.prescriptionRequired && (
                    <span className="prescription-badge">Prescription Required</span>
                  )}
                </div>
              </div>

              <div className="pharmacy-info">
                <h4>{result.pharmacy.name || result.pharmacy.businessName || 'Pharmacy'}</h4>
                <p className="pharmacy-address">📍 {
                  typeof result.pharmacy.address === 'string'
                    ? result.pharmacy.address
                    : result.pharmacy.address?.address
                      ? `${result.pharmacy.address.address}${result.pharmacy.address.city ? ', ' + result.pharmacy.address.city : ''}`
                      : ''
                }</p>
                <p className="pharmacy-distance">🚗 {result.distance ?? result.pharmacy.distance} km away</p>
                <p className="pharmacy-hours">🕒 {
                  typeof result.pharmacy.operatingHours === 'string'
                    ? result.pharmacy.operatingHours
                    : result.pharmacy.operatingHours
                      ? `${result.pharmacy.operatingHours.open || ''} - ${result.pharmacy.operatingHours.close || ''}`
                      : ''
                }</p>
                <div className="pharmacy-rating">⭐ {result.pharmacy.rating ?? 'N/A'}</div>
              </div>

              <div className="pricing-info">
                <div className="price">KSh {result.price}</div>
                <div className={`stock-status ${result.inStock ? 'in-stock' : 'out-of-stock'}`}>
                  {result.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  onClick={() => handleViewDetails(result)}
                  className="btn btn-secondary"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleOrder(result)}
                  className="btn btn-primary"
                  disabled={!result.inStock}
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && searchTerm && results.length === 0 && (
          <div className="no-results">
            <h3>No medications found</h3>
            <p>Try adjusting your search terms or filters</p>
          </div>
        )}

        {!searchTerm && (
          <div className="search-suggestions">
            <h3>Popular Searches</h3>
            <div className="suggestion-chips">
              {['Paracetamol', 'Amoxicillin', 'Vitamins', 'Painkillers', 'Antibiotics'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchTerm(suggestion)}
                  className="suggestion-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugSearch;
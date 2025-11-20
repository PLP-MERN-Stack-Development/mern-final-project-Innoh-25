import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchResultCard from './SearchResultCard';
import LoadingSpinner from '../../Shared/UI/LoadingSpinner';
import axios from 'axios';
import { getLatLngFromPharmacy, hasValidCoordinates } from '../../../utils/geo';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    distance: 10,
    priceRange: [0, 10000],
    inStock: true
  });
  const [userLocation, setUserLocation] = useState(null);

  const query = searchParams.get('q');
  const category = searchParams.get('category');

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if ((query || category) && userLocation) {
      performSearch();
    }
  }, [query, category, filters, userLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
        },
        (error) => {
          console.warn('Location access denied, using default location');
          // Use a default location (e.g., Nairobi center)
          const defaultLocation = {
            latitude: -1.2921,
            longitude: 36.8219
          };
          setUserLocation(defaultLocation);
        }
      );
    }
  };

  const performSearch = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:5000/api/pharmacies', {
        params: {
          search: query,
          category: category,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          maxDistance: filters.distance * 1000, // Convert km to meters
          inStock: filters.inStock
        }
      });

      setResults(response.data.pharmacies);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getDirections = (pharmacy) => {
    const coords = getLatLngFromPharmacy(pharmacy);
    if (coords) {
      const { lat, lng } = coords;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (pharmacy.address && pharmacy.address.address) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pharmacy.address.address)}`;
      window.open(url, '_blank');
    } else {
      alert('Directions not available for this pharmacy');
    }
  };

  if (loading) {
    return (
      <div className="search-results-container">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="search-results-container">
      <div className="search-header">
        <h1>
          {query ? `Search Results for "${query}"` : category ? `${category.replace('-', ' ').toUpperCase()}` : 'All Medications'}
        </h1>
        <p className="results-count">{results.length} pharmacies found</p>
        
        {/* Location status */}
        <div className="location-status">
          {userLocation ? (
            <span className="location-badge">📍 Searching near your location</span>
          ) : (
            <span className="location-badge warning">📍 Using default location</span>
          )}
        </div>
      </div>

      {/* Search Filters */}
      <div className="search-filters">
        <div className="filter-group">
          <label>Distance:</label>
          <select 
            value={filters.distance} 
            onChange={(e) => updateFilters({ distance: parseInt(e.target.value) })}
          >
            <option value={5}>Within 5km</option>
            <option value={10}>Within 10km</option>
            <option value={25}>Within 25km</option>
            <option value={50}>Within 50km</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input 
              type="checkbox" 
              checked={filters.inStock}
              onChange={(e) => updateFilters({ inStock: e.target.checked })}
            />
            In Stock Only
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="results-grid">
        {results.map((pharmacy) => (
          <div key={pharmacy._id} className="pharmacy-card">
            <div className="pharmacy-header">
              <h3>{pharmacy.name}</h3>
              <span className="distance-badge">
                {pharmacy.distance ? `${(pharmacy.distance / 1000).toFixed(1)}km` : 'Nearby'}
              </span>
            </div>
            
            <div className="pharmacy-info">
              <p className="pharmacy-address">📍 {pharmacy.address.address}</p>
              <p className="pharmacy-contact">📞 {pharmacy.contact.phone}</p>
              <p className="pharmacy-hours">🕒 {pharmacy.operatingHours.open} - {pharmacy.operatingHours.close}</p>
            </div>

            <div className="pharmacy-actions">
              <button 
                onClick={() => navigate(`/patient/pharmacy/${pharmacy._id}`)}
                className="btn btn-secondary"
              >
                View Pharmacy
              </button>
              <button 
                onClick={() => getDirections(pharmacy)}
                className="btn btn-primary"
              >
                Get Directions
              </button>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <div className="no-results">
          <h3>No pharmacies found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
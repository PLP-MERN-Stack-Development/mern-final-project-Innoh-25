import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SearchResultCard from '../../components/Patient/Search/SearchResultCard';
import { useGeolocation } from '../../hooks/useGeoLocation';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  const { location: userLocation, loading: geoLoading } = useGeolocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = {
          searchTerm: query || '',
          category: category || null,
          filters: {
            distance: 10,
            inStock: true
          },
          userLocation: userLocation || null
        };

        const response = await axios.post('http://localhost:5000/api/patient-search/search', payload);
        if (response.data.success) {
          setResults(response.data.data || []);
        } else {
          setResults([]);
          setError(response.data.message || 'No results');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError(err.response?.data?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    // Fetch when query/category or user location changes
    fetchResults();
  }, [query, category, userLocation]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>
          {query ? `Search Results for "${query}"` : category ? `${category.replace('-', ' ')}` : 'All Medications'}
        </h1>
        <p style={{ color: 'var(--text-light)' }}>
          {loading ? 'Searching...' : `${results.length} medications found`}
        </p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((result, idx) => (
          <SearchResultCard key={`${result.drug._id}-${result.pharmacy._id}-${idx}`} result={result} onSelect={() => {}} />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
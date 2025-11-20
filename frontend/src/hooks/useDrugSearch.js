import { useState, useCallback } from 'react';

export const useDrugSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchDrugs = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        q: searchTerm,
        ...filters
      });

      const response = await fetch(`/api/drugs/search?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, searchDrugs };
};
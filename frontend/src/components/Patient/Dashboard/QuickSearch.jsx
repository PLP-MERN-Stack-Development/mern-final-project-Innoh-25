import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/patient/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const popularSearches = ['Paracetamol', 'Amoxicillin', 'Vitamins', 'Painkillers', 'Antibiotics'];

  return (
    <div style={{
      background: 'var(--bg-white)',
      padding: '2rem',
      borderRadius: 'var(--border-radius)',
      boxShadow: 'var(--shadow)',
      marginBottom: '2rem'
    }}>
      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Search for medications, symptoms, or conditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '1rem',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '1rem'
            }}
          />
          <button 
            type="submit"
            className="btn btn-primary"
            style={{ padding: '1rem 2rem' }}
          >
            Search
          </button>
        </div>
      </form>

      <div>
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Popular Searches:</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {popularSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => setSearchTerm(search)}
              className="btn"
              style={{
                background: 'var(--bg-light)',
                color: 'var(--text-dark)',
                padding: '0.5rem 1rem'
              }}
            >
              {search}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickSearch;
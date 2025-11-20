import React from 'react';

const SearchResultCard = ({ result, onSelect }) => {
  const { drug, pharmacy, price, distance, inStock } = result;

  const handleCardClick = () => {
    onSelect(result);
  };

  return (
    <div className="search-result-card" onClick={handleCardClick}>
      <div className="drug-info-section">
        <h3 className="drug-name">{drug.name}</h3>
        <p className="drug-description">{drug.description}</p>
        {drug.prescriptionRequired && (
          <span className="prescription-badge">📋 Prescription Required</span>
        )}
      </div>

      <div className="pharmacy-info-section">
        <div className="pharmacy-header">
          <h4 className="pharmacy-name">{pharmacy.name}</h4>
          <span className="distance">{distance} km away</span>
        </div>
        
        <div className="pharmacy-details">
          <p className="pharmacy-address">{pharmacy.address?.address}</p>
          <p className="pharmacy-contact">{pharmacy.phone}</p>
        </div>
      </div>

      <div className="pricing-section">
        <div className="price">KSh {price}</div>
        <div className={`stock-status ${inStock ? 'in-stock' : 'out-of-stock'}`}>
          {inStock ? '✅ In Stock' : '❌ Out of Stock'}
        </div>
      </div>

      <div className="action-section">
        <button className="btn btn-primary view-details-btn">
          View Details
        </button>
      </div>
    </div>
  );
};

export default SearchResultCard;
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getLatLngFromPharmacy, hasValidCoordinates } from '../../../utils/geo';

const DrugDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { result } = location.state || {};
  const [quantity, setQuantity] = useState(1);

  if (!result) {
    return (
      <div className="drug-details-container">
        <div className="error-state">
          <h2>No drug information available</h2>
          <p>Please go back and select a medication</p>
          <button onClick={() => navigate('/patient/search')} className="btn btn-primary">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const { drug, pharmacy, price, distance, inStock } = result;

  // Normalize commonly displayed fields so UI shows consistent fallbacks
  const phone = pharmacy.phone || pharmacy.contact?.phone || null;
  const email = pharmacy.email || pharmacy.contact?.email || null;
  const rating = pharmacy.rating ?? null;

  const operatingHoursDisplay =
    typeof pharmacy.operatingHours === 'string'
      ? pharmacy.operatingHours
      : pharmacy.operatingHours
        ? `${pharmacy.operatingHours.open || ''}${pharmacy.operatingHours.open && pharmacy.operatingHours.close ? ' - ' : ''}${pharmacy.operatingHours.close || ''}`
        : null;

  const displayDistance = (() => {
    // distance from the `result` might already be in km (as used elsewhere), otherwise try pharmacy.distance (meters)
    if (typeof distance === 'number') return `${distance} km away`;
    if (pharmacy && typeof pharmacy.distance === 'number') return `${(pharmacy.distance / 1000).toFixed(1)} km away`;
    return 'N/A';
  })();

  const formatAddress = (pharmacy) => {
    // Handle different address formats
    if (typeof pharmacy.address === 'string') {
      return pharmacy.address;
    }
    
    if (pharmacy.address && typeof pharmacy.address === 'object') {
      const addr = pharmacy.address;
      const parts = [
        addr.street || addr.address,
        addr.city,
        addr.state,
        addr.country,
        addr.postalCode
      ].filter(Boolean);
      return parts.join(', ');
    }
    
    return 'Location not available';
  };

  // Use helper to normalize various coordinate formats into { lat, lng }
  const getCoordinates = () => {
    return getLatLngFromPharmacy(pharmacy);
  };

  const handleGetDirections = () => {
    const coordinates = getCoordinates();
    const formattedAddress = formatAddress(pharmacy);
    
    // Check if we have valid location data
    if (!coordinates && formattedAddress === 'Location not available') {
      alert('Location information not available for this pharmacy');
      return;
    }

    let mapsUrl;
    
    if (coordinates && coordinates.lat !== undefined && coordinates.lng !== undefined) {
      // Use normalized coordinates for precise location
      const { lat, lng } = coordinates;
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(formattedAddress)}`;
    } else if (formattedAddress && formattedAddress !== 'Location not available') {
      // Fallback to address
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedAddress)}`;
    } else {
      alert('Location information not available for this pharmacy');
      return;
    }
    
    window.open(mapsUrl, '_blank');
  };

  const handleOrderNow = () => {
    if (!user) {
      navigate('/login', { 
        state: { 
          returnTo: '/patient/checkout',
          orderData: { ...result, quantity }
        } 
      });
      return;
    }
    navigate('/patient/checkout', { state: { orderData: { ...result, quantity } } });
  };

  const totalPrice = price * quantity;

  return (
    <div className="drug-details-container">
      <div className="drug-details-card">
        {/* Drug Header */}
        <div className="drug-header">
          <div>
            <h1>{drug.name}</h1>
            <p className="drug-category">{drug.category} • {drug.manufacturer}</p>
          </div>
          <div className={`availability-badge ${inStock ? 'in-stock' : 'out-of-stock'}`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>

        {/* Drug Information */}
        <div className="drug-info-section">
          <h2>Description</h2>
          <p>{drug.description}</p>
          
          {drug.prescriptionRequired && (
            <div className="prescription-warning">
              <strong>⚠️ Prescription Required</strong>
              <p>You'll need a valid prescription from a doctor to purchase this medication.</p>
            </div>
          )}
        </div>

        {/* Pharmacy Information */}
        <div className="pharmacy-section">
          <h2>Available at this Pharmacy</h2>
          <div className="pharmacy-card">
            <h3>{pharmacy.name || pharmacy.businessName || 'Pharmacy'}</h3>
            <div className="pharmacy-details">
              <p>📍 {formatAddress(pharmacy)}</p>
              <p>📞 {phone ?? 'N/A'}</p>
              <p>📧 {email ?? 'N/A'}</p>
              <p>🕒 {operatingHoursDisplay ?? 'Hours not available'}</p>
              <p>🚗 {displayDistance}</p>
              <div className="pharmacy-rating">⭐ {rating ?? 'N/A'} Rating</div>
            </div>
          </div>
        </div>

        {/* Order Section */}
        <div className="order-section">
          <h2>Order Details</h2>
          <div className="pricing-info">
            <div className="unit-price">Unit Price: <strong>KSh {price}</strong></div>
            
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <div className="total-price">
              Total: <strong>KSh {totalPrice}</strong>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={handleGetDirections}
              className="btn btn-secondary"
              disabled={!hasValidCoordinates(pharmacy) && formatAddress(pharmacy) === 'Location not available'}
            >
              🗺️ Get Directions
            </button>
            
            <button 
              onClick={handleOrderNow}
              className="btn btn-primary"
              disabled={!inStock}
            >
              🛒 Order Now
            </button>
          </div>
        </div>

        {/* Additional Information */}
        <div className="additional-info">
          <h3>Delivery Information</h3>
          <p>📦 {distance < 5 ? 'Same day delivery available' : 'Delivery within 24 hours'}</p>
          <p>💰 Delivery fee: KSh {distance < 5 ? '100' : '200'}</p>
          
          <h3>Pickup Information</h3>
          <p>🏪 Ready for pickup in 30 minutes</p>
          <p>🆔 Bring your ID for prescription medications</p>
        </div>
      </div>
    </div>
  );
};

export default DrugDetails;
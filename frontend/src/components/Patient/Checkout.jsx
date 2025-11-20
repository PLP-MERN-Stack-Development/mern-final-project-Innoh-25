import React from 'react';
import { useLocation } from 'react-router-dom';

const Checkout = () => {
  const location = useLocation();

  // Support two shapes:
  // 1. { drug, pharmacy, quantity }
  // 2. { orderData: { drug, pharmacy, price, quantity } } (used by DrugSearch/DrugDetails)
  const raw = location.state?.orderData || location.state || {};

  const drug = raw.drug || null;
  const pharmacy = raw.pharmacy || null;
  const quantity = raw.quantity ?? 1;

  // price may be passed either as pharmacy.price or as raw.price (top-level price from search result)
  const unitPrice = pharmacy?.price ?? raw.price ?? 0;

  const hasOrderInfo = !!(drug || pharmacy || unitPrice > 0);

  if (!hasOrderInfo) {
    return (
      <div>
        <h1>Checkout</h1>
        <div className="feature-card">
          <p>No order information available. Please start from search.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Checkout</h1>
      <div className="feature-card">
        <h2>Order Summary</h2>
        <p><strong>Drug:</strong> {drug?.name ?? 'Selected drug'}</p>
        <p><strong>Pharmacy:</strong> {pharmacy?.name ?? pharmacy?.businessName ?? 'Selected pharmacy'}</p>
        <p><strong>Price:</strong> KSh {unitPrice}</p>
        <p><strong>Quantity:</strong> {quantity}</p>
        <p><strong>Total:</strong> KSh {unitPrice * quantity}</p>
        
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Complete Order
        </button>
      </div>
    </div>
  );
};

export default Checkout;
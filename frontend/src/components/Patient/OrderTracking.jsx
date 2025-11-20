import React from 'react';
import { useParams } from 'react-router-dom';

const OrderTracking = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1>Track Order #{id}</h1>
      <div className="feature-card">
        <p>Order tracking coming soon...</p>
      </div>
    </div>
  );
};

export default OrderTracking;
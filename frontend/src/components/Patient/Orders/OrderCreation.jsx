import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OrderCreation = ({ drug, pharmacy }) => {
  const [orderType, setOrderType] = useState('delivery');
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [prescription, setPrescription] = useState(null);
  const navigate = useNavigate();

  const calculateTotal = () => {
    const drugPrice = pharmacy.price * quantity;
    const deliveryFee = orderType === 'delivery' ? 150 : 0; // Example delivery fee
    return drugPrice + deliveryFee;
  };

  const handleSubmitOrder = async () => {
    try {
      const orderData = {
        drugId: drug._id,
        pharmacyId: pharmacy._id,
        quantity,
        orderType,
        totalAmount: calculateTotal(),
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
        prescription: prescription
      };

      // API call to create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const order = await response.json();
        navigate('/checkout', { state: { order } });
      }
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  return (
    <div className="order-creation">
      <h2>Place Your Order</h2>
      
      <div className="order-details">
        <div className="drug-summary">
          <h3>{drug.name}</h3>
          <p>From: {pharmacy.name}</p>
          <p>Price: KSh {pharmacy.price}</p>
        </div>

        <div className="order-options">
          <div className="order-type">
            <label>Order Type:</label>
            <div className="type-options">
              <button
                className={orderType === 'pickup' ? 'active' : ''}
                onClick={() => setOrderType('pickup')}
              >
                🏪 Pickup
              </button>
              <button
                className={orderType === 'delivery' ? 'active' : ''}
                onClick={() => setOrderType('delivery')}
              >
                🚚 Delivery
              </button>
            </div>
          </div>

          <div className="quantity-selector">
            <label>Quantity:</label>
            <div className="quantity-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          {orderType === 'delivery' && (
            <div className="delivery-address">
              <label>Delivery Address:</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your delivery address"
              />
            </div>
          )}

          {drug.prescriptionRequired && (
            <div className="prescription-upload">
              <label>Upload Prescription:</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPrescription(e.target.files[0])}
              />
            </div>
          )}
        </div>

        <div className="order-summary">
          <h4>Order Summary</h4>
          <div className="summary-line">
            <span>Drug Price:</span>
            <span>KSh {pharmacy.price * quantity}</span>
          </div>
          {orderType === 'delivery' && (
            <div className="summary-line">
              <span>Delivery Fee:</span>
              <span>KSh 150</span>
            </div>
          )}
          <div className="summary-total">
            <span>Total:</span>
            <span>KSh {calculateTotal()}</span>
          </div>
        </div>

        <button onClick={handleSubmitOrder} className="place-order-btn">
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default OrderCreation;
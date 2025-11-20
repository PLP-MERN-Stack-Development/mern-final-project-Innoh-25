import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, patientAddresses, addPatientAddress } = useAuth();
  const { orderData } = location.state || {};
  const [orderType, setOrderType] = useState('pickup');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddress, setNewAddress] = useState({
    label: 'home',
    address: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderData) {
      navigate('/patient/search');
    }
  }, [orderData, navigate]);

  if (!orderData || !user) {
    return (
      <div className="checkout-container">
        <div className="error-state">
          <h2>No order data available</h2>
          <button onClick={() => navigate('/patient/search')} className="btn btn-primary">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const { drug, pharmacy, price, quantity = 1 } = orderData;
  const subtotal = price * quantity;
  const deliveryFee = orderType === 'delivery' ? (parseFloat(orderData.distance) < 5 ? 100 : 200) : 0;
  const total = subtotal + deliveryFee;

  const handleAddAddress = async () => {
    if (!newAddress.address.trim() || !newAddress.city.trim()) {
      setError('Please fill in all address fields');
      return;
    }

    try {
      await addPatientAddress(newAddress);
      setNewAddress({ label: 'home', address: '', city: '' });
      setError('');
    } catch (err) {
      setError('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && !selectedAddress && patientAddresses.length === 0) {
      setError('Please add a delivery address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        patient: user.id,
        pharmacy: pharmacy._id,
        items: [{
          drug: drug._id,
          quantity: quantity,
          price: price
        }],
        totalAmount: subtotal,
        finalAmount: total,
        deliveryOption: orderType,
        deliveryAddress: orderType === 'delivery' ? selectedAddress : undefined,
        paymentMethod: 'mpesa' // Default for now
      };

      const response = await axios.post('http://localhost:5000/api/orders', orderPayload);
      
      if (response.data.success) {
        navigate('/patient/orders', { 
          state: { 
            message: 'Order placed successfully!',
            orderId: response.data.data._id
          } 
        });
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <h1>Checkout</h1>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-item">
            <strong>Drug:</strong> {drug.name}
          </div>
          <div className="summary-item">
            <strong>Pharmacy:</strong> {pharmacy.businessName}
          </div>
          <div className="summary-item">
            <strong>Quantity:</strong> {quantity}
          </div>
          <div className="summary-item">
            <strong>Unit Price:</strong> KSh {price}
          </div>
          <div className="summary-item">
            <strong>Subtotal:</strong> KSh {subtotal}
          </div>
          {orderType === 'delivery' && (
            <div className="summary-item">
              <strong>Delivery Fee:</strong> KSh {deliveryFee}
            </div>
          )}
          <div className="summary-total">
            <strong>Total:</strong> KSh {total}
          </div>
        </div>

        {/* Delivery Options */}
        <div className="delivery-options">
          <h2>Delivery Option</h2>
          <div className="option-buttons">
            <button
              className={`option-btn ${orderType === 'pickup' ? 'active' : ''}`}
              onClick={() => setOrderType('pickup')}
            >
              🏪 Pickup
              <small>Ready in 30 minutes</small>
            </button>
            <button
              className={`option-btn ${orderType === 'delivery' ? 'active' : ''}`}
              onClick={() => setOrderType('delivery')}
            >
              🚚 Delivery
              <small>KSh {deliveryFee} • {orderData.distance < 5 ? 'Same day' : 'Next day'}</small>
            </button>
          </div>
        </div>

        {/* Delivery Address */}
        {orderType === 'delivery' && (
          <div className="address-section">
            <h2>Delivery Address</h2>
            
            {patientAddresses.length > 0 && (
              <div className="saved-addresses">
                <label>Select Address:</label>
                {patientAddresses.map((address) => (
                  <div key={address._id} className="address-option">
                    <input
                      type="radio"
                      id={address._id}
                      name="address"
                      checked={selectedAddress === address._id}
                      onChange={() => setSelectedAddress(address._id)}
                    />
                    <label htmlFor={address._id}>
                      <strong>{address.label}</strong>: {address.address}, {address.city}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Address */}
            <div className="new-address">
              <h3>Add New Address</h3>
              <div className="address-form">
                <select
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Street Address"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                />
                <button onClick={handleAddAddress} className="btn btn-secondary">
                  Add Address
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="payment-section">
          <h2>Payment Method</h2>
          <div className="payment-options">
            <div className="payment-option active">
              <span>📱 M-Pesa</span>
              <small>Pay via M-Pesa</small>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="checkout-actions">
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            ← Back
          </button>
          <button 
            onClick={handlePlaceOrder}
            disabled={loading || (orderType === 'delivery' && !selectedAddress && patientAddresses.length > 0)}
            className="btn btn-primary"
          >
            {loading ? 'Placing Order...' : `Place Order - KSh ${total}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
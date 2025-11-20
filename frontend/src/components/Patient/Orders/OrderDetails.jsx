import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/Patient.css';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getPatientOrderDetails, cancelPatientOrder } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const response = await getPatientOrderDetails(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
    setLoading(false);
  };

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelPatientOrder(orderId, 'Changed my mind');
        // Refresh order details
        loadOrderDetails();
      } catch (error) {
        console.error('Failed to cancel order:', error);
        alert('Failed to cancel order: ' + error.message);
      }
    }
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { status: 'pending', label: 'Order Placed' },
      { status: 'confirmed', label: 'Confirmed' },
      { status: 'processing', label: 'Processing' },
      { status: 'ready_for_pickup', label: 'Ready for Pickup' },
      { status: 'out_for_delivery', label: 'Out for Delivery' },
      { status: 'delivered', label: 'Delivered' }
    ];

    const currentIndex = steps.findIndex(step => step.status === currentStatus);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="order-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-not-found">
        <h2>Order Not Found</h2>
        <p>The order you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/patient/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  const statusSteps = getStatusSteps(order.status);

  return (
    <div className="order-details">
      <div className="order-details-header">
        <button 
          onClick={() => navigate('/patient/orders')}
          className="back-button"
        >
          ← Back to Orders
        </button>
        <h1>Order #{order.orderNumber}</h1>
        <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Order Status Timeline */}
      <div className="order-timeline">
        <h3>Order Status</h3>
        <div className="timeline-steps">
          {statusSteps.map((step, index) => (
            <div key={step.status} className="timeline-step">
              <div className={`step-indicator ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
                {step.completed ? '✓' : index + 1}
              </div>
              <div className="step-label">{step.label}</div>
              {index < statusSteps.length - 1 && (
                <div className={`step-connector ${step.completed ? 'completed' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="order-details-grid">
        {/* Order Items */}
        <div className="order-section">
          <h3>Order Items</h3>
          <div className="order-items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item-detail">
                <div className="item-info">
                  <h4>{item.drug?.name}</h4>
                  <p>{item.drug?.description}</p>
                  <small>Quantity: {item.quantity}</small>
                </div>
                <div className="item-pricing">
                  <div className="item-price">
                    KSh {item.price?.toFixed(2)} each
                  </div>
                  <div className="item-total">
                    KSh {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-section">
          <h3>Order Summary</h3>
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>KSh {order.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Discount:</span>
              <span>- KSh {order.discountAmount?.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>KSh {order.finalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pharmacy Information */}
        <div className="order-section">
          <h3>Pharmacy Information</h3>
          <div className="pharmacy-details">
            <strong>{order.pharmacy?.businessName}</strong>
            <p>{order.pharmacy?.address}</p>
            <p>Phone: {order.pharmacy?.phone}</p>
            {order.pharmacy?.email && <p>Email: {order.pharmacy?.email}</p>}
          </div>
        </div>

        {/* Delivery Information */}
        <div className="order-section">
          <h3>Delivery Information</h3>
          <div className="delivery-details">
            <p><strong>Delivery Option:</strong> {order.deliveryOption}</p>
            {order.deliveryOption === 'delivery' && order.deliveryAddress && (
              <div className="delivery-address">
                <strong>Delivery Address:</strong>
                <p>{order.deliveryAddress.address}</p>
                <p>{order.deliveryAddress.city}</p>
              </div>
            )}
            {order.estimatedDelivery && (
              <p>
                <strong>Estimated Delivery:</strong>{' '}
                {new Date(order.estimatedDelivery).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order Actions */}
      <div className="order-actions-section">
        {(order.status === 'pending' || order.status === 'confirmed') && (
          <button 
            onClick={handleCancelOrder}
            className="btn btn-danger"
          >
            Cancel Order
          </button>
        )}
        
        {order.status === 'delivered' && !order.rating && (
          <button className="btn btn-primary">
            Rate & Review Order
          </button>
        )}
      </div>

      {/* Patient Notes */}
      {order.patientNotes && (
        <div className="order-section">
          <h3>Your Notes</h3>
          <p>{order.patientNotes}</p>
        </div>
      )}

      {/* Pharmacy Notes */}
      {order.pharmacyNotes && (
        <div className="order-section">
          <h3>Pharmacy Notes</h3>
          <p>{order.pharmacyNotes}</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
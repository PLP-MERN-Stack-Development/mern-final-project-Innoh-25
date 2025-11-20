import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom';
import '../../../styles/Patient.css';

const OrdersList = () => {
  const { patientOrders, getPatientOrders, cancelPatientOrder } = useAuth();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      await getPatientOrders({ status: filter === 'all' ? '' : filter });
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
    setLoading(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelPatientOrder(orderId, 'Changed my mind');
        // Orders will be updated via context
      } catch (error) {
        console.error('Failed to cancel order:', error);
        alert('Failed to cancel order: ' + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'orange',
      confirmed: 'blue',
      processing: 'purple',
      ready_for_pickup: 'green',
      out_for_delivery: 'teal',
      delivered: 'green',
      cancelled: 'red',
      refunded: 'gray'
    };
    return statusColors[status] || 'gray';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="orders-list">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track and manage your medication orders</p>
      </div>

      <div className="orders-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Orders
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'processing' ? 'active' : ''}
          onClick={() => setFilter('processing')}
        >
          Processing
        </button>
        <button 
          className={filter === 'delivered' ? 'active' : ''}
          onClick={() => setFilter('delivered')}
        >
          Delivered
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : (
        <div className="orders-container">
          {patientOrders && patientOrders.length > 0 ? (
            <div className="orders-grid">
              {patientOrders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.orderNumber}</h3>
                      <span className="order-date">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="order-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="pharmacy-info">
                      <strong>{order.pharmacy?.businessName}</strong>
                      <span>{order.pharmacy?.address}</span>
                    </div>
                    
                    <div className="order-items">
                      {order.items?.map((item, index) => (
                        <div key={index} className="order-item">
                          <span className="item-name">
                            {item.drug?.name} 
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </span>
                          <span className="item-price">
                            KSh {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-total">
                      <strong>Total: KSh {order.finalAmount?.toFixed(2)}</strong>
                    </div>

                    {order.deliveryOption === 'delivery' && order.deliveryAddress && (
                      <div className="delivery-info">
                        <small>
                          🚚 Delivery to: {order.deliveryAddress.address}, {order.deliveryAddress.city}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="order-actions">
                    <Link 
                      to={`/patient/orders/${order._id}`}
                      className="btn btn-outline btn-sm"
                    >
                      View Details
                    </Link>
                    
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button 
                        className="btn btn-outline btn-sm btn-danger"
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        Cancel Order
                      </button>
                    )}
                    
                    {order.status === 'delivered' && (
                      <button className="btn btn-outline btn-sm">
                        Rate Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-orders">
              <div className="empty-icon">📦</div>
              <h3>No orders found</h3>
              <p>
                {filter === 'all' 
                  ? "You haven't placed any orders yet."
                  : `No ${filter} orders found.`
                }
              </p>
              <Link to="/patient/search" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
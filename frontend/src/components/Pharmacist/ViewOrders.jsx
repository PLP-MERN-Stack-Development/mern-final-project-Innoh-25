import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/Pharmacist.css';

const ViewOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/orders/pharmacy-orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus
      });
      alert('Order status updated successfully!');
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'ready_for_pickup': return 'status-ready';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Order Management</h1>
        <div className="filter-tabs">
          {['all', 'pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-content">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p>No orders found</p>
            <p className="empty-state-subtitle">
              {filter !== 'all' ? `No ${filter} orders` : 'You have no orders yet'}
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.orderNumber}</h3>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="order-meta">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="order-amount">
                      KSh {order.finalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="customer-info">
                    <h4>Customer</h4>
                    <p>
                      {order.patient?.firstName} {order.patient?.lastName}
                    </p>
                    {order.patient?.phone && <p>📞 {order.patient.phone}</p>}
                  </div>

                  <div className="order-items">
                    <h4>Items ({order.items?.length || 0})</h4>
                    <div className="items-list">
                      {order.items?.map((item, index) => (
                        <div key={index} className="order-item">
                          <span className="item-name">{item.drug?.name}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                          <span className="item-price">KSh {item.price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="order-actions">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order._id, 'confirmed')}
                        className="btn btn-primary btn-sm"
                      >
                        Confirm Order
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'ready_for_pickup')}
                      className="btn btn-success btn-sm"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                  
                  {order.status === 'ready_for_pickup' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'completed')}
                      className="btn btn-success btn-sm"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOrders;
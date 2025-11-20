import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const RecentOrders = () => {
  const { patientOrders } = useAuth();

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      ready_for_pickup: '#10b981',
      delivered: '#059669',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (!patientOrders || patientOrders.length === 0) {
    return (
      <div className="recent-orders empty">
        <p>No recent orders</p>
        <Link to="/patient/search" className="btn btn-primary btn-sm">
          Place Your First Order
        </Link>
      </div>
    );
  }

  return (
    <div className="recent-orders">
      {patientOrders.slice(0, 3).map((order) => (
        <div key={order._id} className="order-preview">
          <div className="order-preview-header">
            <span className="order-number">#{order.orderNumber}</span>
            <span 
              className="order-status"
              style={{ color: getStatusColor(order.status) }}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="order-preview-details">
            <span className="order-total">KSh {order.finalAmount?.toFixed(2)}</span>
            <span className="order-date">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
      {patientOrders.length > 3 && (
        <div className="view-all-orders">
          <Link to="/patient/orders" className="view-all-link">
            View all orders ({patientOrders.length})
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/Patient.css';

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  // Mock notifications - replace with actual API calls
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'order',
        title: 'Order Confirmed',
        message: 'Your order #ORD-123456 has been confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        orderId: '123'
      },
      {
        id: 2,
        type: 'promotion',
        title: 'Special Offer',
        message: 'Get 20% off on pain relief medications this week',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true
      },
      {
        id: 3,
        type: 'system',
        title: 'Welcome to PharmaPin',
        message: 'Thank you for joining PharmaPin! Start exploring medications near you.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const getNotificationIcon = (type) => {
    const icons = {
      order: '📦',
      promotion: '🎁',
      system: 'ℹ️',
      alert: '⚠️'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="notifications-list">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn btn-outline btn-sm">
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="notifications-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button 
          className={filter === 'order' ? 'active' : ''}
          onClick={() => setFilter('order')}
        >
          Orders
        </button>
        <button 
          className={filter === 'promotion' ? 'active' : ''}
          onClick={() => setFilter('promotion')}
        >
          Promotions
        </button>
      </div>

      <div className="notifications-container">
        {filteredNotifications.length > 0 ? (
          <div className="notifications-grid">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <span className="notification-time">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="notification-message">
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-notifications">
            <div className="empty-icon">🔔</div>
            <h3>No notifications</h3>
            <p>
              {filter === 'unread' 
                ? "You're all caught up!"
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
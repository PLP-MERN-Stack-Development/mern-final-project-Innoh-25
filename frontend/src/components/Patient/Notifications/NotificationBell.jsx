import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/Patient.css';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Mock notifications data - replace with actual API calls
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
    setUnreadCount(mockNotifications.filter(notif => !notif.read).length);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    // Mark all as read when opening (optional)
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Handle navigation based on notification type
    if (notification.type === 'order' && notification.orderId) {
      // Navigate to order details
      window.location.href = `/patient/orders/${notification.orderId}`;
    }
    
    setIsOpen(false);
  };

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

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`notification-bell ${isOpen ? 'active' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="unread-dot"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <div className="empty-icon">🔔</div>
                <p>No notifications</p>
                <span>You're all caught up!</span>
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="notifications-footer">
              <a href="/patient/notifications" className="view-all-link">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
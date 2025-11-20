import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import NotificationBell from '../../Patient/Notifications/NotificationBell';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSearch = (searchTerm) => {
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          PharmaPin
        </Link>

        <nav className="navbar-nav">
          <Link to="/patient/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/patient/search" className="nav-link">Search Medications</Link>
          <Link to="/patient/help" className="nav-link">Help</Link>
          
          {user ? (
            <>
              <NotificationBell />
              <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/patient/profile" className="nav-link">
                  👤 Profile
                </Link>
                <Link 
                  to="/login"
                  style={{ 
                    background: 'var(--accent-color)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    textDecorationLine: 'none',
                    borderRadius:'var(--border-radius)'
                  }}
                >
                  Logout
                </Link>
              </div>
            </>
          ) : (
            <div className="auth-buttons" style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
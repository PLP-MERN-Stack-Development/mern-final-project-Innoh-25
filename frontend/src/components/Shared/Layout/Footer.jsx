import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      background: 'var(--text-dark)',
      color: 'white',
      padding: '2rem 0',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>PharmaPin</h3>
            <p>Your trusted partner in healthcare access. Connecting patients with pharmacies for seamless medication delivery.</p>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/search" style={{ color: 'white', textDecoration: 'none' }}>Search Medications</Link>
              <Link to="/patient/help" style={{ color: 'white', textDecoration: 'none' }}>Help & Support</Link>
              <Link to="/patient/orders" style={{ color: 'white', textDecoration: 'none' }}>Order History</Link>
            </div>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Contact</h4>
            <p>Email: support@pharmapin.com</p>
            <p>Phone: +254 700 123 456</p>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '1rem',
          textAlign: 'center',
          color: 'var(--text-light)'
        }}>
          <p>&copy; 2024 PharmaPin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home">
      <div className="container">
        <h1>Welcome to PharmaPin</h1>
        <p>Your trusted platform for connecting with pharmacies and accessing medications.</p>
        
        {/* Auth Buttons Section */}
        <div className="auth-buttons" style={{ 
          marginBottom: '3rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          alignItems:'center',
          // flexWrap: 'wrap',
          width:'50%',
          marginLeft:'25%'

        }}>
          <Link 
            to="/register" 
            className="btn btn-primary"
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1.1rem',
              textDecoration: 'none',
              display: 'inline-block',
              position:'relative',
              width:'100%'
            }}
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="btn"
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1.1rem',
              textDecoration: 'none',
              display: 'inline-block',
              position:'relative',
              width:'100%',
              background: 'white',
              border: '2px solid var(--primary-color)',
              color: 'var(--primary-color)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'var(--primary-color)';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = 'var(--primary-color)';
            }}
          >
            Login
          </Link>
        </div>

        <div className="features">
          <div className="feature-card">
            <h3>Find Medications</h3>
            <p>Search for drugs across multiple pharmacies</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Availability</h3>
            <p>Check stock levels in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
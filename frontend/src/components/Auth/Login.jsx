import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Sending login request to:', 'http://localhost:5000/api/auth/login');
      
      // Use the login function from AuthContext
      const result = await login(email, password);
      const user = result.user;
      
      console.log('LOGIN SUCCESS:', user);
      
      // Handle redirection based on user role
      if (user.role === 'pharmacist') {
        // For pharmacists, check their pharmacy status and redirect accordingly
        await handlePharmacistRedirect(user.token);
      } else if (user.role === 'patient') {
        navigate('/patient/dashboard');
      } else {
        navigate('/');
      }
      
    } catch (error) {
      console.log('LOGIN ERROR DETAILS:');
      console.log('- Error message:', error.message);
      console.log('- Response status:', error.response?.status);
      console.log('- Response data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Login failed';
      alert(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle pharmacist redirection based on pharmacy status
  const handlePharmacistRedirect = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/pharmacy-onboarding/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { hasPharmacy, status } = response.data;
      console.log('Pharmacy Status:', { hasPharmacy, status });
      
      if (!hasPharmacy) {
        // No pharmacy profile exists - redirect to onboarding
        navigate('/pharmacist/onboarding');
      } else if (status === 'pending_approval') {
        // Pharmacy profile submitted but pending approval
        navigate('/pharmacist/pending-approval');
      } else if (status === 'rejected') {
        // Pharmacy was rejected - send the pharmacist to the Rejected page
        navigate('/pharmacist/rejected');
      } else if (status === 'approved') {
        // Pharmacy approved - redirect to dashboard
        navigate('/pharmacist/dashboard');
      } else if (status === 'draft') {
        // Pharmacy exists but still in draft - redirect to onboarding to complete
        navigate('/pharmacist/onboarding');
      } else {
        // Default fallback
        navigate('/pharmacist/onboarding');
      }
    } catch (error) {
      console.error('Error checking pharmacy status:', error);
      // If we can't check status, send to onboarding
      navigate('/pharmacist/onboarding');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        border:'none',
        borderRadius:'var(--border-radius)',
        backgroundColor:'var(--gray-light)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          PharmaPin
        </h1>
      </div>
        <h2>Login to Your Account</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={onChange}
                required
                className="password-input"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                <FontAwesomeIcon style={{color:'var(--primary-dark)'}} icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Sending admin login request...');
      const response = await axios.post('http://localhost:5000/api/admin/auth/login', formData);
      console.log('Admin login response:', response.data);
      
      if (response.data.success) {
        console.log('Login successful, storing token and redirecting...');
        
        // Store admin data properly
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        console.log('Stored user:', response.data.data.user);
        console.log('Navigating to /admin/dashboard');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.response?.data?.message || 'Admin access denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>🔒 Admin Access</h1>
          <p>Restricted Administrative Panel</p>
        </div>

        {error && <div className="admin-error-message">{error}</div>}

        <form onSubmit={onSubmit} className="admin-login-form">
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Admin Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="adminKey"
              placeholder="Security Key"
              value={formData.adminKey}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? '🔐 Accessing...' : 'Enter Admin Panel'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>⚠️ Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
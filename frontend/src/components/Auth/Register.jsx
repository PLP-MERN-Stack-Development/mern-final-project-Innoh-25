import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    strength: 'Weak'
  });
  const [emailError, setEmailError] = useState('');

  const { firstName, lastName, username, email, phone, password, confirmPassword, role } = formData;

  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation - only allow digits and limit to 10
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: digitsOnly });
      return;
    }

    // Clear email error when user types
    if (name === 'email') {
      setEmailError('');
    }

    setFormData({ ...formData, [name]: value });

    // Check password strength in real-time
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('at least 8 characters');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('one lowercase letter');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('one uppercase letter');

    // Number check
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('one number');

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    else feedback.push('one special character');

    // Determine strength level
    let strength = 'Weak';
    if (score >= 4) strength = 'Strong';
    else if (score >= 3) strength = 'Medium';

    setPasswordStrength({
      score,
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'All requirements met!',
      strength
    });
  };

  // Check if email is already taken
  const checkEmailAvailability = async (email) => {
    if (!email) return;
    
    try {
      // We'll implement this API endpoint in backend
      const response = await axios.get(`http://localhost:5000/api/auth/check-email?email=${email}`);
      if (!response.data.available) {
        setEmailError('This email is already registered');
      }
    } catch (error) {
      console.log('Email check error:', error);
    }
  };

  // Check if passwords match
  const passwordsMatch = password === confirmPassword;
  const isPasswordStrong = passwordStrength.score >= 4;
  const isPhoneValid = phone.length === 10;
  const canSubmit = passwordsMatch && isPasswordStrong && firstName && lastName && username && email && isPhoneValid && !emailError;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const onSubmit = async (e) => {
  e.preventDefault();
  
  if (!passwordsMatch) {
    alert('Passwords do not match!');
    return;
  }

  if (!isPasswordStrong) {
    alert('Password is not strong enough!');
    return;
  }

  if (!isPhoneValid) {
    alert('Please enter a valid 10-digit phone number');
    return;
  }

  if (emailError) {
    alert('Please fix the email error before submitting');
    return;
  }

  try {
    console.log('Sending registration request to:', 'http://localhost:5000/api/auth/register');
    
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      firstName,
      lastName,
      username,
      email,
      phone,
      password,
      role
    });
    
    console.log('SUCCESS:', response.data);
    
    // Show success message and redirect to login
    alert('🎉 Registration successful! Redirecting to login...');
    
    // Redirect to login page after successful registration
    navigate('/login');
    
  } catch (error) {
    console.log('ERROR DETAILS:');
    console.log('- Error message:', error.message);
    console.log('- Response status:', error.response?.status);
    console.log('- Response data:', error.response?.data);
    
    if (error.response?.data?.message?.includes('email') || error.response?.data?.message?.includes('Email')) {
      setEmailError('This email is already registered');
    }
    
    if (error.response?.data?.message?.includes('username') || error.response?.data?.message?.includes('Username')) {
      alert('Username is already taken. Please choose another one.');
    }
    
    const errorMessage = error.response?.data?.message || 'Registration failed';
    alert(`Registration failed: ${errorMessage}`);
  }
};

  // Password strength color
  const getStrengthColor = () => {
    switch (passwordStrength.strength) {
      case 'Weak': return '#ff4444';
      case 'Medium': return '#ffaa00';
      case 'Strong': return '#00c851';
      default: return '#ff4444';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Create Your Account</h2>
        <form onSubmit={onSubmit}>
          {/* First Name and Last Name in one row */}
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={firstName}
                onChange={onChange}
                required
                placeholder="Enter your first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={onChange}
                required
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={onChange}
              required
              placeholder="Choose a username"
            />
          </div>

          {/* Email with availability check */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              onBlur={() => checkEmailAvailability(email)}
              required
              placeholder="Enter your email"
              className={emailError ? 'error' : ''}
            />
            {emailError && <div className="error-message">{emailError}</div>}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={onChange}
              required
              placeholder="10-digit number"
              maxLength="10"
              pattern="[0-9]{10}"
            />
            <div className="phone-hint">
              {phone.length}/10 digits {isPhoneValid && '✓'}
            </div>
          </div>

          {/* Password Field with Toggle INSIDE */}
          <div className="form-group">
            <label>Password *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={onChange}
                required
                minLength="8"
                placeholder="Enter your password"
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                <FontAwesomeIcon style={{color:'var(--primary-dark)'}} icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            
            {/* Password Strength Meter */}
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getStrengthColor()
                    }}
                  ></div>
                </div>
                <div className="strength-info">
                  <span style={{ color: getStrengthColor() }}>
                    Strength: {passwordStrength.strength}
                  </span>
                  <span className="strength-feedback">
                    {passwordStrength.feedback}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field with Toggle INSIDE */}
          <div className="form-group">
            <label>Confirm Password *</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                required
                minLength="8"
                placeholder="Confirm your password"
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
              >
                <FontAwesomeIcon style={{color:'var(--primary-dark)'}} icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {confirmPassword && (
              <div className="password-match">
                {passwordsMatch ? (
                  <span style={{ color: '#00c851' }}>✓ Passwords match</span>
                ) : (
                  <span style={{ color: '#ff4444' }}>✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select name="role" value={role} onChange={onChange}>
              <option value="patient">Patient</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!canSubmit}
          >
            Create Account
          </button>

          {/* Password Requirements */}
          <div className="password-requirements">
            <h4>Password Requirements:</h4>
            <ul>
              <li>✓ At least 8 characters long</li>
              <li>✓ One uppercase letter (A-Z)</li>
              <li>✓ One lowercase letter (a-z)</li>
              <li>✓ One number (0-9)</li>
              <li>✓ One special character (!@#$%^&*)</li>
            </ul>
          </div>
        </form>
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Base URL for API calls
const API_BASE_URL = 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const [patientProfile, setPatientProfile] = useState(null);
  const [patientAddresses, setPatientAddresses] = useState([]);

  // Set auth token for all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/me`);
          // Ensure we use the fetched user object consistently
          const userData = response.data.data;
          setUser(userData);

          // Load patient-specific data if user is a patient
          if (userData?.role === 'patient') {
            await loadPatientData();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Remove invalid/expired token from storage and state
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Check pharmacy status for pharmacists
  const checkPharmacyStatus = async (userToken = token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pharmacy-onboarding/status`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Pharmacy status check failed:', error);
      return { hasPharmacy: false, status: 'no_pharmacy' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { data } = response.data;
      setUser(data);
      setToken(data.token);

      // Load patient data if user is a patient
      if (data.role === 'patient') {
        await loadPatientData();
      }

      // Check pharmacy status for pharmacists
      if (data.role === 'pharmacist') {
        const pharmacyStatus = await checkPharmacyStatus(data.token);
        return { user: data, pharmacyStatus };
      }

      return { user: data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      const { data } = response.data;
      setUser(data);
      setToken(data.token);

      // Initialize patient profile if user is a patient
      if (data.role === 'patient') {
        await initializePatientProfile(data.id);
        await loadPatientData();
      }

      // For pharmacists, we'll handle redirection after registration
      if (data.role === 'pharmacist') {
        return { user: data, requiresOnboarding: true };
      }

      return { user: data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    setPatientProfile(null);
    setPatientAddresses([]);
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  // Patient-specific methods

  const loadPatientData = async () => {
    try {
      // Only try to load patient data if user is a patient
      if (user?.role !== 'patient') return;

      try {
        // Load patient profile
        const profileResponse = await axios.get(`${API_BASE_URL}/patients/profile`);
        setPatientProfile(profileResponse.data.data);
      } catch (profileError) {
        console.log('Patient profile endpoint not ready yet');
      }

      try {
        // Load patient addresses
        const addressesResponse = await axios.get(`${API_BASE_URL}/patients/addresses`);
        setPatientAddresses(addressesResponse.data.data);
      } catch (addressError) {
        console.log('Patient addresses endpoint not ready yet');
      }

      // Order loading removed while ordering feature is disabled

    } catch (error) {
      console.log('Patient data loading in progress');
    }
  };

  const initializePatientProfile = async (userId) => {
    try {
      // Just create an empty patient profile
      await axios.post(`${API_BASE_URL}/patients/profile`, {
        userId
      });
    } catch (error) {
      console.log('Patient profile initialization in progress');
    }
  };

  // Patient profile management
  const updatePatientProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/patients/profile`, profileData);
      setPatientProfile(response.data.data);
      return { success: true, data: response.data.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  // Address management
  const addPatientAddress = async (addressData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/patients/addresses`, addressData);
      setPatientAddresses(prev => [...prev, response.data.data]);
      return { success: true, data: response.data.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add address');
    }
  };

  const updatePatientAddress = async (addressId, addressData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/patients/addresses/${addressId}`, addressData);
      setPatientAddresses(prev => 
        prev.map(addr => addr._id === addressId ? response.data.data : addr)
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update address');
    }
  };

  const deletePatientAddress = async (addressId) => {
    try {
      await axios.delete(`${API_BASE_URL}/patients/addresses/${addressId}`);
      setPatientAddresses(prev => prev.filter(addr => addr._id !== addressId));
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/patients/addresses/${addressId}/set-default`);
      setPatientAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          isDefault: addr._id === addressId
        }))
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to set default address');
    }
  };

  // Order management removed while ordering feature is disabled

  // Favorite pharmacies
  const getFavoritePharmacies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients/favorites/pharmacies`);
      return { success: true, data: response.data.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch favorite pharmacies');
    }
  };

  const toggleFavoritePharmacy = async (pharmacyId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/patients/favorites/pharmacies/${pharmacyId}/toggle`);
      return { success: true, data: response.data.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to toggle favorite pharmacy');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    checkPharmacyStatus,
    // Patient-specific values and methods
    patientProfile,
    patientAddresses,
    updatePatientProfile,
    addPatientAddress,
    updatePatientAddress,
    deletePatientAddress,
    setDefaultAddress,
    getFavoritePharmacies,
    toggleFavoritePharmacy,
    loadPatientData 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;
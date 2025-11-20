import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PharmacistLayout = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'pharmacist') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

export default PharmacistLayout;
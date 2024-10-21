import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { pb } from '../../config';

const ProtectedRoute = () => {
  const isAuthenticated = pb.authStore.isValid;

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default ProtectedRoute;
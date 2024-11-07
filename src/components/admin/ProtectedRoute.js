import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { pb } from '../../config';

const ProtectedRoute = () => {
  const location = useLocation();
  const isAuthenticated = pb.authStore.isValid;

  // Handle authentication check first
  if (!isAuthenticated) {
    // Redirect to login instead of /admin to prevent redirect loop
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If authenticated and at /admin, redirect to dashboard
  if (location.pathname === '/admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Authenticated and not at /admin, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;
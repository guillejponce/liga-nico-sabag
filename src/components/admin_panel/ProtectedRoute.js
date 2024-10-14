import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/auth/useAuth';

const ProtectedRoute = () => {
  const { user, isAdmin } = useAuth();

  if (user === undefined) {
    // Still loading, you might want to show a loading spinner here
    return <div>Loading...</div>;
  }

  if (!user || !isAdmin) {
    // User is not logged in or is not an admin, redirect to login
    return <Navigate to="/login" replace />;
  }

  // User is logged in and is an admin, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
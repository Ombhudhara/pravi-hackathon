import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate
      to="/login"
      state={{ from: location, message: 'Sign in to open this page.' }}
      replace
    />;
  }

  return <Outlet />;
}

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

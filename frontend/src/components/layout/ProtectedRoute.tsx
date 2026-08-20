import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../ui/LoadingState';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <LoadingState message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const TeacherRouteGuard: React.FC = () => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <LoadingState message="Checking permissions..." />
      </div>
    );
  }

  // Allow either Teacher or Admin roles
  const isAuthorized = hasRole('teacher') || hasRole('admin');

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const InstituteAdminRouteGuard: React.FC = () => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <LoadingState message="Checking permissions..." />
      </div>
    );
  }

  // Strict check for InstituteAdmin role
  const isAuthorized = hasRole('InstituteAdmin');

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

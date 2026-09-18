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

export const PlatformAdminRouteGuard: React.FC = () => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <LoadingState message="Checking admin privileges..." />
      </div>
    );
  }

  const isAuthorized = hasRole('admin') || hasRole('PlatformAdmin');

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const TeacherRouteGuard: React.FC = () => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <LoadingState message="Checking teacher permissions..." />
      </div>
    );
  }

  const isAuthorized =
    hasRole('teacher') ||
    hasRole('admin') ||
    hasRole('InstituteAdmin') ||
    hasRole('platformadmin');

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
        <LoadingState message="Checking institute admin permissions..." />
      </div>
    );
  }

  const isAuthorized = hasRole('InstituteAdmin') || hasRole('admin') || hasRole('teacher');

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const StudentRouteGuard: React.FC = () => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <LoadingState message="Checking student access..." />
      </div>
    );
  }

  const isAuthorized =
    hasRole('student') ||
    hasRole('admin') ||
    hasRole('InstituteAdmin') ||
    hasRole('platformadmin');

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

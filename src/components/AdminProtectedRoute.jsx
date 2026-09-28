import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, checkAuthStatus } = useAdminAuth();
  const location = useLocation();
  const hasStoredToken = !!localStorage.getItem('adminToken');

  useEffect(() => {
    if (!isAuthenticated && hasStoredToken && !loading) {
      checkAuthStatus();
    }
  }, [isAuthenticated, hasStoredToken, loading, checkAuthStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (hasStoredToken) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Finalizing sign in...</p>
          </div>
        </div>
      );
    }
    const isClientRoute = location.pathname.startsWith('/client/');
    return <Navigate to={isClientRoute ? '/login?portal=org' : '/login'} state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
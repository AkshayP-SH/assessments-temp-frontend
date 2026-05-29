import { Navigate } from 'react-router-dom';
import { useClientAuth } from '../contexts/ClientAuthContext';

const ClientProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useClientAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-shnoor-lavender">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-shnoor-indigo border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/client/login" replace />;
};

export default ClientProtectedRoute;

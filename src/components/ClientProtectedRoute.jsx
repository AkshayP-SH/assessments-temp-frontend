import { Navigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '../contexts/ClientAuthContext';

const ClientProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, clientUser } = useClientAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-shnoor-lavender">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-shnoor-indigo border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?portal=org" replace />;
  }

  // Check if payment is required and user is not on subscription plans page
  const requiresPayment = clientUser?.requiresPayment || clientUser?.clientStatus === 'awaiting_payment';
  const isOnSubscriptionPage = location.pathname === '/client/subscription-plans' || location.pathname === '/client/checkout';
  
  if (requiresPayment && !isOnSubscriptionPage) {
    return <Navigate to="/client/subscription-plans" replace state={{ 
      requiresPayment: true,
      subscriptionExpired: clientUser?.subscriptionExpired
    }} />;
  }

  return children;
};

export default ClientProtectedRoute;

/**
 * ClientLogin — redirects to the unified login page with the Organisation tab pre-selected.
 * Kept for backward compatibility with any old bookmarks or direct links.
 */
import { Navigate } from 'react-router-dom';

const ClientLogin = () => <Navigate to="/login?portal=org" replace />;

export default ClientLogin;

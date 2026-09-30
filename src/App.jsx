import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, useEffect } from 'react';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ClientProtectedRoute from './components/ClientProtectedRoute';
import GlobalThemeSelector from './components/GlobalThemeSelector';
import { applyTheme, getSavedTheme } from './utils/theme';
import UpgradeRequiredModal from './components/UpgradeRequiredModal';
import { Toaster } from 'react-hot-toast';

// Eagerly load Loading Spinner to show while chunks are fetched
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-shnoor-lavender">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-shnoor-indigo border-t-transparent"></div>
  </div>
);

import LandingPage from './pages/LandingPage';
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const ForgotPassword = React.lazy(() => import('./components/ForgotPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Instructions = React.lazy(() => import('./pages/Instructions'));
const TestScreen = React.lazy(() => import('./pages/TestScreen'));
const Result = React.lazy(() => import('./pages/Results'));
const Feedback = React.lazy(() => import('./pages/Feedback'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const LiveProctoring = React.lazy(() => import('./pages/admin/LiveProctoring'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminJobApplicants = React.lazy(() => import('./components/admin/AdminJobApplicants'));
const InterviewsList = React.lazy(() => import('./pages/admin/InterviewsList'));
const StudentMessages = React.lazy(() => import('./pages/admin/StudentMessages'));
const InterviewRoom = React.lazy(() => import('./pages/InterviewRoom'));
const ServerDown = React.lazy(() => import('./pages/ServerDown'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const JobBoard = React.lazy(() => import('./pages/JobBoard'));
const MyApplications = React.lazy(() => import('./pages/MyApplications'));

// Client portal (multi-tenant)
const AdminClients = React.lazy(() => import('./pages/admin/AdminClients'));
const OrganisationSignup = React.lazy(() => import('./pages/OrganisationSignup'));
const ClientSubscriptionPlans = React.lazy(() => import('./pages/client/ClientSubscriptionPlans'));
const ClientPayment = React.lazy(() => import('./pages/client/ClientPayment'));

// Protected Route wrappers
const StudentRoute = ({ children }) => {
  const token = localStorage.getItem('studentAuthToken');
  return token ? children : <Navigate to="/login" replace />;
};

const TestRoute = ({ children }) => {
  const token = localStorage.getItem('studentAuthToken');
  const testId = localStorage.getItem('selectedTestId');
  if (!token) return <Navigate to="/login" replace />;
  if (!testId) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [quotaInfo, setQuotaInfo] = React.useState(null);

  useEffect(() => {
    applyTheme(getSavedTheme());

    const handleQuotaExceeded = (e) => {
      setQuotaInfo(e.detail);
      setShowUpgradeModal(true);
    };

    window.addEventListener('quota_exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('quota_exceeded', handleQuotaExceeded);
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <GlobalThemeSelector />
      <UpgradeRequiredModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        quotaInfo={quotaInfo}
      />
      <Routes>
        {/* Public Routes — each group has its own Suspense so a failure in one
            section doesn't block the rest of the app from rendering */}
        <Route path="/" element={
          <ErrorBoundary>
            <LandingPage />
          </ErrorBoundary>
        } />
        <Route path="/privacy-policy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms-and-conditions" element={<Suspense fallback={<LoadingFallback />}><TermsAndConditions /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><Login /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<LoadingFallback />}><Register /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<LoadingFallback />}><ForgotPassword /></Suspense>} />
        <Route path="/register-organisation" element={<Suspense fallback={<LoadingFallback />}><OrganisationSignup /></Suspense>} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/server-down" element={<Suspense fallback={<LoadingFallback />}><ServerDown /></Suspense>} />
        <Route path="/maintenance" element={<Suspense fallback={<LoadingFallback />}><Maintenance /></Suspense>} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<StudentRoute><Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense></StudentRoute>} />
        <Route path="/instructions" element={<TestRoute><Suspense fallback={<LoadingFallback />}><Instructions /></Suspense></TestRoute>} />
        <Route path="/test" element={<TestRoute><Suspense fallback={<LoadingFallback />}><TestScreen /></Suspense></TestRoute>} />
        <Route path="/result" element={<StudentRoute><Suspense fallback={<LoadingFallback />}><Result /></Suspense></StudentRoute>} />
        <Route path="/feedback" element={<StudentRoute><Suspense fallback={<LoadingFallback />}><Feedback /></Suspense></StudentRoute>} />
        <Route path="/job-board" element={<StudentRoute><Suspense fallback={<LoadingFallback />}><JobBoard /></Suspense></StudentRoute>} />
        <Route path="/student/my-applications" element={<StudentRoute><Suspense fallback={<LoadingFallback />}><MyApplications /></Suspense></StudentRoute>} />
        <Route path="/interview-room/:interviewId" element={<StudentRoute><Suspense fallback={<LoadingFallback />}><InterviewRoom /></Suspense></StudentRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/reports" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminReports /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/live-proctoring" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><LiveProctoring /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/student-messages" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><StudentMessages /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/settings" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminSettings /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/job-applicants/:jobId" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminJobApplicants /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/interviews" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><InterviewsList /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/interview-room/:interviewId" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><InterviewRoom /></Suspense></AdminProtectedRoute>} />
        <Route path="/admin/clients" element={<AdminProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminClients /></Suspense></AdminProtectedRoute>} />

        {/* Client Portal Routes (multi-tenant, admin UI parity) */}
        <Route path="/client/login" element={<Navigate to="/login?portal=org" replace />} />
        <Route path="/client/subscription-plans" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><ClientSubscriptionPlans /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/payment" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><ClientPayment /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/dashboard" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/reports" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminReports /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/live-proctoring" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><LiveProctoring /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/student-messages" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><StudentMessages /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/settings" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminSettings /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/job-applicants/:jobId" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminJobApplicants /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/interviews" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><InterviewsList /></Suspense></ClientProtectedRoute>} />
        <Route path="/client/interview-room/:interviewId" element={<ClientProtectedRoute><Suspense fallback={<LoadingFallback />}><InterviewRoom /></Suspense></ClientProtectedRoute>} />
        <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />

        {/* Default */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <ClientAuthProvider>
          <Router>
            {/* Per-route Suspense boundaries are defined inside AppRoutes */}
            <AppRoutes />
          </Router>
        </ClientAuthProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}

export default App;

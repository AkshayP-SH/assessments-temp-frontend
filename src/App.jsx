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
import LandingPage from './pages/LandingPage';

// Eagerly load Loading Spinner to show while chunks are fetched
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-shnoor-lavender">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-shnoor-indigo border-t-transparent"></div>
  </div>
);

// Lazy loaded routes
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
  useEffect(() => {
    applyTheme(getSavedTheme());
  }, []);

  return (
    <>
      <GlobalThemeSelector />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register-organisation" element={<OrganisationSignup />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/server-down" element={<ServerDown />} />
        <Route path="/maintenance" element={<Maintenance />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<StudentRoute><Dashboard /></StudentRoute>} />
        <Route path="/instructions" element={<TestRoute><Instructions /></TestRoute>} />
        <Route path="/test" element={<TestRoute><TestScreen /></TestRoute>} />
        <Route path="/result" element={<StudentRoute><Result /></StudentRoute>} />
        <Route path="/feedback" element={<StudentRoute><Feedback /></StudentRoute>} />
        <Route path="/job-board" element={<StudentRoute><JobBoard /></StudentRoute>} />
        <Route path="/student/my-applications" element={<StudentRoute><MyApplications /></StudentRoute>} />

        {/* Admin Routes - Now with Enhanced Protection */}
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReports /></AdminProtectedRoute>} />
        <Route path="/admin/live-proctoring" element={<AdminProtectedRoute><LiveProctoring /></AdminProtectedRoute>} />
        <Route path="/admin/student-messages" element={<AdminProtectedRoute><StudentMessages /></AdminProtectedRoute>} />
        <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
        <Route path="/admin/job-applicants/:jobId" element={<AdminProtectedRoute><AdminJobApplicants /></AdminProtectedRoute>} />
        <Route path="/admin/interviews" element={<AdminProtectedRoute><InterviewsList /></AdminProtectedRoute>} />
        <Route path="/admin/interview-room/:interviewId" element={<AdminProtectedRoute><InterviewRoom /></AdminProtectedRoute>} />
        <Route path="/admin/clients" element={<AdminProtectedRoute><AdminClients /></AdminProtectedRoute>} />

        {/* Client Portal Routes (multi-tenant, admin UI parity) */}
        {/* /client/login redirects to unified login with org tab pre-selected */}
        <Route path="/client/login" element={<Navigate to="/login?portal=org" replace />} />
        <Route path="/client/dashboard" element={<ClientProtectedRoute><AdminDashboard /></ClientProtectedRoute>} />
        <Route path="/client/reports" element={<ClientProtectedRoute><AdminReports /></ClientProtectedRoute>} />
        <Route path="/client/live-proctoring" element={<ClientProtectedRoute><LiveProctoring /></ClientProtectedRoute>} />
        <Route path="/client/student-messages" element={<ClientProtectedRoute><StudentMessages /></ClientProtectedRoute>} />
        <Route path="/client/settings" element={<ClientProtectedRoute><AdminSettings /></ClientProtectedRoute>} />
        <Route path="/client/job-applicants/:jobId" element={<ClientProtectedRoute><AdminJobApplicants /></ClientProtectedRoute>} />
        <Route path="/client/interviews" element={<ClientProtectedRoute><InterviewsList /></ClientProtectedRoute>} />
        <Route path="/client/interview-room/:interviewId" element={<ClientProtectedRoute><InterviewRoom /></ClientProtectedRoute>} />
        <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />

        {/* Student Interview Route */}
        <Route path="/interview-room/:interviewId" element={<StudentRoute><InterviewRoom /></StudentRoute>} />

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
            <Suspense fallback={<LoadingFallback />}>
              <AppRoutes />
            </Suspense>
          </Router>
        </ClientAuthProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}

export default App;

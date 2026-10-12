import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../config/api';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useClientAuth } from '../contexts/ClientAuthContext';
import Button from './Button';
import InputField from './InputField';
import ThemeSelector from './ThemeSelector';
import shnoorLogo from '../assets/shnoor-logo.png';
import { useSEO } from '../hooks/useSEO';

// ── Icons ──────────────────────────────────────────────────────────────────
const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const StudentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const OrgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// ── Left panel features ────────────────────────────────────────────────────
const STUDENT_FEATURES = [
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Secure Proctored Exams' },
  { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', label: 'Live Camera Monitoring' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Auto-Save & Timer' },
  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Instant Results & Reports' },
];

const ORG_FEATURES = [
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Manage Candidates' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Analytics & Reports' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Live Proctoring Dashboard' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Schedule & Assign Tests' },
];

// ── Portal Tab Switcher ────────────────────────────────────────────────────
const PortalTabs = ({ active, onChange }) => (
  <div className="flex rounded-xl bg-theme-panel p-1.5 mb-8 gap-1.5 relative z-10 border border-theme-border/50 shadow-xs perspective-1000">
    <button
      type="button"
      onClick={() => onChange('student')}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer btn-action-gesture ${
        active === 'student'
          ? 'bg-theme-card text-theme-text shadow-sm card-3d-subtle scale-[1.01]'
          : 'text-theme-muted hover:text-theme-text hover:bg-theme-card/40'
      }`}
    >
      <span className="icon-gesture"><StudentIcon /></span>
      <span>Student / Candidate</span>
    </button>
    <button
      type="button"
      onClick={() => onChange('org')}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer btn-action-gesture ${
        active === 'org'
          ? 'bg-theme-card text-theme-text shadow-sm card-3d-subtle scale-[1.01]'
          : 'text-theme-muted hover:text-theme-text hover:bg-theme-card/40'
      }`}
    >
      <span className="icon-gesture"><OrgIcon /></span>
      <span>Organisation</span>
    </button>
  </div>
);

// ── Main Login Component ───────────────────────────────────────────────────
const Login = () => {
  useSEO({
    title: "Sign In - SHNOOR Assessments",
    description: "Sign in to access your assessments"
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { setAdminSession } = useAdminAuth();
  const { login: clientLogin } = useClientAuth();

  // Determine initial portal from query param or location state
  const searchParams = new URLSearchParams(location.search);
  const initialPortal = searchParams.get('portal') === 'org' || location.state?.portal === 'org'
    ? 'org'
    : 'student';

  const [portal, setPortal] = useState(initialPortal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const submitLockRef = useRef(false);

  // Reset form when switching portals
  const handlePortalChange = (next) => {
    setPortal(next);
    setEmail('');
    setPassword('');
    setErrors({});
    setApiError('');
    setSuccessMessage('');
  };

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Organisation / Client login handler ───────────────────────────────────
  const handleOrgSubmit = async () => {
    if (isLoading || submitLockRef.current) return;
    submitLockRef.current = true;
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) {
      submitLockRef.current = false;
      return;
    }

    setIsLoading(true);
    try {
      // Try super-admin login first (admins can log in from org tab too)
      const adminResponse = await apiFetch('api/admin/login', {
        method: 'POST',
        skipGlobalErrorRedirect: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const adminData = await adminResponse.json();
      if (adminResponse.ok && adminData.success) {
        setAdminSession(adminData.admin, adminData.token);
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // Fall through to client login
      const result = await clientLogin(email.trim(), password);
      if (result.success) {
        // Check if payment is required (awaiting_payment status)
        if (result.user?.requiresPayment || result.user?.clientStatus === 'awaiting_payment') {
          navigate('/client/subscription-plans', { replace: true, state: { requiresPayment: true } });
        } else {
          navigate('/client/dashboard', { replace: true });
        }
      } else {
        setApiError(result.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Org login error:', error);
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        setApiError('Cannot connect to the server. Please ensure the backend is running.');
      } else {
        setApiError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  // ── Student login handler ──────────────────────────────────────────────────
  const handleStudentSubmit = async () => {
    if (isLoading || submitLockRef.current) return;
    submitLockRef.current = true;
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) {
      submitLockRef.current = false;
      return;
    }

    setIsLoading(true);
    try {
      // Try admin login first (admin can also log in from student tab)
      try {
        const adminResponse = await apiFetch('api/admin/login', {
          method: 'POST',
          skipGlobalErrorRedirect: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const adminData = await adminResponse.json();
        if (adminResponse.ok && adminData.success) {
          setAdminSession(adminData.admin, adminData.token);
          navigate('/admin/dashboard', { replace: true });
          return;
        }
      } catch { /* not admin, continue */ }

      // Firebase student login
      const { auth, signInWithEmailAndPassword } = await import('../config/firebase');
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();

      const response = await apiFetch('api/login', {
        method: 'POST',
        skipGlobalErrorRedirect: true,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          email: email.trim(),
          firebase_uid: userCredential.user.uid
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      const { user, token, role } = data;
      if (!user || !token || !role) throw new Error('Session data incomplete');

      if (role === 'admin') {
        setAdminSession(user, token);
        navigate('/admin/dashboard', { replace: true });
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.setItem('studentAuthToken', token);
        localStorage.setItem('studentId', user.id.toString());
        localStorage.setItem('studentFirebaseUid', user.firebase_uid || '');
        localStorage.setItem('studentName', user.full_name || '');
        localStorage.setItem('rollNumber', user.roll_number || '');
        localStorage.setItem('email', user.email || '');
        localStorage.setItem('institute', user.institute || '');
        localStorage.setItem('clientId', user.client_id ? user.client_id.toString() : '');
        navigate('/dashboard', { replace: true, state: { studentId: user.id, studentName: user.full_name } });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.name === 'AbortError') {
        setApiError('Server is waking up. Please wait a moment and try again.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setApiError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setApiError('Invalid email address format.');
      } else if (error.code === 'auth/too-many-requests') {
        setApiError('Too many failed login attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        setApiError('Network error connecting to authentication service. Please check your internet connection.');
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.name === 'TypeError' || error.message?.includes('fetch')) {
        setApiError('Cannot connect to the server. Please ensure the backend is running.');
      } else if (error.message?.includes('Failed to fetch dynamically imported module') || error.message?.includes('Loading chunk')) {
        setApiError('Loading issue detected. Please refresh the page and try again.');
      } else {
        setApiError(error.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
      submitLockRef.current = false;
    }
  };

  const handleSubmit = () => portal === 'org' ? handleOrgSubmit() : handleStudentSubmit();
  const features = portal === 'org' ? ORG_FEATURES : STUDENT_FEATURES;

  return (
    <main className="h-screen w-full flex flex-col lg:flex-row font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden bg-theme-page">
      {/* 3-second floating popup alert (doesn't stick to the form) */}
      {successMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-emerald-900/20 text-xs sm:text-sm font-semibold animate-entry-3d border border-emerald-400/40 backdrop-blur-md max-w-[90vw] text-center">
          <svg className="w-4 h-4 flex-shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="ml-2 text-white/80 hover:text-white cursor-pointer text-xs"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
        <ThemeSelector variant="light" />
      </div>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="auth-left-panel hidden lg:flex lg:w-[45%] flex-col justify-between h-full bg-shnoor-navy px-12 xl:px-16 py-12 relative overflow-hidden">
        {/* Floating Ambient 3D Glow Orbs */}
        <div className="auth-glow-orb auth-glow-orb-primary w-96 h-96 -top-24 -left-24 pointer-events-none" />
        <div className="auth-glow-orb auth-glow-orb-secondary w-80 h-80 bottom-8 -right-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="site-header-logo flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md p-1.5 flex-shrink-0 card-3d-lift shimmer-hover hover:scale-105 transition-all duration-300">
              <img src={shnoorLogo} alt="Shnoor" className="h-full w-full object-contain" width="40" height="40" loading="eager" fetchPriority="high" />
            </div>
            <div>
              <p className="font-extrabold text-white text-base tracking-wide uppercase leading-tight">SHNOOR Assessments</p>
              <p className="auth-brand-subtitle text-[10px] font-bold uppercase tracking-widest mt-0.5">Secure Examination Portal</p>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] tracking-tight mb-4">
            {portal === 'org' ? (
              <>Welcome back to<br /><span className="auth-hero-accent">your organisation</span></>
            ) : (
              <>Welcome back to<br /><span className="auth-hero-accent">your portal</span></>
            )}
          </h2>
          <p className="auth-left-muted text-sm xl:text-base leading-relaxed mb-10 max-w-md">
            {portal === 'org'
              ? 'Sign in to manage your assessments, monitor candidates, and access detailed reports.'
              : 'Sign in to access your assigned assessments, track your progress, and complete recruitment tests.'}
          </p>

          <div className="flex flex-col gap-3">
            {features.map(f => (
              <div
                key={f.label}
                className="flex items-center gap-4 p-2.5 -mx-2.5 rounded-xl transition-all duration-200 card-3d-subtle hover:bg-white/[0.08] border border-transparent hover:border-white/10 group cursor-default transform-style-3d"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 icon-gesture group-hover:scale-110 group-hover:bg-white/15 transition-all shadow-xs">
                  <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <span className="text-sm text-white/90 font-medium tracking-wide group-hover:text-white transition-colors">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-6 mt-12 card-3d-subtle hover:bg-white/[0.04] p-3 -mx-3 rounded-xl transition-all duration-200">
          <p className="auth-bottom-copy text-xs italic leading-relaxed">
            "These measures ensure a fair and secure assessment process for all candidates."
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <div className="auth-right-panel flex-1 flex flex-col items-center justify-start bg-theme-card px-6 sm:px-10 pt-20 pb-12 sm:pt-24 sm:pb-16 h-full overflow-y-auto relative">
        {/* Soft Ambient Background Orbs */}
        <div className="auth-glow-orb auth-glow-orb-primary w-80 h-80 -top-24 -right-24 pointer-events-none opacity-20" />
        <div className="auth-glow-orb auth-glow-orb-secondary w-72 h-72 bottom-12 -left-20 pointer-events-none opacity-15" />

        <div className="w-full max-w-[440px] relative z-10 animate-entry-3d perspective-1000 my-auto">
          {/* Mobile brand */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="site-header-logo flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs p-1 flex-shrink-0 card-3d-lift shimmer-hover hover:scale-105 transition-transform">
              <img src={shnoorLogo} alt="Shnoor" loading="lazy" className="h-full w-full object-contain" width="40" height="40" decoding="async" />
            </div>
            <div>
              <p className="font-extrabold text-theme-text text-xl tracking-tight">SHNOOR</p>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold">Assessments</p>
            </div>
          </div>

          {/* Back to home */}
          <div className="mb-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-theme-muted hover:text-theme-accent transition-colors group cursor-pointer nav-gesture-item"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1.5" />
              <span>Back to home</span>
            </Link>
          </div>

          {/* Portal switcher tabs */}
          <PortalTabs active={portal} onChange={handlePortalChange} />

          {/* Heading */}
          <div className="mb-6 text-left">
            <h1 className="text-3xl font-extrabold text-theme-text mb-1.5 tracking-tight">Sign In</h1>
            <p className="text-sm text-theme-muted font-normal">
              {portal === 'org' ? 'Access your organisation dashboard' : 'Enter your credentials'}
            </p>
          </div>

          {/* Alerts */}
          {apiError && (
            <div className="mb-5 flex items-start gap-3 bg-shnoor-dangerLight border border-shnoor-danger/30 text-shnoor-danger rounded-xl px-4 py-3 text-sm modal-3d-entrance shadow-xs">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 animate-pulse-subtle" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }}
            noValidate
            className="flex flex-col gap-5"
          >
            <div className="auth-field-gesture">
              <InputField
                label="Email Address"
                id="email"
                type="email"
                placeholder={portal === 'org' ? 'admin@yourcompany.com' : 'Enter your email'}
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); setApiError(''); }}
                disabled={isLoading}
                autoComplete="username"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('password')?.focus(); } }}
              />
              {errors.email && <p className="text-xs text-shnoor-danger mt-1">{errors.email}</p>}
            </div>

            <div className="relative auth-field-gesture">
              <InputField
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); setApiError(''); }}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[37px] text-theme-muted hover:text-theme-text transition-all p-1 bg-transparent cursor-pointer hover:scale-110 active:scale-90 icon-gesture"
                tabIndex={-1}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
              {errors.password && <p className="text-xs text-shnoor-danger mt-1">{errors.password}</p>}
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-xs font-medium text-theme-accent hover:text-theme-accent2 hover:underline transition-colors inline-block hover:translate-x-0.5">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] bg-theme-accent hover:bg-theme-accent2 text-white text-base font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 mt-2 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer btn-action-gesture shimmer-hover"
            >
              {isLoading && <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin mr-2" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-theme-border/50">
            {portal === 'student' ? (
              <p className="text-center text-sm text-theme-muted">
                New candidate?{' '}
                <Link to="/register" className="text-theme-accent font-bold hover:underline transition-colors">
                  Register for examination
                </Link>
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-sm text-theme-muted">
                  Looking to take a test?{' '}
                  <button type="button" onClick={() => handlePortalChange('student')} className="text-theme-accent font-bold hover:underline transition-colors cursor-pointer">
                    Student Login
                  </button>
                </p>
                <p className="text-center text-sm text-theme-muted">
                  New organisation?{' '}
                  <Link to="/register-organisation" className="text-theme-accent font-bold hover:underline transition-colors">
                    Register your organisation
                  </Link>
                </p>
              </div>
            )}
            <p className="text-center text-xs text-shnoor-indigoMedium mt-4 flex items-center justify-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              Secure, proctored examination environment
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  <div className="flex rounded-xl border border-shnoor-mist bg-shnoor-lavender p-1 mb-8 gap-1">
    <button
      type="button"
      onClick={() => onChange('student')}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active === 'student'
          ? 'bg-white text-shnoor-navy shadow-sm'
          : 'text-shnoor-indigoMedium hover:text-shnoor-navy'
      }`}
    >
      <StudentIcon />
      Student / Candidate
    </button>
    <button
      type="button"
      onClick={() => onChange('org')}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
        active === 'org'
          ? 'bg-white text-shnoor-navy shadow-sm'
          : 'text-shnoor-indigoMedium hover:text-shnoor-navy'
      }`}
    >
      <OrgIcon />
      Organisation
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
    } catch (err) {
      setApiError('Login failed. Please check your credentials.');
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
      } catch (_) { /* not admin, continue */ }

      // Firebase student login
      const { auth, signInWithEmailAndPassword } = await import('../config/firebase');
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();

      const response = await apiFetch('api/login', {
        method: 'POST',
        skipGlobalErrorRedirect: true,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
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
    <main className="min-h-[100dvh] w-full flex flex-col lg:flex-row font-['Plus_Jakarta_Sans',sans-serif] relative">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
        <ThemeSelector variant="light" />
      </div>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="auth-left-panel hidden lg:flex lg:w-[45%] flex-col justify-between bg-shnoor-navy px-14 py-12 relative overflow-hidden">
        <div className="absolute top-[-60px] left-[-60px] w-72 h-72 rounded-full bg-shnoor-indigo opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-40px] right-[-40px] w-56 h-56 rounded-full bg-[#6868AC] opacity-15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="site-header-logo flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img src={shnoorLogo} alt="Shnoor" className="h-11 w-11 object-contain" width="44" height="44" loading="eager" fetchPriority="high" />
            </div>
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">SHNOOR Assessments</p>
              <p className="auth-brand-subtitle text-[11px] uppercase tracking-widest font-semibold">Secure Examination Portal</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
            {portal === 'org' ? (
              <>Welcome back to<br /><span className="auth-hero-accent">your organisation</span></>
            ) : (
              <>Welcome back to<br /><span className="auth-hero-accent">your portal</span></>
            )}
          </h2>
          <p className="auth-left-muted text-sm leading-relaxed mb-10">
            {portal === 'org'
              ? 'Sign in to manage your assessments, monitor candidates, and access detailed reports.'
              : 'Sign in to access your assigned assessments, track your progress, and complete recruitment tests.'}
          </p>

          <div className="flex flex-col gap-5">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="auth-feature-icon-shell w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="auth-feature-icon w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <span className="auth-feature-text text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-bottom-divider relative z-10 border-t pt-6">
          <p className="auth-bottom-copy text-xs italic leading-relaxed">
            "These measures ensure a fair and secure assessment process for all candidates."
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <div className="auth-right-panel flex-1 flex items-center justify-center bg-white px-4 sm:px-6 py-6 sm:py-10 lg:py-12 min-h-[100dvh] lg:min-h-screen overflow-auto">
        <div className="w-full max-w-[440px]">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={shnoorLogo} alt="Shnoor" loading="lazy" className="h-9 w-9 object-contain" width="36" height="36" decoding="async" />
            <div>
              <p className="font-extrabold text-shnoor-navy text-base">SHNOOR Assessments</p>
              <p className="text-[10px] text-shnoor-indigoMedium uppercase tracking-widest">Secure Examination Portal</p>
            </div>
          </div>

          {/* Portal switcher tabs */}
          <PortalTabs active={portal} onChange={handlePortalChange} />

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-shnoor-navy mb-1">Sign In</h1>
            <p className="text-sm text-shnoor-indigoMedium">
              {portal === 'org' ? 'Access your organisation dashboard' : 'Enter your credentials'}
            </p>
          </div>

          {/* Alerts */}
          {successMessage && (
            <div className="mb-5 flex items-start gap-3 bg-shnoor-successLight border border-[rgb(var(--theme-border))] text-[rgb(var(--theme-text))] rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.97 4.97a.75.75 0 0 0-1.08-.022L6.477 9.417 4.384 7.323a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.137-.089l4-5.5a.75.75 0 0 0-.24-1.573z" />
              </svg>
              {successMessage}
            </div>
          )}

          {apiError && (
            <div className="mb-5 flex items-start gap-3 bg-shnoor-dangerLight border border-shnoor-dangerLight text-shnoor-danger rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }}
            noValidate
            className="flex flex-col gap-5"
          >
            <div>
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

            <div className="relative">
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
                className="absolute right-3 top-[37px] text-shnoor-indigoMedium hover:text-shnoor-navy transition-colors p-1"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff /> : <EyeOpen />}
              </button>
              {errors.password && <p className="text-xs text-shnoor-danger mt-1">{errors.password}</p>}
              <div className="text-right mt-1">
                <Link to="/forgot-password" className="text-xs text-shnoor-indigo hover:text-shnoor-navy transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full !h-[52px] text-base" disabled={isLoading}>
              {isLoading && <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-shnoor-lavender">
            {portal === 'student' ? (
              <p className="text-center text-sm text-shnoor-indigoMedium">
                New candidate?{' '}
                <Link to="/register" className="text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors">
                  Register for examination
                </Link>
              </p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-sm text-shnoor-indigoMedium">
                  Looking to take a test?{' '}
                  <button type="button" onClick={() => handlePortalChange('student')} className="text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors">
                    Student Login
                  </button>
                </p>
                <p className="text-center text-sm text-shnoor-indigoMedium">
                  New organisation?{' '}
                  <Link to="/register-organisation" className="text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors">
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

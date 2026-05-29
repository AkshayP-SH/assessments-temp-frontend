import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import shnoorLogo from '../../assets/shnoor-logo.png';

const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ClientLogin = () => {
  const navigate = useNavigate();
  const { login } = useClientAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/client/dashboard');
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-shnoor-lavender flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-shnoor-indigo to-shnoor-navy px-8 py-8 text-center">
            <img src={shnoorLogo} alt="Shnoor" className="h-10 mx-auto mb-4 brightness-0 invert" />
            <h1 className="text-xl font-bold text-white">Client Portal</h1>
            <p className="text-white/70 text-sm mt-1">Sign in to manage your organization</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@yourcompany.com"
                disabled={loading}
                autoComplete="email"
                className="w-full h-[50px] px-4 rounded-lg border border-shnoor-mist bg-white text-sm text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full h-[50px] px-4 pr-12 rounded-lg border border-shnoor-mist bg-white text-sm text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-shnoor-soft hover:text-shnoor-navy transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] bg-shnoor-indigo text-white rounded-lg text-sm font-semibold uppercase tracking-wider shadow-sm hover:bg-shnoor-navy hover:-translate-y-px hover:shadow-md active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 relative"
            >
              {loading ? (
                <div className="absolute top-1/2 left-1/2 -ml-2.5 -mt-2.5 w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>

            <p className="text-center text-xs text-shnoor-soft">
              Student?{' '}
              <Link to="/login" className="text-shnoor-indigo font-semibold hover:underline">
                Student Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;

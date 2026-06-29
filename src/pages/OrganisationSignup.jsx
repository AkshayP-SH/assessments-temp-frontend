import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import InputField from '../components/InputField';
import ThemeSelector from '../components/ThemeSelector';
import shnoorLogo from '../assets/shnoor-logo.png';
import { useSEO } from '../hooks/useSEO';

/* ─── Icon helpers ──────────────────────────────────────────────────────────── */
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

const OrganisationSignup = () => {
  useSEO({
    title: 'Register Organisation - SHNOOR Assessments',
    description: 'Create your organisation account on SHNOOR Assessments to streamline your technical hiring and proctoring.',
  });

  const [formData, setFormData] = useState({
    orgName: '',
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    // TODO: Connect this to the actual API backend when ready.
    // For now, simulate a network request.
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex font-['Plus_Jakarta_Sans',sans-serif] relative bg-white">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-[100]">
        <ThemeSelector variant="light" />
      </div>

      {/* ── LEFT PANEL ────────────────────────────────────── */}
      <div className="auth-left-panel hidden lg:flex lg:w-[38%] flex-col justify-between bg-shnoor-navy px-12 py-12 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full bg-shnoor-indigo opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-40px] w-60 h-60 rounded-full bg-[#6868AC] opacity-15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="site-header-logo flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img src={shnoorLogo} alt="Shnoor" className="h-11 w-11 object-contain" width="44" height="44" loading="eager" />
            </div>
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">SHNOOR Assessments</p>
              <p className="auth-brand-subtitle text-[11px] uppercase tracking-widest font-semibold text-white/70">Enterprise Portal</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Scale your <span className="auth-hero-accent text-shnoor-lavender">Hiring</span><br />with SHNOOR
          </h2>
          <p className="auth-left-muted text-sm text-white/70 leading-relaxed mb-10 max-w-sm">
            Create an organisation account to manage technical assessments, live proctoring, and comprehensive candidate reports all in one place.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Bulk Assessment Delivery</p>
                <p className="text-white/60 text-xs mt-1 leading-relaxed">Host technical drives with thousands of candidates seamlessly.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">AI-Powered Proctoring</p>
                <p className="text-white/60 text-xs mt-1 leading-relaxed">Ensure integrity with automated cheating detection and live video feeds.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12">
          <p className="auth-bottom-copy text-xs text-white/50">© {new Date().getFullYear()} SHNOOR International. All rights reserved.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────── */}
      <div className="auth-right-panel flex-1 bg-white flex items-center justify-center px-6 py-10 overflow-auto">
        <div className="w-full max-w-[440px]">
          
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={shnoorLogo} alt="Shnoor" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-extrabold text-shnoor-navy text-lg">SHNOOR Assessments</p>
              <p className="text-[10px] text-shnoor-soft uppercase tracking-widest font-bold">Enterprise Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-shnoor-navy mb-2 tracking-tight">Create Organisation</h1>
            <p className="text-sm text-shnoor-soft leading-relaxed">
              Register your organisation to start hosting intelligent technical assessments.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-shnoor-danger/10 border border-shnoor-danger/20 rounded-xl flex items-start gap-3 text-shnoor-danger">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-shnoor-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-shnoor-success" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-shnoor-navy mb-2">Registration Complete!</h2>
              <p className="text-shnoor-soft text-sm mb-8">
                Your organisation account has been successfully created. You can now log in to the admin portal.
              </p>
              <Link to="/login">
                <Button className="w-full h-[52px]">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Organisation Name"
                name="orgName"
                placeholder="e.g. Acme Corp"
                value={formData.orgName}
                onChange={handleChange}
                required
              />

              <InputField
                label="Work Email Address"
                name="email"
                type="email"
                placeholder="admin@organisation.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <div className="relative">
                <InputField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-shnoor-soft hover:text-shnoor-navy transition-colors focus:outline-none"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-[52px] shadow-lg shadow-shnoor-indigo/20 flex justify-center items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Creating Account...
                    </>
                  ) : 'Register Organisation'}
                </Button>
              </div>

              <p className="text-center text-sm text-shnoor-soft mt-6 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-shnoor-indigo hover:text-shnoor-navy font-bold hover:underline transition-all">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganisationSignup;

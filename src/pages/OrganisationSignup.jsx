import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import InputField from '../components/InputField';
import ThemeSelector from '../components/ThemeSelector';
import shnoorLogo from '../assets/shnoor-logo.png';
import { useSEO } from '../hooks/useSEO';
import { isBusinessEmail } from '../utils/emailValidation';
import { useTimer } from '../hooks/useTimer';

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
    companyWebsite: '',
    companySize: '',
    industry: '',
    country: '',
    useCase: '',
    phone: '',
    otp: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const { formattedTime } = useTimer(showOtp ? 60 : 0, () => { });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');

    if (name === 'email') {
      if (showOtp && value.trim().toLowerCase() !== formData.email.trim().toLowerCase()) {
        setShowOtp(false);
        setFormData(prev => ({ ...prev, email: value, otp: '' }));
      }
      if (value && !isBusinessEmail(value)) {
        setEmailError("Please use your organization's work email address.");
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgName || !formData.email || !formData.password) {
      setError('Please fill in required fields (Name, Email, Password).');
      return;
    }

    if (emailError) {
      setError('Please resolve the email error before submitting.');
      return;
    }

    if (formData.email.toLowerCase().includes('gmail')) {
      setError('Please use a valid company or organisation email. Gmail addresses are not allowed.');
      return;
    }

    if (!isBusinessEmail(formData.email)) {
      setError("Please use your organization's work email address.");
      setEmailError("Please use your organization's work email address.");
      return;
    }

    setLoading(true);

    try {
      if (!showOtp) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/signup/organisation/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, name: formData.orgName })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send OTP');
        if (data.devOtp) {
          setFormData(prev => ({ ...prev, otp: data.devOtp }));
        }
        setShowOtp(true);
      } else {
        if (!formData.otp) {
          setError('Please enter the verification code.');
          setLoading(false);
          return;
        }
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/signup/organisation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.orgName,
            company_name: formData.orgName,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            company_website: formData.companyWebsite,
            company_size: formData.companySize,
            industry: formData.industry,
            country: formData.country,
            use_case: formData.useCase,
            otp: formData.otp
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-['Plus_Jakarta_Sans',sans-serif] relative bg-white">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-[100]">
        <ThemeSelector variant="light" />
      </div>

      {/* ── LEFT PANEL ────────────────────────────────────── */}
      <div className="auth-left-panel hidden lg:flex lg:w-[38%] flex-col justify-between bg-shnoor-navy px-12 py-12 relative overflow-hidden">
        {/* Floating Ambient 3D Glow Orbs */}
        <div className="auth-glow-orb auth-glow-orb-primary w-96 h-96 -top-24 -left-24 pointer-events-none" />
        <div className="auth-glow-orb auth-glow-orb-secondary w-80 h-80 bottom-8 -right-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="site-header-logo flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md card-3d-lift shimmer-hover hover:scale-105 transition-all duration-300">
              <img src={shnoorLogo} alt="Shnoor" className="h-full w-full object-contain" width="44" height="44" loading="eager" />
            </div>
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">SHNOOR Assessments</p>
              <p className="auth-brand-subtitle text-[11px] uppercase tracking-widest font-semibold text-white/70">Enterprise Portal</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Scale your <span className="auth-hero-accent text-theme-auth-acc">Hiring</span><br />with SHNOOR
          </h2>
          <p className="auth-left-muted text-sm leading-relaxed mb-10 max-w-sm">
            Create an organisation account to manage technical assessments, live proctoring, and comprehensive candidate reports all in one place.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4 p-3 -mx-3 rounded-xl transition-all duration-200 card-3d-subtle hover:bg-white/[0.08] border border-transparent hover:border-white/10 group cursor-default transform-style-3d">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 icon-gesture group-hover:scale-110 group-hover:bg-white/15 transition-all shadow-xs">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm group-hover:text-white transition-colors">Bulk Assessment Delivery</p>
                <p className="auth-left-muted text-xs mt-1 leading-relaxed">Host technical drives with thousands of candidates seamlessly.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 -mx-3 rounded-xl transition-all duration-200 card-3d-subtle hover:bg-white/[0.08] border border-transparent hover:border-white/10 group cursor-default transform-style-3d">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 icon-gesture group-hover:scale-110 group-hover:bg-white/15 transition-all shadow-xs">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm group-hover:text-white transition-colors">AI-Powered Proctoring</p>
                <p className="auth-left-muted text-xs mt-1 leading-relaxed">Ensure integrity with automated cheating detection and live video feeds.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 card-3d-subtle hover:bg-white/[0.04] p-3 -mx-3 rounded-xl transition-all duration-200">
          <p className="auth-bottom-copy text-xs">© {new Date().getFullYear()} SHNOOR International. All rights reserved.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────── */}
      <div className="auth-right-panel flex-1 bg-white flex items-center justify-center px-6 py-10 overflow-auto relative">
        {/* Soft Ambient Background Orbs */}
        <div className="auth-glow-orb auth-glow-orb-primary w-80 h-80 -top-24 -right-24 pointer-events-none opacity-20" />
        <div className="auth-glow-orb auth-glow-orb-secondary w-72 h-72 bottom-12 -left-20 pointer-events-none opacity-15" />

        <div className="w-full max-w-[440px] relative z-10 animate-entry-3d perspective-1000">

          {/* Back navigation */}
          <div className="mb-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-shnoor-soft hover:text-shnoor-indigo transition-colors group cursor-pointer nav-gesture-item"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1.5" />
              <span>Back to home</span>
            </Link>
          </div>

          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="site-header-logo flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs p-1 flex-shrink-0 card-3d-lift shimmer-hover hover:scale-105 transition-transform">
              <img src={shnoorLogo} alt="Shnoor" className="h-full w-full object-contain" />
            </div>
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
            <div className="mb-6 p-4 bg-shnoor-danger/10 border border-shnoor-danger/20 rounded-xl flex items-start gap-3 text-shnoor-danger modal-3d-entrance shadow-xs">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8 card-3d-lift p-8 rounded-2xl border border-shnoor-mist/50 bg-white shadow-lg modal-3d-entrance">
              <div className="w-16 h-16 bg-shnoor-success/10 rounded-full flex items-center justify-center mx-auto mb-6 icon-gesture">
                <svg className="w-8 h-8 text-shnoor-success" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-shnoor-navy mb-2">Registration Complete!</h2>
              <p className="text-shnoor-soft text-sm mb-8">
                Your organisation account has been created. Please log in and complete payment to activate your account and access all features.
              </p>
              <Link to="/client/login">
                <Button className="w-full h-[52px] btn-action-gesture shimmer-hover">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="auth-field-gesture">
                  <InputField
                    label="Organisation Name"
                    name="orgName"
                    placeholder="e.g. Acme Corp"
                    value={formData.orgName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="auth-field-gesture">
                  <InputField
                    label="Work Email Address"
                    name="email"
                    type="email"
                    placeholder="admin@organisation.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {emailError && <p className="text-xs text-shnoor-danger mt-1">{emailError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="auth-field-gesture">
                  <InputField
                    label="Phone Number"
                    name="phone"
                    placeholder="+1 234 567 890"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="auth-field-gesture">
                  <InputField
                    label="Company Website"
                    name="companyWebsite"
                    placeholder="https://acme.com"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="auth-field-gesture">
                  <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Company Size</label>
                  <select name="companySize" value={formData.companySize} onChange={handleChange}
                    className="w-full h-[52px] px-4 rounded-xl border border-shnoor-mist bg-white text-sm focus:outline-none focus:border-shnoor-indigo focus:ring-2 focus:ring-shnoor-indigo/20 transition-all hover:border-shnoor-indigo/50">
                    <option value="">Select Size</option>
                    <option value="1-50">1-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
                <div className="auth-field-gesture">
                  <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Industry</label>
                  <select name="industry" value={formData.industry} onChange={handleChange}
                    className="w-full h-[52px] px-4 rounded-xl border border-shnoor-mist bg-white text-sm focus:outline-none focus:border-shnoor-indigo focus:ring-2 focus:ring-shnoor-indigo/20 transition-all hover:border-shnoor-indigo/50">
                    <option value="">Select Industry</option>
                    <option value="IT/Software">IT/Software</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="auth-field-gesture">
                  <InputField
                    label="Country"
                    name="country"
                    placeholder="e.g. United States"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
                <div className="auth-field-gesture">
                  <label className="block text-sm font-semibold text-shnoor-navy mb-1.5">Primary Use Case</label>
                  <select name="useCase" value={formData.useCase} onChange={handleChange}
                    className="w-full h-[52px] px-4 rounded-xl border border-shnoor-mist bg-white text-sm focus:outline-none focus:border-shnoor-indigo focus:ring-2 focus:ring-shnoor-indigo/20 transition-all hover:border-shnoor-indigo/50">
                    <option value="">Select Use Case</option>
                    <option value="Campus Hiring">Campus Hiring</option>
                    <option value="Lateral Hiring">Lateral Hiring</option>
                    <option value="Internal Assessment">Internal Assessment</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>

              <div className="relative auth-field-gesture">
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
                  className="absolute right-4 top-[38px] text-shnoor-soft hover:text-shnoor-navy transition-all hover:scale-110 active:scale-90 icon-gesture focus:outline-none"
                  tabIndex="-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              {showOtp && (
                <div className="pt-2 animate-entry-3d">
                  <div className="bg-shnoor-indigo/5 border border-shnoor-indigo/15 rounded-xl p-4 card-3d-subtle border-glow-hover">
                    <p className="text-sm text-shnoor-navy font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-shnoor-indigo animate-ping-slow" />
                      Verify your email
                    </p>
                    <p className="text-xs text-shnoor-soft mb-4">
                      We've sent a 6-digit verification code to <span className="font-semibold text-shnoor-navy">{formData.email}</span>
                    </p>
                    <InputField
                      label="Verification Code (OTP)"
                      name="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={formData.otp}
                      onChange={handleChange}
                      required
                    />
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-shnoor-soft font-mono">
                        Time remaining: {formattedTime}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          setLoading(true);
                          setError('');
                          try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/signup/organisation/send-otp`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: formData.email, name: formData.orgName })
                            });
                            const data = await res.json();
                            if (!res.ok || !data.success) throw new Error(data.message || 'Failed to resend OTP');
                            alert('OTP resent successfully!');
                          } catch (err) {
                            setError(err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="text-xs font-semibold text-shnoor-indigo hover:underline btn-action-gesture cursor-pointer"
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-[52px] shadow-lg shadow-shnoor-indigo/20 flex justify-center items-center gap-2 btn-action-gesture shimmer-hover"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      {showOtp ? 'Verifying...' : 'Sending OTP...'}
                    </>
                  ) : (showOtp ? 'Verify & Register' : 'Register Organisation')}
                </Button>
              </div>

              <p className="text-center text-sm text-shnoor-soft mt-6 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-shnoor-indigo hover:text-shnoor-navy font-bold hover:underline transition-all inline-block hover:scale-105">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div >
      </div >
    </div >
  );
};

export default OrganisationSignup;

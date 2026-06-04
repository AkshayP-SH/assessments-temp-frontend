import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../config/api';
import ThemeSelector from '../components/ThemeSelector';
import shnoorLogo from '../assets/shnoor-logo.png';

const TIERS = [
  { id: 'starter', label: 'Starter', desc: '3 institutes · 10 tests · 200 students', color: 'border-shnoor-mist' },
  { id: 'basic',   label: 'Basic',   desc: '10 institutes · 50 tests · 1,000 students', color: 'border-shnoor-indigo' },
  { id: 'pro',     label: 'Pro',     desc: '50 institutes · 200 tests · 5,000 students', color: 'border-purple-400' },
];

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const OrganisationSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', company_name: '', email: '', password: '', phone: '', tier: 'starter' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); setApiError(''); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name         = 'Organisation name is required';
    if (!form.company_name.trim()) e.company_name = 'Company name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required';
    if (form.password.length < 8)  e.password     = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiFetch('api/signup/organisation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setApiError(data.message || 'Signup failed. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-shnoor-lavender flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-shnoor-successLight flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-shnoor-success">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-shnoor-navy mb-2">Registration Submitted!</h1>
          <p className="text-sm text-shnoor-indigoMedium mb-6">
            Your organisation account is <strong>pending approval</strong>. Our team will review your request and activate your account within 1 business day. You'll receive an email once it's ready.
          </p>
          <Link to="/login?portal=org" className="inline-block bg-shnoor-indigo text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-shnoor-navy transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-shnoor-lavender flex items-center justify-center px-4 py-10 font-['Plus_Jakarta_Sans',sans-serif] relative">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10">
        <ThemeSelector variant="light" />
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 sm:p-10">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <img src={shnoorLogo} alt="Shnoor" className="h-10 w-10 object-contain rounded-xl" />
          <div>
            <p className="font-extrabold text-shnoor-navy text-base leading-tight">SHNOOR Assessments</p>
            <p className="text-[10px] text-shnoor-indigoMedium uppercase tracking-widest">Organisation Signup</p>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-shnoor-navy mb-1">Create your organisation</h1>
        <p className="text-sm text-shnoor-indigoMedium mb-7">Set up your assessment portal. Accounts require approval before activation.</p>

        {apiError && (
          <div className="mb-5 bg-shnoor-dangerLight text-shnoor-danger border border-shnoor-dangerLight rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z"/></svg>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Plan Selector */}
          <div>
            <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-2">Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map(t => (
                <button key={t.id} type="button" onClick={() => set('tier', t.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${form.tier === t.id ? 'border-shnoor-indigo bg-shnoor-lavender' : 'border-shnoor-mist hover:border-shnoor-indigoMedium'}`}>
                  <p className="text-xs font-bold text-shnoor-navy">{t.label}</p>
                  <p className="text-[10px] text-shnoor-indigoMedium mt-0.5 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          {[
            { key: 'name',         label: 'Organisation Name',  type: 'text',  placeholder: 'Acme Corp' },
            { key: 'company_name', label: 'Company / Display Name', type: 'text', placeholder: 'Acme Corporation Pvt Ltd' },
            { key: 'email',        label: 'Admin Email',        type: 'email', placeholder: 'admin@acme.com' },
            { key: 'phone',        label: 'Phone (optional)',   type: 'tel',   placeholder: '+91 98765 43210', optional: true },
          ].map(({ key, label, type, placeholder, optional }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">
                {label}{!optional && <span className="text-shnoor-danger ml-0.5">*</span>}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                className={`w-full h-[46px] px-4 rounded-lg border bg-white text-sm text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:ring-1 transition-colors ${errors[key] ? 'border-shnoor-danger focus:ring-shnoor-danger' : 'border-shnoor-mist focus:border-shnoor-indigo focus:ring-shnoor-indigo'}`}
              />
              {errors[key] && <p className="text-xs text-shnoor-danger mt-1">{errors[key]}</p>}
            </div>
          ))}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">
              Password <span className="text-shnoor-danger">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min 8 characters"
                disabled={loading}
                className={`w-full h-[46px] px-4 pr-11 rounded-lg border bg-white text-sm text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:ring-1 transition-colors ${errors.password ? 'border-shnoor-danger focus:ring-shnoor-danger' : 'border-shnoor-mist focus:border-shnoor-indigo focus:ring-shnoor-indigo'}`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-shnoor-soft hover:text-shnoor-navy p-1">
                {showPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-shnoor-danger mt-1">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full h-[48px] bg-shnoor-indigo text-white rounded-xl text-sm font-semibold hover:bg-shnoor-navy transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Creating account...' : 'Create Organisation Account'}
          </button>
        </form>

        <p className="text-center text-xs text-shnoor-indigoMedium mt-6">
          Already have an account?{' '}
          <Link to="/login?portal=org" className="text-shnoor-indigo font-semibold hover:text-shnoor-navy">Sign in</Link>
        </p>
      </div>
    </main>
  );
};

export default OrganisationSignup;

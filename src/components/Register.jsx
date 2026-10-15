import { formatDate } from '../utils/dateTime';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../config/api';
import Button from './Button';
import InputField from './InputField';
import ThemeSelector from './ThemeSelector';
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

const FieldError = ({ msg }) => msg ? (
  <p className="text-xs text-shnoor-danger mt-1.5 flex items-center gap-1.5">
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
    </svg>
    {msg}
  </p>
) : null;

/* ─── Step metadata — 4 steps ───────────────────────────────────────────────── */
const STEP_META = [
  {
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    title: 'Personal Info',
    desc: 'Name, roll number & contact details',
  },
  {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    title: 'Academic Details',
    desc: 'Course, institute & resume link',
  },
  {
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
    title: 'Account Setup',
    desc: 'Email address & secure password',
  },
  {
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    title: 'Review & Confirm',
    desc: 'Verify your details before submitting',
  },
];

const TOTAL_STEPS = STEP_META.length; // 4
/* ─── Reusable Review Row ────────────────────────────────────────────────────── */
const ReviewRow = ({ label, value, hidden }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-theme-border/40 last:border-0 gap-4">
    <span className="text-xs text-theme-muted font-medium flex-shrink-0 w-28">{label}</span>
    <span className={`text-sm text-theme-text font-semibold text-right leading-snug ${hidden ? 'tracking-widest' : ''}`}>
      {hidden ? '••••••••' : (value || <span className="text-theme-muted italic font-normal">Not provided</span>)}
    </span>
  </div>
);

/* ─── Resume Link Row with text display ────────────────────────────────────── */
const ResumeLinkRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-theme-border/40 last:border-0 gap-4">
    <span className="text-xs text-theme-muted font-medium flex-shrink-0 w-28">{label}</span>
    <span className="text-sm text-theme-text font-semibold text-right leading-snug">
      {value ? (
        <span className="text-xs break-all text-theme-text">
          {value.length > 40 ? value.slice(0, 40) + '…' : value}
        </span>
      ) : (
        <span className="text-theme-muted italic font-normal">Not provided</span>
      )}
    </span>
  </div>
);

/* ─── Review Section Card ────────────────────────────────────────────────────── */
const ReviewSection = ({ title, stepIndex, onEdit, children }) => (
  <div className="bg-theme-card border border-theme-border rounded-xl overflow-hidden shadow-xs card-3d-subtle hover:shadow-md transition-all duration-300 transform-style-3d border-glow-hover">
    <div className="flex items-center justify-between px-5 py-3 bg-theme-panel border-b border-theme-border">
      <p className="text-xs font-bold text-theme-text uppercase tracking-widest">{title}</p>
      <button
        type="button"
        onClick={() => onEdit(stepIndex)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-theme-accent hover:text-white bg-theme-accent/10 hover:bg-theme-accent border border-theme-accent/30 hover:border-theme-accent rounded-lg transition-all duration-150 group cursor-pointer btn-action-gesture"
      >
        <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110 icon-gesture" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span>Edit</span>
      </button>
    </div>
    <div className="px-5 py-1 bg-theme-card">{children}</div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const Register = () => {
  useSEO({
    title: "Create Account - SHNOOR Assessments",
    description: "Register as a student to access your assessments"
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientToken = searchParams.get('clientToken') || null;

  const [step, setStep] = useState(0);
  const [clientInfo, setClientInfo] = useState(null); // { name, company_name } if clientToken valid
  const [formData, setFormData] = useState({
    fullName: '', rollNumber: '', phone: '', address: '',
    institute: 'Others', course: '', specialization: '', resumeLink: '',
    email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [showInstituteDropdown, setShowInstituteDropdown] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        // If a clientToken is in the URL, validate it and filter institutes by client
        const url = clientToken
          ? `api/institutes/public?clientToken=${encodeURIComponent(clientToken)}`
          : 'api/institutes/public';
        const res = await apiFetch(url, { method: 'GET' });
        const data = await res.json();
        if (data.success && data.institutes) setInstitutes(data.institutes);
      } catch {
        // Public institute loading is optional for the initial render.
      }
    })();

    // Validate clientToken and fetch client info for display
    if (clientToken) {
      (async () => {
        try {
          const res = await apiFetch(
            `api/validate-client-token?token=${encodeURIComponent(clientToken)}`,
            { method: 'GET' }
          );
          const data = await res.json();
          if (data.success) {
            setClientInfo(data.client);
          }
        } catch {
          // Invalid client tokens are handled by the normal registration flow.
        }
      })();
    }
  }, [clientToken]);

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowInstituteDropdown(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setApiError('');

  };
  /* ── Per-step validation ─────────────────────────────────────────────── */
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!formData.fullName.trim()) e.fullName = 'Full name is required';
      else if (formData.fullName.length < 3) e.fullName = 'Name must be at least 3 characters';
      if (!formData.rollNumber.trim()) e.rollNumber = 'Roll number is required';
      else if (!/^[a-zA-Z0-9-]+$/.test(formData.rollNumber)) e.rollNumber = 'Alphanumeric and hyphens only';
      if (!formData.phone.trim()) e.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) e.phone = 'Enter a valid 10-digit number';
      if (!formData.address.trim()) e.address = 'Address is required';
    }
    if (s === 1) {
      if (!formData.institute.trim()) e.institute = 'Please select an institute';
      if (!formData.course.trim()) e.course = 'Course is required';
      if (!formData.specialization.trim()) e.specialization = 'Specialization is required';
      if (!formData.resumeLink.trim()) e.resumeLink = 'Resume link is required';
    }
    if (s === 2) {
      if (!formData.email.trim()) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email';
      if (!formData.password) e.password = 'Password is required';
      else if (formData.password.length < 8) e.password = 'Minimum 8 characters required';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
  };

  const goBack = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  /* Jump to a specific step to edit — called from Review page */
  const jumpToStep = (targetStep) => {
    setErrors({});
    setStep(targetStep);
  };

  const handleSubmit = async () => {
    setApiError('');

    setIsLoading(true);
    let firebaseUser = null;
    let registrationCompleted = false;

    try {
      const { createUserWithEmailAndPassword, auth } = await import('../config/firebase');
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      firebaseUser = userCredential.user;
      const idToken = await userCredential.user.getIdToken();

      const response = await apiFetch('api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          roll_number: formData.rollNumber.trim(),
          institute: formData.institute.trim().toLowerCase(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          course: formData.course.trim(),
          specialization: formData.specialization.trim(),
          resume_link: formData.resumeLink.trim(),
          // Pass clientToken so backend assigns client_id
          ...(clientToken ? { clientToken } : {}),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      registrationCompleted = true;
      navigate('/login', { state: { message: 'Registration successful. Please sign in to begin.' } });
    } catch (error) {
      if (firebaseUser && !registrationCompleted) {
        try {
          await firebaseUser.delete();
        } catch (deleteError) {
          console.error('[REGISTRATION] Failed to delete Firebase user after registration failure:', deleteError);
        }
      }
      // Handle Firebase-specific errors
      if (error.code === 'auth/email-already-in-use') {
        setApiError('This email is already registered. Please login instead.');
      } else if (error.code === 'auth/weak-password') {
        setApiError('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        setApiError('Invalid email address format.');
      } else if (error.message && (error.message.toLowerCase().includes('firebase') || error.message.toLowerCase().includes('not configured'))) {
        setApiError('Registration is currently unavailable. Please contact your administrator.');
      } else {
        // Backend or other errors
        setApiError(error.message || 'Unable to complete registration. Please try again.');
      }

      // Jump back to account step on error
      if (error.code || error.message) {
        setStep(2);
      }
    } finally {
      setIsLoading(false);
    }
  };
  /* ── renderStep — plain function, NOT inner component ────────────────── */
  const renderStep = () => {
    /* STEP 0 — Personal Info */
    if (step === 0) return (
      <div className="flex flex-col gap-5">
        <div>
          <InputField label="Full Name" type="text" name="fullName" placeholder="As per official records" required
            value={formData.fullName} onChange={handleChange} disabled={isLoading} autoComplete="name" />
          <FieldError msg={errors.fullName} />
        </div>
        <div>
          <InputField label="Student Roll Number" type="text" name="rollNumber" placeholder="e.g., 2024CS001" required
            value={formData.rollNumber} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <FieldError msg={errors.rollNumber} />
        </div>
        <div>
          <InputField label="Phone Number" type="tel" name="phone" placeholder="e.g., 9876543210" required
            value={formData.phone} onChange={handleChange} disabled={isLoading} autoComplete="tel" maxLength="10" />
          <FieldError msg={errors.phone} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-shnoor-navy mb-1.5 uppercase tracking-wide flex items-center gap-1 block">
            Address <span className="text-shnoor-danger">*</span>
          </label>
          <textarea name="address"
            className={`w-full h-[90px] px-4 py-3 rounded-lg border bg-white text-sm text-shnoor-navy placeholder-shnoor-soft transition-colors focus:outline-none focus:ring-1 resize-none
              ${errors.address ? 'border-shnoor-danger focus:ring-shnoor-danger' : 'border-shnoor-mist focus:border-shnoor-indigo focus:ring-shnoor-indigo'}`}
            placeholder="Enter your full address"
            value={formData.address} onChange={handleChange} disabled={isLoading} />
          <FieldError msg={errors.address} />
        </div>
      </div>
    );

    /* STEP 1 — Academic Details */
    if (step === 1) return (
      <div className="flex flex-col gap-5">
        <div ref={dropdownRef}>
          <label className="text-[11px] font-semibold text-shnoor-navy mb-1.5 uppercase tracking-wide flex items-center gap-1 block">
            Institute / University <span className="text-shnoor-danger">*</span>
          </label>
          <div className="relative">
            <div
              className={`w-full h-[50px] px-4 rounded-lg border bg-white transition-colors cursor-pointer flex items-center justify-between text-sm
                ${errors.institute ? 'border-shnoor-danger' : 'border-shnoor-mist hover:border-shnoor-indigo'}`}
              onClick={() => !isLoading && setShowInstituteDropdown(v => !v)}
            >
              <span className={formData.institute ? 'text-shnoor-navy' : 'text-shnoor-soft'}>
                {formData.institute || 'Select your institute...'}
              </span>
              <div className="flex items-center gap-2">
                {formData.institute && (
                  <button type="button" onClick={e => { e.stopPropagation(); setFormData(p => ({ ...p, institute: '' })); }}
                    className="p-1 text-shnoor-soft hover:text-shnoor-danger transition-colors rounded">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                    </svg>
                  </button>
                )}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
                  className={`text-shnoor-soft transition-transform duration-200 ${showInstituteDropdown ? 'rotate-180' : ''}`}>
                  <path d="M4.427 5.427a.5.5 0 0 0 0 .707l3 3a.5.5 0 0 0 .707 0l3-3a.5.5 0 1 0-.707-.707L8 7.793 5.573 5.427a.5.5 0 0 0-.707 0z" />
                </svg>
              </div>
            </div>
            {showInstituteDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-shnoor-mist rounded-xl shadow-[0_8px_24px_rgba(68,68,142,0.12)] overflow-hidden">
                <div className="max-h-52 overflow-y-auto">
                  {institutes.length > 0 ? institutes.map(inst => (
                    <div key={inst.id}
                      onClick={() => { setFormData(p => ({ ...p, institute: inst.display_name })); setShowInstituteDropdown(false); if (errors.institute) setErrors(p => ({ ...p, institute: '' })); }}
                      className="px-4 py-3 hover:bg-shnoor-lavender cursor-pointer transition-colors text-sm text-shnoor-navy border-b border-shnoor-mist/50 last:border-0">
                      {inst.display_name}
                    </div>
                  )) : <div className="px-4 py-3 text-sm text-shnoor-soft italic">No institutes available.</div>}
                </div>
              </div>
            )}
          </div>
          <FieldError msg={errors.institute} />
        </div>
        <div>
          <InputField label="Course" type="text" name="course" placeholder="e.g., B.Tech, M.Sc, BCA" required
            value={formData.course} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <FieldError msg={errors.course} />
        </div>
        <div>
          <InputField label="Specialization" type="text" name="specialization" placeholder="e.g., Computer Science, Electronics" required
            value={formData.specialization} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <FieldError msg={errors.specialization} />
        </div>
        <div>
          <InputField label="Resume Link" type="text" name="resumeLink" placeholder="Enter resume link or 'test'" required
            value={formData.resumeLink} onChange={handleChange} disabled={isLoading} autoComplete="off" />
          <p className="text-[11px] text-shnoor-soft mt-1">Enter Resume Link...</p>
          <FieldError msg={errors.resumeLink} />
        </div>
      </div>
    );
    /* STEP 2 — Account Setup */
    if (step === 2) return (
      <div className="flex flex-col gap-5">
        <div>
          <InputField label="Email Address" type="email" name="email" placeholder="student@institution.edu" required
            value={formData.email} onChange={handleChange} disabled={isLoading} autoComplete="email" />
          <FieldError msg={errors.email} />
        </div>

        <div className="relative">
          <InputField label="Password" type={showPassword ? 'text' : 'password'} name="password" placeholder="Minimum 8 characters" required
            value={formData.password} onChange={handleChange} disabled={isLoading} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[37px] text-shnoor-soft hover:text-shnoor-navy transition-colors p-1" tabIndex={-1}>
            {showPassword ? <EyeOff /> : <EyeOpen />}
          </button>
          <FieldError msg={errors.password} />
        </div>
        <div className="relative">
          <InputField label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Re-enter your password" required
            value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} autoComplete="new-password" />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[37px] text-shnoor-soft hover:text-shnoor-navy transition-colors p-1" tabIndex={-1}>
            {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
          </button>
          <FieldError msg={errors.confirmPassword} />
        </div>
      </div>
    );

    /* STEP 3 — Review & Confirm */
    return (
      <div className="flex flex-col gap-4">
        {/* Banner */}
        <div className="flex items-start gap-3 bg-[#EEF9F0] border border-shnoor-successLight rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-shnoor-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.97 4.97a.75.75 0 0 0-1.08-.022L6.477 9.417 4.384 7.323a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.137-.089l4-5.5a.75.75 0 0 0-.24-1.573z" />
          </svg>
          <p className="text-sm text-shnoor-success leading-relaxed">
            <span className="font-bold">Almost done!</span> Please review your details carefully. Click <strong>Edit</strong> on any section to make changes before submitting.
          </p>
        </div>

        {/* Section 1: Personal Info */}
        <ReviewSection title="Personal Information" stepIndex={0} onEdit={jumpToStep}>
          <ReviewRow label="Full Name" value={formData.fullName} />
          <ReviewRow label="Roll Number" value={formData.rollNumber} />
          <ReviewRow label="Phone" value={formData.phone} />
          <ReviewRow label="Address" value={formData.address} />
        </ReviewSection>

        {/* Section 2: Academic */}
        <ReviewSection title="Academic Details" stepIndex={1} onEdit={jumpToStep}>
          <ReviewRow label="Institute" value={formData.institute} />
          <ReviewRow label="Course" value={formData.course} />
          <ReviewRow label="Specialization" value={formData.specialization} />
          <ResumeLinkRow label="Resume Link" value={formData.resumeLink} />
        </ReviewSection>

        {/* Section 3: Account */}
        <ReviewSection title="Account Credentials" stepIndex={2} onEdit={jumpToStep}>
          <ReviewRow label="Email" value={formData.email} />
          <ReviewRow label="Password" value="set" hidden />
        </ReviewSection>

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-start gap-3 mt-2">
          <input
            type="checkbox"
            id="termsAccepted"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-shnoor-indigo border-shnoor-mist rounded focus:ring-shnoor-indigo focus:ring-2 cursor-pointer"
          />
          <label htmlFor="termsAccepted" className="text-sm text-shnoor-soft leading-relaxed cursor-pointer">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-shnoor-indigo font-semibold hover:text-shnoor-navy hover:underline transition-colors"
            >
              Terms and Conditions
            </button>
          </label>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-shnoor-soft text-center leading-relaxed">
          By submitting, you confirm that all details are accurate.
        </p>
      </div>
    );
  };
  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen w-full flex font-['Plus_Jakarta_Sans',sans-serif] relative">
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
              <img src={shnoorLogo} alt="Shnoor" className="h-full w-full object-contain" width="44" height="44" loading="eager" fetchPriority="high" />
            </div>
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">SHNOOR Assessments</p>
              <p className="auth-brand-subtitle text-[11px] uppercase tracking-widest font-semibold">Secure Examination Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
            Join the <span className="auth-hero-accent">SHNOOR</span><br />Recruitment Drive
          </h2>
          <p className="auth-left-muted text-sm leading-relaxed mb-10">
            Complete 4 quick steps to create your account and access your assessments.
          </p>

          {/* Step list */}
          <div className="flex flex-col gap-3">
            {STEP_META.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-2.5 -mx-2.5 rounded-xl transition-all duration-300 card-3d-subtle hover:bg-white/[0.08] border border-transparent hover:border-white/10 group cursor-default transform-style-3d ${isActive ? 'opacity-100 bg-white/[0.06] border-white/10' : isDone ? 'opacity-90' : 'opacity-60'
                    }`}
                >
                  <div className={`auth-step-badge w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 icon-gesture group-hover:scale-110 ${isDone ? 'is-complete' : isActive ? 'is-active scale-105 shadow-md shadow-indigo-500/30' : 'is-pending'}`}>
                    {isDone ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`auth-step-title text-sm font-bold ${isActive ? 'is-active' : isDone ? 'is-complete' : 'is-pending'}`}>{s.title}</p>
                    <p className={`auth-step-subtitle text-xs leading-relaxed ${isActive || isDone ? '' : 'is-pending'}`}>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 card-3d-subtle hover:bg-white/[0.04] p-3 -mx-3 rounded-xl transition-all duration-200">
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5, 6, 7].map((index) => (
              <div key={index} className="h-1.5 flex-1 rounded-full transition-transform duration-300 hover:scale-y-125" style={{ backgroundColor: `rgb(var(--theme-progress-${index}))` }} />
            ))}
          </div>
          <p className="auth-bottom-copy text-xs">SHNOOR Recruitment & Assessment Portal</p>
        </div>
      </div>
      {/* ── RIGHT PANEL ───────────────────────────────────── */}
      <div className="auth-right-panel flex-1 bg-white flex items-center justify-center px-6 py-10 overflow-auto relative">
        {/* Soft Ambient Background Orbs */}
        <div className="auth-glow-orb auth-glow-orb-primary w-80 h-80 -top-24 -right-24 pointer-events-none opacity-20" />
        <div className="auth-glow-orb auth-glow-orb-secondary w-72 h-72 bottom-12 -left-20 pointer-events-none opacity-15" />

        <div className="w-full max-w-[500px] relative z-10 animate-entry-3d perspective-1000">
          {/* Back navigation */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                if (step > 0) {
                  setStep(s => s - 1);
                } else {
                  navigate('/');
                }
              }}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-shnoor-soft hover:text-shnoor-indigo transition-colors group cursor-pointer nav-gesture-item"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1.5" />
              <span>{step > 0 ? 'Back to previous step' : 'Back to home'}</span>
            </button>
          </div>

          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="site-header-logo flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs p-1 flex-shrink-0 card-3d-lift shimmer-hover hover:scale-105 transition-transform">
              <img src={shnoorLogo} alt="Shnoor" className="h-full w-full object-contain" width="36" height="36" loading="lazy" decoding="async" />
            </div>
            <div>
              <p className="font-extrabold text-shnoor-navy text-base">SHNOOR Assessments</p>
              <p className="text-[10px] text-shnoor-soft uppercase tracking-widest">Secure Examination Portal</p>
            </div>
          </div>

          {/* Client org banner — shown when registering via a client token */}
          {clientInfo && (
            <div className="mb-5 flex items-center gap-3 bg-shnoor-indigo/10 border border-shnoor-indigo/30 rounded-xl px-4 py-3 card-3d-subtle hover:shadow-sm transition-all">
              <div className="w-8 h-8 rounded-lg bg-shnoor-indigo flex items-center justify-center flex-shrink-0 icon-gesture">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-shnoor-indigo">Registering for</p>
                <p className="text-sm font-semibold text-shnoor-navy">{clientInfo.company_name || clientInfo.name}</p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-shnoor-indigo uppercase tracking-widest">Step {step + 1} of {TOTAL_STEPS}</span>
              <span className="text-xs text-shnoor-soft font-medium">{STEP_META[step].title}</span>
            </div>
            <div className="auth-progress-track h-1.5 bg-shnoor-lavender rounded-full overflow-hidden">
              <div
                className="auth-progress-fill h-full bg-shnoor-indigo rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {STEP_META.map((s, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`auth-step-dot w-2 h-2 rounded-full transition-all duration-300 ${i < step ? 'is-complete' : i === step ? 'is-active scale-125' : 'is-pending'}`} />
                  <span className={`auth-step-label text-[10px] font-semibold hidden sm:block transition-colors duration-200 ${i === step ? 'text-shnoor-navy' : i < step ? 'text-shnoor-success' : 'text-shnoor-soft'}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-shnoor-navy tracking-tight">{STEP_META[step].title}</h1>
            <p className="text-sm text-shnoor-soft mt-0.5">{STEP_META[step].desc}</p>
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-5 flex items-start gap-3 bg-shnoor-dangerLight border border-shnoor-dangerLight text-shnoor-danger rounded-xl px-4 py-3 text-sm modal-3d-entrance shadow-xs">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 animate-pulse-subtle" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-9a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* Step fields — wrapped in form for enter-key and validation */}
          <form onSubmit={step < TOTAL_STEPS - 1 ? (e) => { e.preventDefault(); goNext(); } : (e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="animate-entry-3d">
              {renderStep()}
            </div>

            {/* Navigation */}
            <div className={`flex flex-col-reverse sm:flex-row gap-3 mt-8 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
              {step > 0 && (
                <Button type="button" onClick={goBack} disabled={isLoading}
                  className="w-full sm:w-auto h-[50px] px-6 rounded-lg font-semibold text-shnoor-navy border-2 border-shnoor-mist hover:border-shnoor-indigo hover:bg-shnoor-lavender transition-all flex items-center justify-center gap-2 btn-action-gesture">
                  <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
              )}

              {step < TOTAL_STEPS - 1 ? (
                <Button type="submit" variant="primary" className="w-full sm:flex-1 !h-[50px] btn-action-gesture shimmer-hover">
                  Continue
                  <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button type="submit" variant="primary" className="w-full sm:flex-1 !h-[50px] btn-action-gesture shimmer-hover" disabled={isLoading || !termsAccepted}>
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1 icon-gesture" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Confirm & Register
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-6 border-t border-shnoor-lavender">
            <p className="text-center text-sm text-shnoor-soft">
              Already registered?{' '}
              <Link to="/login" className="text-shnoor-indigo font-semibold hover:text-shnoor-navy transition-colors inline-block hover:underline">
                Sign in
              </Link>
            </p>
            <p className="auth-left-muted text-center text-xs mt-3 flex items-center justify-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              Secure, proctored examination environment
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl modal-3d-entrance border border-shnoor-mist">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-shnoor-mist bg-shnoor-lavender">
              <h2 className="text-xl font-extrabold text-shnoor-navy">Terms and Conditions</h2>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-shnoor-soft hover:text-shnoor-navy transition-all p-1.5 rounded-lg hover:bg-black/5 hover:scale-110 active:scale-95"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-sm max-w-none text-shnoor-navy">
                <h3 className="text-lg font-bold text-shnoor-navy mb-4">SHNOOR Assessment Platform - Terms of Service</h3>

                <div className="space-y-4 text-sm leading-relaxed">
                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">1. Acceptance of Terms</h4>
                    <p>By registering for and using the SHNOOR Assessment Platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">2. Platform Usage</h4>
                    <p>The SHNOOR Assessment Platform is designed for conducting secure online examinations and assessments. Users must:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Provide accurate and truthful information during registration</li>
                      <li>Maintain the confidentiality of their account credentials</li>
                      <li>Use the platform only for its intended purpose</li>
                      <li>Comply with all examination rules and guidelines</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">3. Account Security</h4>
                    <p>You are responsible for maintaining the security of your account and password. SHNOOR cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">4. Examination Conduct</h4>
                    <p>During examinations, users must:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Not engage in any form of cheating or academic dishonesty</li>
                      <li>Not share examination content with others</li>
                      <li>Allow proctoring software to monitor their activities when required</li>
                      <li>Report any technical issues immediately</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">5. Privacy and Data Protection</h4>
                    <p>We collect and process personal information in accordance with our Privacy Policy. By using our platform, you consent to the collection and use of your information as described in our Privacy Policy.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">6. Intellectual Property</h4>
                    <p>All content on the SHNOOR Assessment Platform, including but not limited to text, graphics, logos, and software, is the property of SHNOOR and is protected by copyright and other intellectual property laws.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">7. Prohibited Activities</h4>
                    <p>Users are prohibited from:</p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>Attempting to hack, reverse engineer, or compromise the platform</li>
                      <li>Using automated tools or bots to interact with the platform</li>
                      <li>Sharing login credentials with others</li>
                      <li>Engaging in any activity that disrupts the platform's operation</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">8. Termination</h4>
                    <p>SHNOOR reserves the right to terminate or suspend your account at any time for violation of these terms or for any other reason deemed necessary by SHNOOR.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">9. Limitation of Liability</h4>
                    <p>SHNOOR shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">10. Changes to Terms</h4>
                    <p>SHNOOR reserves the right to modify these Terms and Conditions at any time. Users will be notified of significant changes, and continued use of the platform constitutes acceptance of the modified terms.</p>
                  </section>

                  <section>
                    <h4 className="font-semibold text-shnoor-indigo mb-2">11. Contact Information</h4>
                    <p>If you have any questions about these Terms and Conditions, please contact us through the platform's support system.</p>
                  </section>
                </div>

                <div className="mt-6 pt-4 border-t border-shnoor-mist">
                  <p className="text-xs text-shnoor-soft">
                    Last updated: {formatDate(new Date())}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-shnoor-mist bg-gray-50">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="modalTermsAccepted"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-shnoor-indigo border-shnoor-mist rounded focus:ring-shnoor-indigo focus:ring-2 cursor-pointer"
                />
                <label htmlFor="modalTermsAccepted" className="text-sm text-shnoor-soft cursor-pointer">
                  I have read and agree to these terms
                </label>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-shnoor-navy border border-shnoor-mist rounded-lg hover:bg-shnoor-lavender transition-colors"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (termsAccepted) {
                      setShowTermsModal(false);
                    }
                  }}
                  disabled={!termsAccepted}
                  variant="primary"
                  className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Accept & Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;

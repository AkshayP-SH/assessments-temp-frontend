import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import shnoorLogo from '../assets/shnoor-logo.png';
import ThemeSelector from '../components/ThemeSelector';
import { useSEO } from '../hooks/useSEO';
import { usePrefetch } from '../hooks/usePrefetch';
import { useJsonLd } from '../hooks/useJsonLd';

/* ─── SVG Icon helper ─────────────────────────────────────────────────────── */
const Icon = ({ d, cls = 'w-6 h-6', stroke = 2, fill = 'none' }) => (
  <svg className={cls} fill={fill} stroke="currentColor" strokeWidth={stroke} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

/* ─── Icon paths ──────────────────────────────────────────────────────────── */
const CHECK = 'M5 13l4 4L19 7';
const SHIELD = 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';
const STAR = 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';
const DOC = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
const CAMERA = 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
const LOCK = 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
const CLIP = 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
const REFRESH = 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
const CAL = 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
const SAVE = 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4';
const SCREEN = 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
const CLOCK = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
const FLAG = 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
const ICON_CERT = 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z';
const ICON_ADMIN = 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z';
const ICON_COHORTS = 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
const ICON_PROGRESS = 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
const ICON_GLOBAL = 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
const ICON_ONBOARD = 'M13 10V3L4 14h7v7l9-11h-7z';
const ICON_DELIVERY = 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10';
const ICON_CODE = 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4';

/* ─── Nav links (smooth-scroll) ───────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

/* ─── Features data (Platform-wide: both org + candidate) ─────────────────── */
const FEATURES = [
  { icon: ICON_CODE, title: 'Custom Test Builder', desc: 'Create MCQ, coding, and mixed-format tests with custom passing criteria, time limits, and question pools.' },
  { icon: CAMERA, title: 'AI-Driven Proctoring', desc: 'Webcam snapshots, behavioral tracking, and full-screen enforcement guarantee exam integrity at scale.' },
  { icon: ICON_PROGRESS, title: 'In-Depth Analytics', desc: 'Real-time leaderboards, detailed candidate reports, and actionable insights for faster hiring decisions.' },
  { icon: CLIP, title: 'Auto-Assigned Tests', desc: 'Candidates see tests auto-assigned to their dashboard based on institute enrollment and recruitment drives.' },
  { icon: REFRESH, title: 'Multiple Attempts', desc: 'Configure tests to allow retakes so candidates can improve — flexible per exam or organization policy.' },
  { icon: SAVE, title: 'Auto-Save & Resume', desc: 'Candidate answers save automatically during exams. Resume seamlessly after disconnections.' },
  { icon: SCREEN, title: 'Secure Fullscreen Mode', desc: 'Exams run in locked fullscreen with tab-switch detection. Violations are logged and configurable.' },
  { icon: ICON_GLOBAL, title: 'Remote & Scalable', desc: 'Conduct secure assessments for distributed candidates anywhere with a modern browser-based platform.' },
];

/* ─── Main Component ──────────────────────────────────────────────────────── */
const LandingPage = () => {
  useSEO({
    title: "SHNOOR Assessments - Secure Exam Portal",
    description: "AI-powered assessment platform for organizations and candidates.",
    canonical: "https://assessments.shnoor.com/",
    ogImage: "https://assessments.shnoor.com/og-image.png"
  });

  useJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://assessments.shnoor.com/#organization",
        "name": "SHNOOR International",
        "url": "https://assessments.shnoor.com",
        "logo": "https://assessments.shnoor.com/favicon.png",
        "description": "AI-powered secure examination and assessment platform for organizations and candidates."
      },
      {
        "@type": "WebSite",
        "@id": "https://assessments.shnoor.com/#website",
        "url": "https://assessments.shnoor.com",
        "name": "SHNOOR Assessments",
        "publisher": { "@id": "https://assessments.shnoor.com/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://assessments.shnoor.com/job-board?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  });

  // Prefetch login & register chunks when user hovers nav buttons
  const prefetchLogin = usePrefetch(() => import('../components/Login'));
  const prefetchRegister = usePrefetch(() => import('../components/Register'));

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);

  // Fetch pricing plans
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/subscription-plans`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPlans(data.plans.filter(p => p.is_active));
      })
      .catch(err => console.error('Error fetching plans:', err))
      .finally(() => setPlansLoading(false));
  }, []);

  // Navbar scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href === '#home') { 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.scrollTo({ top: 0, behavior: 'smooth' });
      return; 
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-root font-['Plus_Jakarta_Sans',sans-serif] text-shnoor-navy antialiased">

      {/* ══════════════════════════════════════════════════════════════════════
          1. NAVBAR
          ══════════════════════════════════════════════════════════════════════ */}
      <nav
        ref={navRef}
        className={`landing-nav bg-white sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'} border-b border-shnoor-mist`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 flex items-center justify-between h-[72px]">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="landing-brand-logo flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img src={shnoorLogo} alt="Shnoor" className="h-10 w-10 sm:h-11 sm:w-11 object-contain" width="44" height="44" loading="eager" fetchPriority="high" />
            </div>
            <div>
              <p className="font-extrabold text-shnoor-navy text-sm sm:text-[15px] leading-tight tracking-wide uppercase">SHNOOR INTERNATIONAL</p>
              <p className="text-[10px] text-shnoor-soft font-semibold tracking-widest uppercase">Assessment Platform</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 bg-shnoor-lavender/30 rounded-full px-2 py-1.5">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} onClick={(e) => scrollToSection(e, link.href)}
                className="px-4 py-2 text-sm font-semibold text-shnoor-soft hover:text-shnoor-navy transition-colors rounded-full hover:bg-white/60">
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeSelector variant="light" />
            <Link to="/login" onMouseEnter={prefetchLogin} className="hidden sm:inline-flex text-sm font-semibold text-shnoor-navy hover:text-shnoor-indigo transition-colors px-3 py-2">
              Log In
            </Link>
            <Link to="/register" onMouseEnter={prefetchRegister}>
              <button className="bg-shnoor-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-shnoor-indigo transition-colors">
                Get Started
              </button>
            </Link>
            {/* Mobile hamburger */}
            <button className="lg:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              <span className={`block w-5 h-0.5 bg-shnoor-navy transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-shnoor-navy transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-shnoor-navy transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-shnoor-mist px-4 pb-4 animate-fadeIn">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href} onClick={(e) => scrollToSection(e, link.href)}
                className="block px-4 py-3 text-sm font-semibold text-shnoor-soft hover:text-shnoor-navy hover:bg-shnoor-lavender/40 rounded-lg transition-colors">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="block px-4 py-3 text-sm font-semibold text-shnoor-navy sm:hidden">Log In</Link>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          2. HERO — Platform-level intro (org + candidate)
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="home" className="landing-hero bg-white py-12 sm:py-20 px-4 sm:px-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-shnoor-indigo/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-purple-300/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left — Text */}
          <div className="flex flex-col gap-6 items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-shnoor-lavender text-shnoor-indigo text-xs sm:text-sm font-bold px-4 py-2 rounded-full w-fit border border-shnoor-indigo/20">
              <span className="w-2 h-2 bg-shnoor-indigo rounded-full animate-pulse" />
              NEXT-GEN ASSESSMENT PLATFORM
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-[1.15] text-shnoor-navy">
              Scale your hiring with secure, proctored assessments that candidates trust.
            </h1>

            <p className="text-base sm:text-lg text-shnoor-soft leading-[1.75] max-w-xl">
              SHNOOR Assessments helps organizations create, manage, and proctor technical exams at scale — while giving candidates a seamless, secure, and fair examination experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link to="/register">
                <button className="group flex items-center gap-2 bg-shnoor-navy text-white text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-shnoor-indigo transition-all shadow-lg shadow-shnoor-navy/20">
                  Get Started
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
              </Link>
              <button 
                onClick={(e) => scrollToSection(e, '#how-it-works')}
                className="already-registered-btn text-sm font-bold px-7 py-3.5 rounded-xl text-shnoor-navy border-2 border-shnoor-mist hover:border-shnoor-indigo hover:bg-shnoor-lavender/40 transition-all"
              >
                Explore Platform
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-lg">
              {[
                { val: '500+', label: 'Candidates assessed across drives' },
                { val: '8', label: 'Core platform capabilities' },
                { val: '99.9%', label: 'Reliable exam operations' },
              ].map(s => (
                <div key={s.val} className="bg-shnoor-lavender/50 rounded-2xl p-4 text-center lg:text-left border border-shnoor-mist/60">
                  <p className="text-2xl sm:text-3xl font-extrabold text-shnoor-navy">{s.val}</p>
                  <p className="text-xs text-shnoor-soft mt-1 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Live Platform Overview Card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[460px] bg-shnoor-navy rounded-2xl shadow-[0_20px_60px_rgba(14,14,39,0.25)] overflow-hidden">
              {/* Card header */}
              <div className="px-6 pt-6 pb-4">
                <p className="text-xs font-bold text-shnoor-indigo uppercase tracking-[0.2em] mb-2">LIVE PLATFORM VIEW</p>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-extrabold text-white leading-snug pr-4">
                    Secure assessments, real-time proctoring, and actionable results
                  </h3>
                  <div className="flex-shrink-0 bg-shnoor-indigo/30 rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] text-shnoor-soft uppercase tracking-wider">Active</p>
                    <p className="text-[10px] text-shnoor-soft uppercase tracking-wider">exams</p>
                    <p className="text-xl font-extrabold text-white">12</p>
                  </div>
                </div>
              </div>

              {/* For Organizations */}
              <div className="mx-4 mb-3 bg-white rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-shnoor-lavender rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon d={ICON_ADMIN} cls="w-5 h-5 text-shnoor-indigo" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-shnoor-navy">Organization Dashboard</p>
                    <p className="text-xs text-shnoor-soft">Create tests, monitor live exams, view analytics</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['Test Builder', 'Live Proctoring', 'Reports'].map(t => (
                    <span key={t} className="text-[11px] font-semibold text-shnoor-indigo bg-shnoor-lavender px-2.5 py-1 rounded-lg">{t}</span>
                  ))}
                </div>
              </div>

              {/* For Candidates */}
              <div className="mx-4 mb-3 bg-white/5 backdrop-blur rounded-xl p-4">
                <p className="text-[10px] font-bold text-shnoor-soft uppercase tracking-[0.2em] mb-3">CANDIDATE EXPERIENCE</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    'Auto-assigned tests based on enrollment',
                    'Secure fullscreen proctored exams',
                    'Instant submission confirmation & results',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon d={CHECK} cls="w-3 h-3 text-green-400" stroke={3} />
                      </div>
                      <p className="text-sm text-white/80">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security status */}
              <div className="mx-4 mb-5 bg-white rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-shnoor-lavender rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon d={SHIELD} cls="w-5 h-5 text-shnoor-indigo" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-shnoor-navy">Enterprise Security</p>
                    <p className="text-xs text-shnoor-soft">AI proctoring • Encrypted answers • Tab detection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. HOW IT WORKS — Platform-level workflow
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="landing-how bg-white py-16 sm:py-24 px-4 sm:px-8 border-t border-shnoor-lavender">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block text-xs font-extrabold text-shnoor-indigo uppercase tracking-[0.25em] mb-4">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-shnoor-navy mb-4 leading-tight">
              A clear assessment workflow for<br className="hidden sm:block" /> organizations and candidates
            </h2>
            <p className="text-base sm:text-lg text-shnoor-soft max-w-2xl mx-auto leading-relaxed">
              Every part of the platform is designed to help organizations launch exams faster, deliver secure assessment experiences, and measure talent without friction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                icon: ICON_CODE,
                title: 'Create & configure exams',
                desc: 'Organizations build custom tests with MCQs, coding questions, and automated test cases. Set time limits, passing criteria, and attempt policies.',
              },
              {
                num: '02',
                icon: SCREEN,
                title: 'Assign & proctor securely',
                desc: 'Assign tests to candidates by institute or batch. Exams run in a secure fullscreen environment with webcam proctoring and tab-switch detection.',
              },
              {
                num: '03',
                icon: ICON_PROGRESS,
                title: 'Analyze & hire confidently',
                desc: 'View real-time leaderboards, detailed performance reports, and AI-flagged violations to make data-driven hiring decisions.',
              },
            ].map(step => (
              <div key={step.num} className="bg-shnoor-lavender/30 border border-shnoor-mist/60 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-shnoor-lavender rounded-xl flex items-center justify-center">
                    <Icon d={step.icon} cls="w-6 h-6 text-shnoor-indigo" />
                  </div>
                  <span className="text-2xl font-extrabold text-shnoor-mist">{step.num}</span>
                </div>
                <h3 className="text-xl font-extrabold text-shnoor-navy mb-3">{step.title}</h3>
                <p className="text-shnoor-soft leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. PLATFORM FLOW — How it supports both sides
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="about" className="landing-expect bg-white py-16 sm:py-24 px-4 sm:px-8 border-t border-shnoor-lavender">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left — Text */}
            <div>
              <span className="inline-block text-xs font-extrabold text-shnoor-indigo uppercase tracking-[0.25em] mb-4 bg-shnoor-lavender px-3 py-1.5 rounded-full">PLATFORM FLOW</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-shnoor-navy mb-4 leading-tight">
                How SHNOOR supports every stage of recruitment assessment
              </h2>
              <p className="text-shnoor-soft leading-relaxed mb-8">
                From exam creation to candidate evaluation, the platform is built to keep recruitment organized, secure, and easy to scale.
              </p>
              <div className="flex flex-col gap-5">
                {[
                  'Built for organizations that need both exam integrity and operational visibility.',
                  'Designed to keep the candidate experience simple while giving recruiters full control.',
                  'Consistent workflows for test creation, proctoring, evaluation, and hiring decisions.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-shnoor-lavender/40 rounded-xl p-4 border border-shnoor-mist/40">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon d={CHECK} cls="w-3 h-3 text-green-600" stroke={3} />
                    </div>
                    <p className="text-sm text-shnoor-soft leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Feature cards */}
            <div className="grid sm:grid-cols-3 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: ICON_ADMIN,
                  title: 'Admin & recruiter control center',
                  desc: 'Manage exams, candidates, proctoring settings, reports, and organization settings from a single dashboard.',
                },
                {
                  icon: ICON_DELIVERY,
                  title: 'Candidate exam experience',
                  desc: 'Auto-assigned tests, secure fullscreen exams, auto-save, and clear instructions for a smooth assessment flow.',
                },
                {
                  icon: ICON_CERT,
                  title: 'Results & evaluation',
                  desc: 'Automated grading, performance analytics, proctoring violation reports, and exportable results for hiring decisions.',
                },
              ].map(card => (
                <div key={card.title} className="bg-white border border-shnoor-mist rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <div className="w-12 h-12 bg-shnoor-navy rounded-xl flex items-center justify-center mb-5">
                    <Icon d={card.icon} cls="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-base text-shnoor-navy mb-2">{card.title}</h3>
                  <p className="text-sm text-shnoor-soft leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. PLATFORM FEATURES (8-grid) — Both org & candidate
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="landing-features bg-shnoor-lavender py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block text-xs font-extrabold text-shnoor-indigo uppercase tracking-[0.25em] mb-4">PLATFORM FEATURES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-shnoor-navy mb-4 leading-tight">
              Eight core capabilities designed for<br className="hidden sm:block" /> enterprise-ready assessments
            </h2>
            <p className="text-base sm:text-lg text-shnoor-soft max-w-2xl mx-auto leading-relaxed">
              Every feature is built to reduce friction for candidates and give organizations the visibility and control they need to run professional recruitment at scale.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white border border-shnoor-mist/60 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="w-12 h-12 bg-shnoor-lavender rounded-xl flex items-center justify-center mb-5">
                  <Icon d={f.icon} cls="w-6 h-6 text-shnoor-indigo" />
                </div>
                <h3 className="font-bold text-base text-shnoor-navy mb-2">{f.title}</h3>
                <p className="text-sm text-shnoor-soft leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. SECURE EXAMINATION ENVIRONMENT
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="landing-secure bg-shnoor-navy py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          {/* Left */}
          <div className="landing-secure-content text-center lg:text-left">
            <span className="inline-block text-xs font-extrabold text-shnoor-indigo uppercase tracking-[0.25em] mb-4 bg-shnoor-indigo/20 px-3 py-1.5 rounded-full">PLATFORM SECURITY</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Secure examination<br className="hidden sm:block" /> environment
            </h2>
            <p className="text-base sm:text-lg text-shnoor-soft mb-8 sm:mb-10 leading-[1.7]">
              Multi-layered security ensures every exam is tamper-proof. Organizations get full control over proctoring policies while candidates experience a fair, transparent process.
            </p>
            <div className="flex flex-col gap-8">
              {[
                { icon: CAMERA, title: 'Live Proctoring', desc: 'AI-driven webcam monitoring with periodic snapshots. Organizations review flagged behaviors in real-time.' },
                { icon: LOCK, title: 'Tab Switch Detection', desc: 'Configurable violation limits per exam. Automatic warnings for candidates, detailed logs for recruiters.' },
                { icon: SHIELD, title: 'Encrypted Submissions', desc: 'All responses are encrypted, timestamped, and securely stored. Full audit trail for every exam session.' },
              ].map(f => (
                <div key={f.title} className="flex gap-5">
                  <div className="w-12 h-12 rounded-xl bg-shnoor-indigo flex items-center justify-center flex-shrink-0">
                    <Icon d={f.icon} cls="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1">{f.title}</h3>
                    <p className="text-shnoor-soft leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Security Status Card */}
          <div>
            <div className="landing-security-card rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="landing-contrast-text font-bold text-xl">Security Status</h3>
                <span className="bg-shnoor-success text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">ACTIVE</span>
              </div>
              <div className="space-y-0 divide-y divide-white/10">
                {[
                  { label: 'Fullscreen Enforcement', val: '✓ Enabled', cls: 'text-shnoor-success' },
                  { label: 'Camera Monitoring', val: '✓ Required', cls: 'text-shnoor-success' },
                  { label: 'Tab Switch Limit', val: '3 Warnings', cls: 'text-shnoor-warning' },
                  { label: 'Auto-Submit', val: 'On Timeout', cls: 'text-[#60a5fa]' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-4">
                    <span className="landing-contrast-muted">{r.label}</span>
                    <span className={`text-sm font-bold ${r.cls}`}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="landing-security-note mt-6 rounded-xl p-4">
                <p className="landing-contrast-muted text-sm italic leading-relaxed">
                  "These measures ensure a fair assessment for candidates and reliable results for organizations."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. RECOGNITION / NASSCOM
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="landing-expect bg-white py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Left — Dark Recognition Card */}
            <div className="bg-shnoor-navy rounded-2xl p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-shnoor-indigo/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10">
                <span className="inline-block text-xs font-extrabold text-shnoor-indigo uppercase tracking-[0.25em] mb-4 bg-shnoor-indigo/20 px-3 py-1.5 rounded-full">RECOGNITION</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4">
                  Trusted direction, serious execution, and a platform built for professional assessment outcomes.
                </h2>
                <p className="text-shnoor-soft leading-relaxed mb-8">
                  Shnoor combines secure proctoring, custom test creation, and modern reporting so organizations can evaluate talent with confidence and candidates can demonstrate their skills fairly.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 relative z-10">
                {['AI-Driven Proctoring', 'Custom Test Builder', 'Enterprise Analytics'].map(tag => (
                  <span key={tag} className="text-xs font-bold text-white bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — NASSCOM Milestone */}
            <div className="bg-white border border-shnoor-mist rounded-2xl p-8 sm:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-shnoor-lavender rounded-2xl flex items-center justify-center overflow-hidden border border-shnoor-mist flex-shrink-0">
                  <img src={shnoorLogo} alt="Shnoor" className="h-10 w-10 object-contain" loading="lazy" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-shnoor-soft uppercase tracking-[0.2em]">MILESTONE</p>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-shnoor-navy">Proudly recognized by NASSCOM</h3>
                </div>
              </div>
              <p className="text-shnoor-soft leading-relaxed mb-6">
                Our proposal has been approved by NASSCOM, reinforcing the strength of our vision, process maturity, and long-term commitment to quality.
              </p>
              <div className="bg-shnoor-lavender/50 rounded-xl p-5 border border-shnoor-mist/50">
                <p className="text-sm text-shnoor-soft leading-relaxed italic">
                  This recognition strengthens trust in the Shnoor platform as a serious, professional assessment environment for organizations and candidates alike.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. PRICING (For Organizations)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="landing-secure bg-shnoor-navy py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block text-xs font-extrabold text-shnoor-indigo uppercase tracking-[0.25em] mb-4 bg-shnoor-indigo/20 px-3 py-1.5 rounded-full">FOR ORGANIZATIONS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-shnoor-soft">Choose a plan that fits your organisation's hiring volume.</p>
          </div>

          {plansLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-shnoor-indigo border-t-transparent" />
            </div>
          ) : plans.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => {
                const isPremium = plan.name.toLowerCase().includes('premium') && !plan.name.toLowerCase().includes('super');
                const isSuper = plan.name.toLowerCase().includes('super');
                return (
                  <div key={plan.id} className={`rounded-2xl p-8 flex flex-col relative transition-transform duration-300 hover:-translate-y-1 ${isPremium ? 'bg-shnoor-indigo scale-100 md:scale-105 shadow-2xl z-10' : 'bg-white'}`}>
                    {isPremium && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl flex items-center gap-1">
                        <Icon d={STAR} cls="w-3 h-3" fill="currentColor" stroke={0} /> Most Popular
                      </div>
                    )}
                    <h3 className={`text-2xl font-bold mb-2 ${isPremium ? 'text-white' : 'text-shnoor-navy'}`}>{plan.name}</h3>
                    <p className={`mb-6 ${isPremium ? 'text-white/70' : 'text-shnoor-soft'}`}>{plan.description || 'Choose this plan to boost your hiring'}</p>
                    <div className={`mb-6 pb-6 ${isPremium ? 'border-b border-white/20' : 'border-b border-shnoor-mist'}`}>
                      <span className={`text-4xl font-extrabold ${isPremium ? 'text-white' : 'text-shnoor-navy'}`}>₹{plan.price_monthly}</span>
                      <span className={isPremium ? 'text-white/70' : 'text-shnoor-soft'}>/month</span>
                    </div>
                    <ul className="flex flex-col gap-4 mb-8 flex-1">
                      {(plan.features || []).map((f, i) => (
                        <li key={i} className={`flex items-center gap-3 font-medium ${isPremium ? 'text-white' : 'text-shnoor-navy'}`}>
                          <Icon d={CHECK} cls={`w-5 h-5 flex-shrink-0 ${isPremium ? 'text-yellow-400' : 'text-shnoor-success'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/register-organisation">
                      <button className={`w-full h-[50px] font-bold rounded-xl transition-colors ${isPremium ? 'bg-white text-shnoor-indigo hover:bg-shnoor-lavender' : 'border-2 border-shnoor-mist text-shnoor-navy hover:border-shnoor-indigo hover:text-shnoor-indigo'}`}>
                        {isSuper ? 'Contact Sales' : isPremium ? 'Get Premium' : 'Get Started'}
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-shnoor-soft">Pricing plans are being updated. Please check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. CTA
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="landing-cta bg-shnoor-indigo py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 sm:mb-5">Ready to get started?</h2>
          <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 leading-relaxed">
            Whether you're a candidate preparing for a recruitment drive or an organization looking to streamline your hiring assessments — SHNOOR has you covered.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Link to="/register">
              <button className="h-[50px] px-8 rounded-lg font-bold text-white border-2 border-white hover:bg-white/10 transition-all">
                Register as Candidate
              </button>
            </Link>
            <Link to="/register-organisation">
              <button className="h-[50px] px-8 rounded-lg font-bold bg-white text-shnoor-indigo hover:bg-shnoor-lavender transition-all">
                Register Organisation
              </button>
            </Link>
          </div>
          <Link to="/login" className="text-white/60 hover:text-white text-sm font-semibold transition-colors">
            Already have an account? Sign In →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          10. FOOTER
          ══════════════════════════════════════════════════════════════════════ */}
      <footer id="contact" className="landing-footer bg-shnoor-navy pt-12 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12 mb-10 sm:mb-12 text-center md:text-left">
            <div>
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <div className="landing-footer-logo flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white">
                  <img src={shnoorLogo} alt="Shnoor" className="h-9 w-9 object-contain" loading="lazy" width="36" height="36" decoding="async" />
                </div>
                <span className="font-extrabold text-white text-lg">SHNOOR Assessments</span>
              </div>
              <p className="text-shnoor-soft mb-6 leading-relaxed text-sm">Secure assessment platform for campus recruitment drives and enterprise hiring.</p>
              <p className="text-xs font-extrabold text-white uppercase tracking-widest mb-2">Location</p>
              <p className="text-shnoor-soft text-sm leading-relaxed">10009 Mount Tabor Road,<br />Odessa Missouri, United States.</p>
            </div>
            <div>
              <p className="text-xs font-extrabold text-shnoor-mist uppercase tracking-widest mb-5">Contacts</p>
              <ul className="flex flex-col gap-3 text-shnoor-soft">
                <li><a href="mailto:info@shnoor.com" className="landing-footer-link transition-colors">📧 info@shnoor.com (General)</a></li>
                <li><a href="mailto:proc@shnoor.com" className="landing-footer-link transition-colors">📧 proc@shnoor.com (Sales)</a></li>
                <li><a href="tel:+919429694298" className="landing-footer-link transition-colors">📞 +91-9429694298</a></li>
                <li><a href="tel:+919041914601" className="landing-footer-link transition-colors">📞 +91-9041914601</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-extrabold text-shnoor-mist uppercase tracking-widest mb-5">Useful Links</p>
              <ul className="flex flex-col gap-3 text-shnoor-soft">
                <li><a href="https://www.linkedin.com/company/shnoor-international/" target="_blank" rel="noopener noreferrer" className="landing-footer-link transition-colors">We are Social</a></li>
                <li><a href="https://api.whatsapp.com/qr/D6I7XIACKIKVD1?autoload=1&app_absent=0" target="_blank" rel="noopener noreferrer" className="landing-footer-link transition-colors">Let's Connect</a></li>
                <li><a href="/company-profile.pdf" target="_blank" rel="noopener noreferrer" className="landing-footer-link transition-colors">Company Profile</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-shnoor-soft">
              <p>© Copyrights 2025. All Rights Reserved. SHNOOR INTERNATIONAL LLC</p>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-white/20">•</span>
                <Link to="/privacy-policy" className="landing-footer-link transition-colors">Privacy Policy</Link>
                <span className="text-white/20">•</span>
                <Link to="/terms-and-conditions" className="landing-footer-link transition-colors">Terms &amp; Conditions</Link>
              </div>
            </div>
            <div className="landing-contrast-muted flex items-center gap-2 text-sm font-semibold">
              <Icon d={SHIELD} cls="w-4 h-4" />
              Secure Environment
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
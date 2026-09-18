import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { apiFetch, API_URL } from '../../config/api';
import shnoorLogo from '../../assets/shnoor-logo.png';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('clientToken')}`,
});

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-white rounded-xl border border-shnoor-mist p-5 flex items-center gap-4 shadow-sm`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-shnoor-navy">{value ?? '—'}</p>
      <p className="text-xs text-shnoor-soft font-medium uppercase tracking-wide">{label}</p>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-bold text-shnoor-navy uppercase tracking-widest mb-4">{children}</h2>
);

/* ─── Main Component ──────────────────────────────────────────────────────── */
const ClientDashboard = () => {
  const navigate = useNavigate();
  const { clientUser, logout } = useClientAuth();

  const [stats, setStats] = useState(null);
  const [tests, setTests] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPlanId, setCurrentPlanId] = useState(clientUser?.planId || null);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Registration URL for sharing
  const registrationUrl = `${window.location.origin}/register?clientToken=${clientUser?.registrationToken || ''}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.resolve();
      const headers = authHeaders();

      const [testsRes, institutesRes, studentsRes, plansRes, profileRes] = await Promise.all([
        apiFetch('api/tests', { headers }),
        apiFetch('api/institutes', { headers }),
        apiFetch('api/export/students', { headers }),
        apiFetch('api/subscription-plans/all', { headers }),
        apiFetch('api/client/auth/me', { headers }),
      ]);

      const [testsData, institutesData, studentsData, plansData, profileData] = await Promise.all([
        testsRes.json(),
        institutesRes.json(),
        studentsRes.ok ? studentsRes.json() : { success: false, data: [] },
        plansRes.json(),
        profileRes.ok ? profileRes.json() : { success: false },
      ]);

      if (testsData.success) setTests(testsData.tests || []);
      if (institutesData.success) setInstitutes(institutesData.institutes || []);
      if (plansData.success) setSubscriptionPlans(plansData.plans.filter(p => p.is_active));
      if (profileData.success && profileData.admin) setCurrentPlanId(profileData.admin.plan_id);

      // Build stats
      setStats({
        tests: testsData.tests?.length || 0,
        institutes: institutesData.institutes?.length || 0,
        students: studentsData?.length || 0,
      });

      if (Array.isArray(studentsData)) setStudents(studentsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login?portal=org');
  };

  const copyRegistrationUrl = () => {
    navigator.clipboard.writeText(registrationUrl).then(() => {
      alert('Registration link copied to clipboard!');
    });
  };

  /* ─── Sidebar nav items ─────────────────────────────────────────────────── */
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'tests', label: 'Tests', icon: '📝' },
    { id: 'institutes', label: 'Institutes', icon: '🏫' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'subscription', label: 'Subscription', icon: '💳' },
    { id: 'registration', label: 'Registration Link', icon: '🔗' },
  ];

  const handlePurchaseSubscription = async (plan) => {
    try {
      const res = await loadRazorpay();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const orderRes = await apiFetch('api/settings/purchase-subscription', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ plan_id: plan.plan_id }),
      });
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        alert(orderData.message || 'Failed to initiate purchase');
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SHNOOR Assessments',
        description: `Subscription - ${plan.name}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await apiFetch('api/settings/verify-payment', {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: plan.plan_id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert('Subscription purchased successfully! You can now create tests.');
              fetchData();
            } else {
              alert(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error(err);
            alert('Error verifying payment');
          }
        },
        prefill: {
          name: clientUser?.fullName || '',
          email: clientUser?.email || '',
        },
        theme: {
          color: '#4F46E5'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Error purchasing subscription');
    }
  };

  return (
    <div className="min-h-screen bg-shnoor-lavender flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-shnoor-mist flex flex-col shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-shnoor-mist">
          <img src={shnoorLogo} alt="Shnoor" className="h-8" />
          <p className="text-xs text-shnoor-soft mt-1 font-medium">Client Portal</p>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-shnoor-mist bg-shnoor-lavender">
          <p className="text-sm font-bold text-shnoor-navy truncate">{clientUser?.fullName || clientUser?.email}</p>
          <p className="text-xs text-shnoor-soft truncate">{clientUser?.companyName}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-shnoor-indigo/10 text-shnoor-indigo text-[10px] font-bold rounded-full uppercase tracking-wide">
            Client Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === item.id
                  ? 'bg-shnoor-indigo text-white shadow-sm'
                  : 'text-shnoor-navy hover:bg-shnoor-lavender'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-shnoor-mist">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-shnoor-mist px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-shnoor-navy">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-shnoor-soft">{clientUser?.companyName}</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-shnoor-lavender text-shnoor-indigo rounded-lg text-sm font-semibold hover:bg-shnoor-indigo hover:text-white transition-colors"
          >
            🔄 Refresh
          </button>
        </header>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-shnoor-indigo border-t-transparent" />
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ──────────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Total Tests" value={stats?.tests} icon="📝" color="bg-shnoor-indigo" />
                    <StatCard label="Institutes" value={stats?.institutes} icon="🏫" color="bg-emerald-500" />
                    <StatCard label="Students" value={stats?.students} icon="👥" color="bg-amber-500" />
                  </div>

                  {/* Quick registration link */}
                  <div className="bg-white rounded-xl border border-shnoor-mist p-6 shadow-sm">
                    <SectionTitle>Student Registration Link</SectionTitle>
                    <p className="text-sm text-shnoor-soft mb-3">
                      Share this link with students to register under your organization.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        readOnly
                        value={registrationUrl}
                        className="flex-1 h-10 px-3 rounded-lg border border-shnoor-mist bg-shnoor-lavender text-xs text-shnoor-navy font-mono"
                      />
                      <button
                        onClick={copyRegistrationUrl}
                        className="px-4 h-10 bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Recent tests */}
                  <div className="bg-white rounded-xl border border-shnoor-mist p-6 shadow-sm">
                    <SectionTitle>Recent Tests</SectionTitle>
                    {tests.length === 0 ? (
                      <p className="text-sm text-shnoor-soft italic">No tests found for your organization.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-shnoor-mist">
                              <th className="text-left py-2 px-3 text-xs font-bold text-shnoor-soft uppercase tracking-wide">Title</th>
                              <th className="text-left py-2 px-3 text-xs font-bold text-shnoor-soft uppercase tracking-wide">Status</th>
                              <th className="text-left py-2 px-3 text-xs font-bold text-shnoor-soft uppercase tracking-wide">Questions</th>
                              <th className="text-left py-2 px-3 text-xs font-bold text-shnoor-soft uppercase tracking-wide">Attempts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tests.slice(0, 5).map(test => (
                              <tr key={test.id} className="border-b border-shnoor-mist/50 hover:bg-shnoor-lavender/50 transition-colors">
                                <td className="py-3 px-3 font-medium text-shnoor-navy">{test.title}</td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    test.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                    test.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {test.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-shnoor-soft">{test.question_count || 0}</td>
                                <td className="py-3 px-3 text-shnoor-soft">{test.total_attempts || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TESTS ─────────────────────────────────────────────────── */}
              {activeTab === 'tests' && (
                <div className="bg-white rounded-xl border border-shnoor-mist shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-shnoor-mist flex items-center justify-between">
                    <SectionTitle>All Tests</SectionTitle>
                    <span className="text-xs text-shnoor-soft">{tests.length} total</span>
                  </div>
                  {tests.length === 0 ? (
                    <div className="px-6 py-12 text-center text-shnoor-soft text-sm italic">
                      No tests found for your organization.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-shnoor-lavender">
                          <tr>
                            {['Title', 'Status', 'Duration', 'Questions', 'Attempts', 'Pass Rate'].map(h => (
                              <th key={h} className="text-left py-3 px-4 text-xs font-bold text-shnoor-soft uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tests.map(test => (
                            <tr key={test.id} className="border-b border-shnoor-mist/50 hover:bg-shnoor-lavender/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-shnoor-navy">{test.title}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  test.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                  test.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {test.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-shnoor-soft">{test.duration} min</td>
                              <td className="py-3 px-4 text-shnoor-soft">{test.question_count || 0}</td>
                              <td className="py-3 px-4 text-shnoor-soft">{test.total_attempts || 0}</td>
                              <td className="py-3 px-4 text-shnoor-soft">{test.pass_percentage || 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── INSTITUTES ────────────────────────────────────────────── */}
              {activeTab === 'institutes' && (
                <div className="bg-white rounded-xl border border-shnoor-mist shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-shnoor-mist flex items-center justify-between">
                    <SectionTitle>Institutes</SectionTitle>
                    <span className="text-xs text-shnoor-soft">{institutes.length} total</span>
                  </div>
                  {institutes.length === 0 ? (
                    <div className="px-6 py-12 text-center text-shnoor-soft text-sm italic">
                      No institutes found for your organization.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-shnoor-lavender">
                          <tr>
                            {['Name', 'Students', 'Tests Assigned', 'Registration', 'Status'].map(h => (
                              <th key={h} className="text-left py-3 px-4 text-xs font-bold text-shnoor-soft uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {institutes.map(inst => (
                            <tr key={inst.id} className="border-b border-shnoor-mist/50 hover:bg-shnoor-lavender/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-shnoor-navy">{inst.display_name}</td>
                              <td className="py-3 px-4 text-shnoor-soft">{inst.student_count || 0}</td>
                              <td className="py-3 px-4 text-shnoor-soft">{inst.assigned_tests_count || 0}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  inst.is_registration_open ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                                }`}>
                                  {inst.is_registration_open ? 'Open' : 'Closed'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  inst.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {inst.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── STUDENTS ──────────────────────────────────────────────── */}
              {activeTab === 'students' && (
                <div className="bg-white rounded-xl border border-shnoor-mist shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-shnoor-mist flex items-center justify-between">
                    <SectionTitle>Students</SectionTitle>
                    <span className="text-xs text-shnoor-soft">{students.length} total</span>
                  </div>
                  {students.length === 0 ? (
                    <div className="px-6 py-12 text-center text-shnoor-soft text-sm italic">
                      No students registered under your organization yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-shnoor-lavender">
                          <tr>
                            {['Name', 'Email', 'Roll No.', 'Institute', 'Course', 'Registered'].map(h => (
                              <th key={h} className="text-left py-3 px-4 text-xs font-bold text-shnoor-soft uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(s => (
                            <tr key={s.id} className="border-b border-shnoor-mist/50 hover:bg-shnoor-lavender/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-shnoor-navy">{s.full_name}</td>
                              <td className="py-3 px-4 text-shnoor-soft text-xs">{s.email}</td>
                              <td className="py-3 px-4 text-shnoor-soft">{s.roll_number}</td>
                              <td className="py-3 px-4 text-shnoor-soft">{s.institute_name}</td>
                              <td className="py-3 px-4 text-shnoor-soft">{s.course}</td>
                              <td className="py-3 px-4 text-shnoor-soft text-xs">
                                {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── SUBSCRIPTION ────────────────────────────────────────────── */}
              {activeTab === 'subscription' && (
                <div className="bg-white rounded-xl border border-shnoor-mist p-6 shadow-sm">
                  <SectionTitle>Manage Subscription</SectionTitle>
                  <p className="text-sm text-shnoor-soft mb-6">
                    Activate or renew your organization's subscription to enable test creation and other premium features.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {subscriptionPlans.map(plan => {
                      const isCurrentPlan = plan.plan_id === currentPlanId;
                      return (
                        <div key={plan.id} className={`bg-white rounded-xl border ${isCurrentPlan ? 'border-shnoor-indigo ring-2 ring-shnoor-indigo/20' : 'border-shnoor-mist'} p-6 shadow-sm flex flex-col relative`}>
                          {isCurrentPlan && (
                            <div className="absolute top-0 right-0 bg-shnoor-indigo text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wide">
                              Current Plan
                            </div>
                          )}
                          <h3 className="text-lg font-bold text-shnoor-navy mb-2">{plan.name}</h3>
                          <div className="mb-4 pb-4 border-b border-shnoor-mist">
                            <span className="text-3xl font-extrabold text-shnoor-navy">₹{plan.price_monthly}</span>
                            <span className="text-sm text-shnoor-soft">/month</span>
                          </div>
                          <p className="text-sm text-shnoor-soft mb-4 flex-1">{plan.description}</p>
                          <ul className="text-sm text-shnoor-soft mb-6 space-y-2">
                            {(plan.features || []).map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-shnoor-success">✓</span> {feature}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => handlePurchaseSubscription(plan)}
                            disabled={isCurrentPlan}
                            className={`w-full px-4 py-3 font-bold rounded-xl transition-colors shadow-sm ${
                              isCurrentPlan 
                                ? 'bg-shnoor-lavender text-shnoor-indigo cursor-not-allowed' 
                                : 'bg-shnoor-indigo text-white hover:bg-shnoor-navy'
                            }`}
                          >
                            {isCurrentPlan ? 'Active' : `Purchase ${plan.name}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── REGISTRATION LINK ─────────────────────────────────────── */}
              {activeTab === 'registration' && (
                <div className="flex flex-col gap-6 max-w-2xl">
                  <div className="bg-white rounded-xl border border-shnoor-mist p-6 shadow-sm">
                    <SectionTitle>Student Registration Link</SectionTitle>
                    <p className="text-sm text-shnoor-soft mb-4">
                      Share this unique link with students. When they register using this link, they will automatically be associated with <strong className="text-shnoor-navy">{clientUser?.companyName}</strong>.
                    </p>

                    <div className="bg-shnoor-lavender rounded-lg p-4 mb-4">
                      <p className="text-xs font-bold text-shnoor-soft uppercase tracking-wide mb-2">Registration URL</p>
                      <p className="text-sm font-mono text-shnoor-navy break-all">{registrationUrl}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={copyRegistrationUrl}
                        className="flex-1 h-10 bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors"
                      >
                        📋 Copy Link
                      </button>
                      <a
                        href={registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-10 border border-shnoor-indigo text-shnoor-indigo rounded-lg text-sm font-semibold hover:bg-shnoor-lavender transition-colors flex items-center justify-center"
                      >
                        🔗 Open Link
                      </a>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <p className="text-sm font-bold text-amber-800 mb-2">⚠️ Important Notes</p>
                    <ul className="text-sm text-amber-700 space-y-1.5 list-disc list-inside">
                      <li>This link is unique to your organization — do not share it publicly.</li>
                      <li>Students who register via this link will be automatically scoped to your data.</li>
                      <li>Only institutes belonging to your organization will appear in the dropdown.</li>
                      <li>Contact your super admin if you need a new registration token.</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;

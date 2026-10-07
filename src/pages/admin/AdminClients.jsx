import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, Plus, Building2, Users, Eye, EyeOff, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const adminHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
    {active ? <CheckCircle size={11} /> : <XCircle size={11} />}
    {active ? 'Active' : 'Suspended'}
  </span>
);

const StatPill = ({ label, value }) => (
  <div className="flex flex-col items-center bg-slate-100 dark:bg-gray-800 rounded-lg px-4 py-3 min-w-[80px]">
    <span className="text-xl font-bold text-gray-900 dark:text-white">{value ?? '-'}</span>
    <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wide mt-1">{label}</span>
  </div>
);

/* ─── Edit Client Modal ───────────────────────────────────────────────── */
const EditClientModal = ({ client, onClose, onUpdated, subscriptionPlans = [] }) => {
  const [form, setForm] = useState({
    name: client.name || '',
    company_name: client.company_name || '',
    email: client.email || '',
    phone: client.phone || '',
    company_website: client.company_website || '',
    company_size: client.company_size || '',
    industry: client.industry || '',
    country: client.country || '',
    use_case: client.use_case || '',
    subscription_tier: client.subscription_tier || 'basic',
    max_institutes: String(client.max_institutes ?? 10),
    max_tests: String(client.max_tests ?? 50),
    max_students: String(client.max_students ?? 1000),
    plan_id: client.plan_id || 'Basic',
    subscription_duration: client.subscription_duration || '30_DAYS',
    payment_status: client.payment_status || 'UNPAID',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.company_name.trim() || !form.email.trim()) {
      setError('Name, company name, and email are required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      company_name: form.company_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      company_website: form.company_website.trim() || null,
      company_size: form.company_size.trim() || null,
      industry: form.industry.trim() || null,
      country: form.country.trim() || null,
      use_case: form.use_case.trim() || null,
      status: client.status,
      subscription_tier: form.plan_id?.toLowerCase() || 'basic',
      max_institutes: Math.max(1, parseInt(form.max_institutes, 10) || 1),
      max_tests: Math.max(1, parseInt(form.max_tests, 10) || 1),
      max_students: Math.max(1, parseInt(form.max_students, 10) || 1),
      plan_id: form.plan_id,
      subscription_duration: form.subscription_duration,
      payment_status: form.payment_status,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients/${client.id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const detail = data.detail ? `: ${data.detail}` : '';
        throw new Error(`${data.error || 'Failed to update client'}${detail}`);
      }
      onUpdated(data.client);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl sm:max-w-xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="px-6 py-4 border-b border-shnoor-mist flex items-center justify-between sticky top-0 bg-white z-10 flex-shrink-0">
          <h2 className="text-lg font-bold text-shnoor-navy">Edit Client</h2>
          <button onClick={onClose} className="text-shnoor-soft hover:text-shnoor-navy p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Organization Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Company Name</label>
              <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Admin Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Website</label>
              <input value={form.company_website} onChange={e => setForm(p => ({ ...p, company_website: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Country</label>
              <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Company Size</label>
              <select value={form.company_size} onChange={e => setForm(p => ({ ...p, company_size: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo bg-white">
                <option value="">Select</option>
                <option value="1-50">1-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Industry</label>
              <select value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo bg-white">
                <option value="">Select</option>
                <option value="IT/Software">IT/Software</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Use Case</label>
              <select value={form.use_case} onChange={e => setForm(p => ({ ...p, use_case: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo bg-white">
                <option value="">Select</option>
                <option value="Campus Hiring">Campus Hiring</option>
                <option value="Lateral Hiring">Lateral Hiring</option>
                <option value="Internal Assessment">Internal Assessment</option>
                <option value="Education">Education</option>
              </select>
            </div>
          </div>



          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Max Institutes</label>
              <input type="number" min="1" value={form.max_institutes} onChange={e => setForm(p => ({ ...p, max_institutes: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Max Tests</label>
              <input type="number" min="1" value={form.max_tests} onChange={e => setForm(p => ({ ...p, max_tests: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Max Students</label>
              <input type="number" min="1" value={form.max_students} onChange={e => setForm(p => ({ ...p, max_students: e.target.value }))} disabled={loading}
                className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo" />
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-shnoor-mist">
            <h3 className="text-sm font-bold text-shnoor-navy mb-3">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Plan</label>
                <select
                  value={form.plan_id}
                  onChange={e => {
                    const newPlanId = e.target.value;
                    const selectedPlan = subscriptionPlans.find(p => p.plan_id === newPlanId);
                    setForm(p => ({
                      ...p,
                      plan_id: newPlanId,
                      ...(selectedPlan && {
                        max_institutes: String(selectedPlan.max_institutes ?? p.max_institutes),
                        max_tests: String(selectedPlan.max_tests ?? p.max_tests),
                        max_students: String(selectedPlan.max_students ?? p.max_students),
                      })
                    }));
                  }}
                  disabled={loading}
                  className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo bg-white">
                  {subscriptionPlans.length > 0 ? (
                    <>
                      {form.plan_id === 'trial' && <option value="trial">7-Day Trial</option>}
                      {subscriptionPlans.map(plan => (
                        <option key={plan.id} value={plan.plan_id}>{plan.name}</option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="Super Premium">Super Premium</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Duration</label>
                <select value={form.subscription_duration} onChange={e => setForm(p => ({ ...p, subscription_duration: e.target.value }))} disabled={loading}
                  className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo bg-white">
                  <option value="30_DAYS">30 Days</option>
                  <option value="90_DAYS">90 Days</option>
                  <option value="1_YEAR">1 Year</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Payment</label>
                <select value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))} disabled={loading}
                  className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo bg-white">
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-shnoor-mist bg-white sticky bottom-0 z-10 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={onClose} disabled={loading}
                className="flex-1 h-[42px] border border-shnoor-mist text-shnoor-navy rounded-lg text-sm font-semibold hover:bg-shnoor-lavender transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 h-[42px] bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Input Field Component ───────────────────────────────────────────── */
const InputField = ({ label, name, type = 'text', placeholder, required = false, options = null, value, onChange, disabled, error }) => (
  <div>
    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-10 px-3 rounded-xl border ${error ? 'border-red-500' : 'border-[#D1D1E6]'} bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors`}
      >
        <option value="" className="text-[#9A9AC9]">Select {label}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full h-10 px-3 rounded-xl border ${error ? 'border-red-500' : 'border-[#D1D1E6]'} bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors`}
      />
    )}
    {error && (
      <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-bold">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

/* ─── Create Client Modal ─────────────────────────────────────────────── */
const CreateClientModal = ({ onClose, onCreated, subscriptionPlans = [] }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    phone: '',
    company_website: '',
    company_size: '',
    industry: '',
    country: '',
    use_case: '',
    plan_id: 'Basic',
    subscription_duration: '30_DAYS',
    payment_status: 'UNPAID'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Organization Name
    if (!form.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters';
    }

    // Company Name
    if (!form.company_name.trim()) {
      newErrors.company_name = 'Company/Display name is required';
    } else if (form.company_name.trim().length < 2) {
      newErrors.company_name = 'Company name must be at least 2 characters';
    }

    // Email
    if (!form.email.trim()) {
      newErrors.email = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Phone (optional but validate format if provided)
    if (form.phone && !/^[\d\s\+\-\(\)]{10,}$/.test(form.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Website (optional but validate format if provided)
    if (form.company_website && !/^https?:\/\/.+\..+/.test(form.company_website)) {
      newErrors.company_website = 'Please enter a valid website URL (e.g., https://example.com)';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        company_name: form.company_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || null,
        company_website: form.company_website.trim() || null,
        company_size: form.company_size || null,
        industry: form.industry || null,
        country: form.country.trim() || null,
        use_case: form.use_case || null,
        plan_id: form.plan_id,
        subscription_duration: form.subscription_duration,
        payment_status: form.payment_status
      };

      const res = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Handle specific error messages from backend
        if (data.error?.includes('Email already exists')) {
          setErrors({ email: 'This email is already registered' });
        } else if (data.error?.includes('duplicate key')) {
          setErrors({ email: 'This email is already registered' });
        } else {
          setErrors({ submit: data.error || 'Failed to create client' });
        }
        return;
      }

      onCreated(data.client);
    } catch (err) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full h-auto max-h-[90vh] rounded-2xl shadow-2xl max-w-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#D1D1E6] flex items-center justify-between rounded-t-2xl bg-white z-10 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Create New Client</h2>
          <button type="button" onClick={onClose} className="text-[#9A9AC9] hover:text-gray-900 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="px-6 py-5 flex flex-col gap-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2 font-bold">
                <span className="text-lg">⚠️</span>
                <span>{errors.submit}</span>
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Organization Name"
              name="name"
              placeholder="e.g., Acme Corp"
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              disabled={loading}
              error={errors.name}
            />
            <InputField
              label="Company / Display Name"
              name="company_name"
              placeholder="e.g., Acme Corporation Pvt Ltd"
              required
              value={form.company_name}
              onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
              disabled={loading}
              error={errors.company_name}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Admin Email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              required
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              disabled={loading}
              error={errors.email}
            />
            <InputField
              label="Phone Number"
              name="phone"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              disabled={loading}
              error={errors.phone}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 6 chars, 1 uppercase, 1 number"
                disabled={loading}
                className={`w-full h-10 px-3 pr-10 rounded-xl border ${errors.password ? 'border-red-500' : 'border-[#D1D1E6]'} bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9AC9] hover:text-gray-900"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-bold">
                <span>⚠</span> {errors.password}
              </p>
            )}
          </div>

          <InputField
            label="Company Website"
            name="company_website"
            placeholder="https://www.acme.com"
            value={form.company_website}
            onChange={e => setForm(p => ({ ...p, company_website: e.target.value }))}
            disabled={loading}
            error={errors.company_website}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Company Size"
              name="company_size"
              value={form.company_size}
              onChange={e => setForm(p => ({ ...p, company_size: e.target.value }))}
              disabled={loading}
              error={errors.company_size}
              options={[
                { value: '1-50', label: '1-50 employees' },
                { value: '51-200', label: '51-200 employees' },
                { value: '201-500', label: '201-500 employees' },
                { value: '500+', label: '500+ employees' }
              ]}
            />
            <InputField
              label="Industry"
              name="industry"
              value={form.industry}
              onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
              disabled={loading}
              error={errors.industry}
              options={[
                { value: 'IT/Software', label: 'IT/Software' },
                { value: 'Education', label: 'Education' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Healthcare', label: 'Healthcare' },
                { value: 'Manufacturing', label: 'Manufacturing' },
                { value: 'Retail', label: 'Retail' },
                { value: 'Other', label: 'Other' }
              ]}
            />
            <InputField
              label="Country"
              name="country"
              placeholder="e.g., India"
              value={form.country}
              onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
              disabled={loading}
              error={errors.country}
            />
          </div>

          <InputField
            label="Primary Use Case"
            name="use_case"
            value={form.use_case}
            onChange={e => setForm(p => ({ ...p, use_case: e.target.value }))}
            disabled={loading}
            error={errors.use_case}
            options={[
              { value: 'Campus Hiring', label: 'Campus Hiring' },
              { value: 'Lateral Hiring', label: 'Lateral Hiring' },
              { value: 'Internal Assessment', label: 'Internal Assessment' },
              { value: 'Education', label: 'Education' },
              { value: 'Certification', label: 'Certification' },
              { value: 'Other', label: 'Other' }
            ]}
          />

          {/* Subscription Details Section */}
          <div className="mt-2 pt-4 border-t border-shnoor-mist">
            <h3 className="text-sm font-bold text-shnoor-navy mb-3">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Plan"
                name="plan_id"
                value={form.plan_id}
                onChange={e => {
                  const newPlanId = e.target.value;
                  const selectedPlan = subscriptionPlans.find(p => p.plan_id === newPlanId);
                  setForm(p => ({
                    ...p,
                    plan_id: newPlanId,
                    ...(selectedPlan && {
                      max_institutes: String(selectedPlan.max_institutes ?? p.max_institutes),
                      max_tests: String(selectedPlan.max_tests ?? p.max_tests),
                      max_students: String(selectedPlan.max_students ?? p.max_students),
                    })
                  }));
                }}
                disabled={loading}
                required
                options={subscriptionPlans.length > 0
                  ? subscriptionPlans.map(plan => ({ value: plan.plan_id, label: plan.name }))
                  : [
                    { value: 'Basic', label: 'Basic' },
                    { value: 'Premium', label: 'Premium' },
                    { value: 'Super Premium', label: 'Super Premium' }
                  ]
                }
              />
              <InputField
                label="Subscription Duration"
                name="subscription_duration"
                value={form.subscription_duration}
                onChange={e => setForm(p => ({ ...p, subscription_duration: e.target.value }))}
                disabled={loading}
                required
                options={[
                  { value: '30_DAYS', label: '30 Days' },
                  { value: '90_DAYS', label: '90 Days' },
                  { value: '1_YEAR', label: '1 Year' }
                ]}
              />
              <InputField
                label="Payment Status"
                name="payment_status"
                value={form.payment_status}
                onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}
                disabled={loading}
                required
                options={[
                  { value: 'UNPAID', label: 'Unpaid' },
                  { value: 'PAID', label: 'Paid' }
                ]}
              />
            </div>
            <p className="text-xs text-shnoor-soft mt-2">
              Note: Duration starts from today.
            </p>
          </div>
          </div>
          <div className="px-6 py-4 border-t border-[#D1D1E6] bg-white rounded-b-2xl z-10 flex-shrink-0 mt-auto">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 md:flex-none md:w-32 h-12 border border-[#D1D1E6] text-[#9A9AC9] font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 md:flex-none md:w-48 h-12 bg-[#403f75] hover:bg-[#2d2d53] text-white font-bold rounded-xl text-sm transition-colors relative shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="absolute top-1/2 left-1/2 -ml-2.5 -mt-2.5 w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Create Client'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Success Modal ───────────────────────────────────────────────────── */
const CreatedModal = ({ client, onClose }) => {
  const regUrl = `${window.location.origin}/register?clientToken=${client.registration_token}`;
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const copy = (text, set) => { navigator.clipboard.writeText(text).then(() => { set(true); setTimeout(() => set(false), 2000); }); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-shnoor-mist flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-shnoor-navy">Client Created Successfully</h2>
            <p className="text-xs text-shnoor-soft">{client.company_name || client.name}</p>
          </div>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            ⚠️ Save these credentials now — the password cannot be retrieved later.
          </div>
          <div>
            <label className="block text-xs font-bold text-shnoor-soft uppercase tracking-wide mb-1.5">Registration Token</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-shnoor-lavender rounded-lg px-3 py-2 text-xs font-mono text-shnoor-navy break-all">{client.registration_token}</code>
              <button onClick={() => copy(client.registration_token, setCopiedToken)}
                className={`flex-shrink-0 h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${copiedToken ? 'bg-emerald-100 text-emerald-700' : 'bg-shnoor-indigo text-white hover:bg-shnoor-navy'}`}>
                {copiedToken ? '✓ Copied' : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-shnoor-soft uppercase tracking-wide mb-1.5">Student Registration URL</label>
            <div className="flex items-center gap-2">
              <input readOnly value={regUrl} className="flex-1 h-9 px-3 rounded-lg border border-shnoor-mist bg-shnoor-lavender text-xs font-mono text-shnoor-navy" />
              <button onClick={() => copy(regUrl, setCopiedUrl)}
                className={`flex-shrink-0 h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${copiedUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-shnoor-indigo text-white hover:bg-shnoor-navy'}`}>
                {copiedUrl ? '✓ Copied' : <Copy size={14} />}
              </button>
            </div>
            <p className="text-xs text-shnoor-soft mt-1.5">Share this URL with the client's students for registration.</p>
          </div>
          <div className="bg-shnoor-lavender rounded-lg px-4 py-3">
            <p className="text-xs font-bold text-shnoor-navy mb-1">Client Admin Login</p>
            <p className="text-xs text-shnoor-soft">URL: <span className="font-mono text-shnoor-navy">{window.location.origin}/login?portal=org</span></p>
            <p className="text-xs text-shnoor-soft">Email: <span className="font-mono text-shnoor-navy">{client.email}</span></p>
          </div>
          <button onClick={onClose} className="w-full h-[46px] bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Client Detail Panel ─────────────────────────────────────────────── */
const ClientDetailPanel = ({ client, onClose, onStatusChange, onDelete, onClientUpdated, subscriptionPlans = [] }) => {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const regUrl = `${window.location.origin}/register?clientToken=${client.registration_token}`;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/clients/${client.id}/stats`, { headers: adminHeaders() });
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch { } finally { setLoadingStats(false); }
    })();
  }, [client.id]);

  const toggleStatus = async () => {
    setActionLoading(true);
    const newStatus = client.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`${API_URL}/api/clients/${client.id}`, {
        method: 'PUT', headers: adminHeaders(),
        body: JSON.stringify({ ...client, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) onStatusChange({ ...client, status: newStatus });
    } catch { } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${client.name}" and ALL their data? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients/${client.id}`, { method: 'DELETE', headers: adminHeaders() });
      const data = await res.json();
      if (data.success) { onDelete(client.id); onClose(); }
    } catch { } finally { setActionLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(regUrl).then(() => { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#11111d] w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl sm:max-w-lg flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-[#11111d] z-10 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{client.company_name || client.name}</h2>
            <p className="text-sm text-[#6A6A9D] dark:text-gray-400 mt-0.5">{client.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">✕</button>
        </div>
        <div className="px-6 py-3 flex flex-col gap-3 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <StatusBadge active={client.status === 'active'} />
            {loadingStats
              ? <div className="w-5 h-5 border-2 border-shnoor-indigo border-t-transparent rounded-full animate-spin" />
              : <div className="flex gap-2">
                <StatPill label="Tests" value={stats?.total_tests} />
                <StatPill label="Students" value={stats?.total_students} />
                <StatPill label="Institutes" value={stats?.total_institutes} />
              </div>
            }
          </div>
          <div>
            <label className="block text-sm font-bold text-[#4A4A7A] dark:text-gray-300 uppercase tracking-wide mb-1.5">Student Registration URL</label>
            <div className="flex items-center gap-2">
              <input readOnly value={regUrl} className="flex-1 min-w-0 h-[38px] px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono text-gray-700 dark:text-gray-200" />
              <button onClick={copy}
                className={`flex-shrink-0 h-[38px] px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${copiedUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-[#403f75] dark:bg-[#383863] text-white hover:bg-[#2d2d53] dark:hover:bg-[#2a2a4a]'}`}>
                {copiedUrl ? '✓ Copied' : <Copy size={16} />}
              </button>
              <a href={regUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 h-[38px] px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[#403f75] dark:hover:text-white transition-colors flex items-center justify-center">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#4A4A7A] dark:text-gray-300 uppercase tracking-wide mb-1.5">Registration Token</label>
            <div className="bg-slate-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <code className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{client.registration_token}</code>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide mb-3">SUBSCRIPTION DETAILS</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm break-words">
              <div><span className="text-[#9A9AC9] block mb-0.5">Plan</span><p className="font-semibold text-gray-900">{subscriptionPlans.find(p => p.plan_id === client.plan_id)?.name || client.plan_id || 'Basic'}</p></div>
              <div><span className="text-[#9A9AC9] block mb-1">Duration</span><p className="font-semibold text-gray-900 capitalize">{client.subscription_duration?.toLowerCase().replace('_', ' ') || '30 days'}</p></div>
              <div>
                <span className="text-[#9A9AC9] block mb-1">Payment</span>
                <p className={`font-semibold ${client.payment_status === 'PAID' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {client.payment_status || 'UNPAID'}
                </p>
              </div>
              <div><span className="text-[#9A9AC9] block mb-1">Created On</span><p className="font-semibold text-gray-900">{new Date(client.created_at).toLocaleDateString('en-IN')}</p></div>
              <div><span className="text-[#9A9AC9] block mb-1">Start Date</span><p className="font-semibold text-gray-900">{client.subscription_start_date ? new Date(client.subscription_start_date).toLocaleDateString('en-IN') : '-'}</p></div>
              <div><span className="text-[#9A9AC9] block mb-1">Expiry Date</span><p className="font-semibold text-gray-900">{client.subscription_end_date ? new Date(client.subscription_end_date).toLocaleDateString('en-IN') : '-'}</p></div>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-shnoor-mist bg-white sticky bottom-0 z-10 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setShowEdit(true)} disabled={actionLoading}
              className="flex-1 h-[38px] border border-gray-200 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Pencil size={18} /> Edit Client
            </button>
            <button onClick={toggleStatus} disabled={actionLoading}
              className={`flex-1 h-[38px] rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${client.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-[#dcfce7] text-[#166534] hover:bg-green-200'}`}>
              {client.status === 'active' ? 'Suspend Client' : 'Activate Client'}
            </button>
            <button onClick={handleDelete} disabled={actionLoading}
              className="flex-1 h-[38px] bg-[#fee2e2] text-[#991b1b] rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors flex items-center justify-center gap-2">
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      </div>
      {showEdit && (
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onUpdated={(updatedClient) => {
            onClientUpdated({ ...client, ...updatedClient });
            setShowEdit(false);
          }}
          subscriptionPlans={subscriptionPlans}
        />
      )}
    </div>
  );
};

/* ─── Main AdminClients Page ──────────────────────────────────────────── */
const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createdClient, setCreatedClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscription-plans/all`, { headers: adminHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscriptionPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to load subscription plans:', err);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/clients`, { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load clients');
      setClients(data.clients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchSubscriptionPlans();
  }, [fetchClients, fetchSubscriptionPlans]);

  const handleCreated = (newClient) => {
    setShowCreate(false);
    setCreatedClient(newClient);
    fetchClients();
  };

  const handleStatusChange = (updated) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedClient(updated);
  };

  const handleDelete = (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleClientUpdated = (updated) => {
    setClients(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setSelectedClient(updated);
  };

  const filtered = clients.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = clients.filter(c => c.status === 'active').length;

  return (
    <AdminLayout title="Client Management">
      <div className="flex flex-col gap-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 h-10 px-4 border border-[#D1D1E6] bg-transparent text-[#9A9AC9] rounded-xl text-sm font-semibold hover:bg-white hover:border-gray-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Client Management</h2>
              <p className="text-sm text-[#9A9AC9] mt-0.5">{clients.length} total · {activeCount} active</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <button onClick={fetchClients} className="h-10 px-4 border border-[#D1D1E6] bg-transparent text-[#9A9AC9] rounded-xl text-sm font-semibold hover:bg-white hover:border-gray-300 transition-colors flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center justify-center gap-2 h-10 px-5 bg-[#403f75] text-white rounded-xl text-sm font-semibold hover:bg-[#2d2d53] transition-colors shadow-sm">
              <Plus size={16} /> New Client
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', value: clients.length, icon: <Building2 size={20} />, color: 'bg-[#403f75]' },
            { label: 'Active', value: activeCount, icon: <CheckCircle size={20} />, color: 'bg-emerald-500' },
            { label: 'Suspended', value: clients.length - activeCount, icon: <XCircle size={20} />, color: 'bg-amber-500' },
            { label: 'Total Students', value: clients.reduce((s, c) => s + (parseInt(c.students_count) || 0), 0), icon: <Users size={20} />, color: 'bg-[#9333ea]' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${color}`}>{icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-[#9A9AC9] mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or company..."
            className="w-full h-[52px] pl-12 pr-4 rounded-2xl bg-white text-sm text-gray-900 placeholder-[#9A9AC9] focus:outline-none focus:ring-2 focus:ring-[#403f75] transition-colors shadow-sm" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9AC9]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
            {error}
            <button onClick={fetchClients} className="flex items-center gap-1 text-xs font-semibold hover:underline ml-4 flex-shrink-0">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-shnoor-indigo border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-shnoor-mist p-12 text-center">
            <Building2 size={40} className="mx-auto text-shnoor-mist mb-3" />
            <p className="text-shnoor-soft text-sm font-medium">
              {search ? 'No clients match your search.' : 'No clients yet. Create your first one.'}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors">
                <Plus size={14} /> Create Client
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100/90 dark:bg-[#1a1a2e] text-slate-900 dark:text-gray-200 border-b border-slate-200 dark:border-[#383863]">
                  <tr>
                    <th className="px-5 py-4 font-bold tracking-wide">Organization</th>
                    <th className="px-5 py-4 font-bold tracking-wide">Plan</th>
                    <th className="px-5 py-4 font-bold tracking-wide">Duration</th>
                    <th className="px-5 py-4 font-bold tracking-wide">Payment</th>
                    <th className="px-5 py-4 font-bold tracking-wide">Expiry Date</th>
                    <th className="px-5 py-4 font-bold tracking-wide">Days Left</th>
                    <th className="px-5 py-4 font-bold tracking-wide">Status</th>
                    <th className="px-5 py-4 font-bold tracking-wide text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(client => {
                    let daysLeft = '-';
                    if (client.subscription_end_date) {
                      const diff = new Date(client.subscription_end_date).getTime() - new Date().getTime();
                      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      daysLeft = days > 0 ? `${days} days` : 'Expired';
                    }

                    return (
                      <tr key={client.id} className="hover:bg-gray-50/50 dark:hover:bg-[#2a2a4a] transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                              <Building2 size={18} className="text-[#6A6A9D] dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{client.company_name || client.name}</p>
                              <p className="text-sm text-[#9A9AC9] dark:text-gray-400">{client.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-200">
                          {client.plan_id === 'trial' ? '7-Day Trial' : (subscriptionPlans.find(p => p.plan_id === client.plan_id)?.name || client.plan_id || 'Basic')}
                        </td>
                        <td className="px-5 py-4 text-[#9A9AC9] dark:text-gray-400 capitalize">
                          {client.plan_id === 'trial' ? '7 Days' : (client.subscription_duration?.toLowerCase().replace('_', ' ') || '30 Days')}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${client.payment_status === 'PAID' ? 'bg-[#dcfce7] dark:bg-green-900/30 text-[#166534] dark:text-green-400' : 'bg-[#fee2e2] dark:bg-red-900/30 text-[#991b1b] dark:text-red-400'}`}>
                            {client.payment_status || 'UNPAID'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#9A9AC9] dark:text-gray-400">
                          {client.subscription_end_date ? new Date(client.subscription_end_date).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-200">
                          <span className={`${daysLeft === 'Expired' ? 'text-red-600 dark:text-red-400' : (parseInt(daysLeft) <= 7 ? 'text-amber-500 dark:text-amber-400' : 'text-gray-900 dark:text-gray-200')}`}>
                            {daysLeft}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${client.status === 'active' ? 'bg-[#dcfce7] dark:bg-green-900/30 text-[#166534] dark:text-green-400' : 'bg-[#fee2e2] dark:bg-red-900/30 text-[#991b1b] dark:text-red-400'}`}>
                            {client.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {client.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="h-8 px-4 bg-slate-100 dark:bg-[#383863] hover:bg-slate-200 dark:hover:bg-[#403f75] text-slate-800 dark:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreate && <CreateClientModal onClose={() => setShowCreate(false)} onCreated={handleCreated} subscriptionPlans={subscriptionPlans} />}
        {createdClient && <CreatedModal client={createdClient} onClose={() => setCreatedClient(null)} />}
        {selectedClient && (
          <ClientDetailPanel
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onClientUpdated={handleClientUpdated}
            subscriptionPlans={subscriptionPlans}
          />
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminClients;

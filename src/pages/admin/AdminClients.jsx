import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Plus, Eye, EyeOff, Trash2, RefreshCw, Users, Building2, CheckCircle, XCircle, ExternalLink, Pencil, ArrowLeft } from 'lucide-react';
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
  <div className="flex flex-col items-center bg-shnoor-lavender rounded-lg px-4 py-2 min-w-[70px]">
    <span className="text-lg font-bold text-shnoor-navy">{value ?? '—'}</span>
    <span className="text-[10px] text-shnoor-soft uppercase tracking-wide">{label}</span>
  </div>
);

/* ─── Edit Client Modal ───────────────────────────────────────────────── */
const EditClientModal = ({ client, onClose, onUpdated }) => {
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
      subscription_tier: form.subscription_tier,
      max_institutes: Math.max(1, parseInt(form.max_institutes, 10) || 1),
      max_tests: Math.max(1, parseInt(form.max_tests, 10) || 1),
      max_students: Math.max(1, parseInt(form.max_students, 10) || 1),
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients/${client.id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update client');
      onUpdated(data.client);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="px-6 py-5 border-b border-shnoor-mist flex items-center justify-between">
          <h2 className="text-base font-bold text-shnoor-navy">Edit Client</h2>
          <button onClick={onClose} className="text-shnoor-soft hover:text-shnoor-navy">✕</button>
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
          
          <div>
            <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Subscription Tier</label>
            <select value={form.subscription_tier} onChange={e => setForm(p => ({ ...p, subscription_tier: e.target.value }))} disabled={loading}
              className="w-full h-[42px] px-3 rounded-lg border border-shnoor-mist text-sm focus:outline-none focus:border-shnoor-indigo bg-white">
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
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

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 h-[44px] border border-shnoor-mist text-shnoor-navy rounded-lg text-sm font-semibold hover:bg-shnoor-lavender transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-[44px] bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Create Client Modal ─────────────────────────────────────────────── */
const CreateClientModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', company_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.company_name.trim()) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/clients`, {
        method: 'POST', headers: adminHeaders(),
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, company_name: form.company_name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create client');
      onCreated(data.client);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fields = [
    { label: 'Organization Name', key: 'name', placeholder: 'e.g. Acme Corp' },
    { label: 'Company / Display Name', key: 'company_name', placeholder: 'e.g. Acme Corporation Pvt Ltd' },
    { label: 'Admin Email', key: 'email', placeholder: 'admin@acme.com', type: 'email' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-shnoor-mist flex items-center justify-between">
          <h2 className="text-base font-bold text-shnoor-navy">Create New Client</h2>
          <button onClick={onClose} className="text-shnoor-soft hover:text-shnoor-navy">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
          {fields.map(({ label, key, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder} disabled={loading}
                className="w-full h-[46px] px-4 rounded-lg border border-shnoor-mist bg-white text-sm text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo transition-colors" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-shnoor-navy uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 6 characters" disabled={loading}
                className="w-full h-[46px] px-4 pr-12 rounded-lg border border-shnoor-mist bg-white text-sm text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo transition-colors" />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-shnoor-soft hover:text-shnoor-navy p-1">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 h-[46px] border border-shnoor-mist text-shnoor-navy rounded-lg text-sm font-semibold hover:bg-shnoor-lavender transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-[46px] bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors relative">
              {loading
                ? <div className="absolute top-1/2 left-1/2 -ml-2.5 -mt-2.5 w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                : 'Create Client'}
            </button>
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
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
const ClientDetailPanel = ({ client, onClose, onStatusChange, onDelete, onClientUpdated }) => {
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
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-shnoor-mist flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-shnoor-navy">{client.company_name || client.name}</h2>
            <p className="text-xs text-shnoor-soft">{client.email}</p>
          </div>
          <button onClick={onClose} className="text-shnoor-soft hover:text-shnoor-navy p-1">✕</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
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
            <label className="block text-xs font-bold text-shnoor-soft uppercase tracking-wide mb-1.5">Student Registration URL</label>
            <div className="flex items-center gap-2">
              <input readOnly value={regUrl} className="flex-1 h-9 px-3 rounded-lg border border-shnoor-mist bg-shnoor-lavender text-xs font-mono text-shnoor-navy" />
              <button onClick={copy}
                className={`flex-shrink-0 h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${copiedUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-shnoor-indigo text-white hover:bg-shnoor-navy'}`}>
                {copiedUrl ? '✓' : <Copy size={14} />}
              </button>
              <a href={regUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 h-9 px-3 rounded-lg border border-shnoor-mist text-shnoor-soft hover:text-shnoor-indigo transition-colors flex items-center">
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-shnoor-soft uppercase tracking-wide mb-1.5">Registration Token</label>
            <code className="block bg-shnoor-lavender rounded-lg px-3 py-2 text-xs font-mono text-shnoor-navy break-all">{client.registration_token}</code>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-shnoor-soft">Created</span><p className="font-semibold text-shnoor-navy mt-0.5">{new Date(client.created_at).toLocaleDateString('en-IN')}</p></div>
            <div><span className="text-shnoor-soft">Last Login</span><p className="font-semibold text-shnoor-navy mt-0.5">{client.last_login ? new Date(client.last_login).toLocaleDateString('en-IN') : 'Never'}</p></div>
            <div><span className="text-shnoor-soft">Tier</span><p className="font-semibold text-shnoor-navy mt-0.5 capitalize">{client.subscription_tier || 'basic'}</p></div>
            <div><span className="text-shnoor-soft">Max Students</span><p className="font-semibold text-shnoor-navy mt-0.5">{client.max_students}</p></div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowEdit(true)} disabled={actionLoading}
              className="flex-1 h-10 bg-shnoor-lavender text-shnoor-navy rounded-lg text-sm font-semibold hover:bg-shnoor-mist transition-colors flex items-center justify-center gap-2">
              <Pencil size={14} /> Edit Client
            </button>
            <button onClick={toggleStatus} disabled={actionLoading}
              className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-colors ${client.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
              {client.status === 'active' ? 'Suspend Client' : 'Activate Client'}
            </button>
            <button onClick={handleDelete} disabled={actionLoading}
              className="flex-1 h-10 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
              <Trash2 size={14} /> Delete
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

  useEffect(() => { fetchClients(); }, [fetchClients]);

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 h-9 px-3 border border-shnoor-mist text-shnoor-soft rounded-lg text-sm font-medium hover:bg-shnoor-lavender hover:text-shnoor-navy transition-colors flex-shrink-0"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-shnoor-navy">Client Management</h2>
              <p className="text-sm text-shnoor-soft mt-0.5">{clients.length} total · {activeCount} active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchClients} className="h-10 px-4 border border-shnoor-mist text-shnoor-soft rounded-lg text-sm hover:bg-shnoor-lavender transition-colors flex items-center gap-2">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 h-10 px-5 bg-shnoor-indigo text-white rounded-lg text-sm font-semibold hover:bg-shnoor-navy transition-colors shadow-sm">
              <Plus size={16} /> New Client
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Clients', value: clients.length, icon: <Building2 size={18} />, color: 'bg-shnoor-indigo' },
            { label: 'Active', value: activeCount, icon: <CheckCircle size={18} />, color: 'bg-emerald-500' },
            { label: 'Suspended', value: clients.length - activeCount, icon: <XCircle size={18} />, color: 'bg-amber-500' },
            { label: 'Total Students', value: clients.reduce((s, c) => s + (parseInt(c.students_count) || 0), 0), icon: <Users size={18} />, color: 'bg-purple-500' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-shnoor-mist p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${color}`}>{icon}</div>
              <div>
                <p className="text-xl font-bold text-shnoor-navy">{value}</p>
                <p className="text-xs text-shnoor-soft">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or company..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-shnoor-mist bg-white text-sm text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo transition-colors" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-shnoor-soft" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className="flex flex-col gap-3">
            {filtered.map(client => (
              <div key={client.id} onClick={() => setSelectedClient(client)}
                className="bg-white rounded-xl border border-shnoor-mist p-4 flex items-center gap-4 shadow-sm hover:border-shnoor-indigo hover:shadow-md transition-all cursor-pointer group">
                <div className="w-11 h-11 rounded-xl bg-shnoor-indigo/10 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-shnoor-indigo" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-shnoor-navy text-sm truncate">{client.company_name || client.name}</p>
                    <StatusBadge active={client.status === 'active'} />
                  </div>
                  <p className="text-xs text-shnoor-soft truncate mt-0.5">{client.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <StatPill label="Students" value={client.students_count || 0} />
                  <StatPill label="Tests" value={client.tests_count || 0} />
                </div>
                <svg className="text-shnoor-mist group-hover:text-shnoor-indigo transition-colors flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreate && <CreateClientModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
        {createdClient && <CreatedModal client={createdClient} onClose={() => setCreatedClient(null)} />}
        {selectedClient && (
          <ClientDetailPanel
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onClientUpdated={handleClientUpdated}
          />
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminClients;

// src/components/admin/AdminJobOpenings.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Send, Trash2, X, Building2, Clock, ExternalLink, CheckCircle, XCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, Users, Link as LinkIcon, TestTube } from 'lucide-react';
import { apiFetch } from '../../config/api';

const EMPTY_FORM = {
    company_name: '',
    job_role: '',
    job_description: '',
    registration_deadline: '',
    eligibility_criteria: '',
    application_link: ''
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const adminHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };
};

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminJobOpenings({ clientId }) {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [publishingId, setPublishingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [toast, setToast] = useState(null);
    const [showTestLinkModal, setShowTestLinkModal] = useState(null);
    const [tests, setTests] = useState([]);
    const [linkedTests, setLinkedTests] = useState({});
    const [linkingTest, setLinkingTest] = useState(false);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4500);
    };

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/job-openings', { headers: adminHeaders() });
            const data = await res.json();
            if (data.success) setJobs(data.data);
            else showToast('error', data.message || 'Failed to load jobs');
        } catch {
            showToast('error', 'Network error — could not load job openings.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTests = async () => {
        try {
            const res = await apiFetch('/api/tests', { headers: adminHeaders() });
            const data = await res.json();
            if (data.success) {
                const testsFromApi = data.tests || data.data || [];
                const publishedOnly = testsFromApi.filter((test) => test.status === 'published');
                const normalizedTests = publishedOnly.map((test) => ({
                    ...test,
                    display_name: test.test_name || test.title || test.name || 'Untitled Test',
                    display_duration: test.time_limit ?? test.duration ?? '—',
                    display_question_count: Number(test.question_count || 0),
                    display_total_marks: test.total_marks ?? '—'
                }));
                setTests(normalizedTests);
            }
        } catch {
            showToast('error', 'Failed to load tests');
        }
    };

    const fetchLinkedTests = async (jobId) => {
        try {
            const res = await apiFetch(`/api/job-openings/${jobId}/linked-tests`, {
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setLinkedTests(prev => ({ ...prev, [jobId]: data.data }));
            }
        } catch (err) {
            console.error('Failed to fetch linked tests:', err);
        }
    };

    const handleLinkTest = async (jobId, testId) => {
        setLinkingTest(true);
        try {
            const res = await apiFetch(`/api/job-openings/${jobId}/link-test`, {
                method: 'POST',
                headers: adminHeaders(),
                body: JSON.stringify({
                    test_id: testId,
                    is_mandatory: true,
                    passing_criteria: 50
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Test linked successfully!');
                fetchLinkedTests(jobId);
            } else {
                showToast('error', data.message || 'Failed to link test');
            }
        } catch {
            showToast('error', 'Network error');
        } finally {
            setLinkingTest(false);
        }
    };

    const handleUnlinkTest = async (jobId, testId) => {
        if (!window.confirm('Remove this test from the job opening?')) return;

        try {
            const res = await apiFetch(`/api/job-openings/${jobId}/unlink-test/${testId}`, {
                method: 'DELETE',
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Test unlinked successfully');
                fetchLinkedTests(jobId);
            } else {
                showToast('error', data.message || 'Failed to unlink test');
            }
        } catch {
            showToast('error', 'Network error');
        }
    };

    const openTestLinkModal = async (jobId) => {
        setShowTestLinkModal(jobId);
        if (tests.length === 0) await fetchTests();
        await fetchLinkedTests(jobId);
    };

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                ...(clientId ? { client_id: clientId } : {})
            };
            const res = await apiFetch('/api/job-openings', {
                method: 'POST',
                headers: adminHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Job opening saved as draft. Press "Publish" to activate it.');
                setForm(EMPTY_FORM);
                setShowForm(false);
                fetchJobs();
            } else {
                showToast('error', data.message || 'Failed to create job opening.');
            }
        } catch {
            showToast('error', 'Network error — could not create job opening.');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async (id) => {
        if (!window.confirm('Publish this job opening? It will become active for students.')) return;
        setPublishingId(id);
        try {
            const res = await apiFetch(`/api/job-openings/${id}/publish`, {
                method: 'POST',
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Job opening published successfully.');
                fetchJobs();
            } else {
                showToast('error', data.message || 'Failed to publish.');
            }
        } catch {
            showToast('error', 'Network error — could not publish.');
        } finally {
            setPublishingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this job opening permanently?')) return;
        setDeletingId(id);
        try {
            const res = await apiFetch(`/api/job-openings/${id}`, {
                method: 'DELETE',
                headers: adminHeaders()
            });
            const data = await res.json();
            if (data.success) {
                showToast('success', 'Job opening deleted.');
                fetchJobs();
            } else {
                showToast('error', data.message || 'Failed to delete.');
            }
        } catch {
            showToast('error', 'Network error — could not delete.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 sm:max-w-md z-50 flex items-center space-x-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all
                    ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="flex-1 min-w-0 break-words">{toast.msg}</span>
                    <button onClick={() => setToast(null)}><X size={16} /></button>
                </div>
            )}

            {/* Section Header */}
            <div className="section-header">
                <div className="section-header-left">
                    <h2 className="section-title">Job Openings &amp; Off-Campus Hiring</h2>
                    <p className="section-subtitle">
                        Post and manage job opportunities for students.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
                    className="admin-create-test-btn"
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    <span>{showForm ? 'Cancel' : 'Post New Job'}</span>
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="surface-card mb-6">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                        <div>
                            <h3 className="section-title">New Job Opening</h3>
                            <p className="section-subtitle">Fill in the opportunity details</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Close form"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="form-label">
                                    Company Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.company_name}
                                    onChange={e => setForm({ ...form, company_name: e.target.value })}
                                    placeholder="e.g. Google, Infosys, TCS"
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">
                                    Job Role <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.job_role}
                                    onChange={e => setForm({ ...form, job_role: e.target.value })}
                                    placeholder="e.g. Software Engineer, Data Analyst"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">
                                Job Description <span className="required">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={form.job_description}
                                onChange={e => setForm({ ...form, job_description: e.target.value })}
                                placeholder="Describe the role, responsibilities, skills required…"
                                className="form-textarea resize-none"
                            />
                        </div>

                        <div>
                            <label className="form-label">
                                Eligibility Criteria <span className="required">*</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={form.eligibility_criteria}
                                onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })}
                                placeholder="e.g. B.Tech CSE/IT, CGPA ≥ 7.0, No active backlogs…"
                                className="form-textarea resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="form-label">
                                    Registration Deadline <span className="required">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.registration_deadline}
                                    onChange={e => setForm({ ...form, registration_deadline: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">
                                    Application Link <span className="required">*</span>
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={form.application_link}
                                    onChange={e => setForm({ ...form, application_link: e.target.value })}
                                    placeholder="https://company.com/careers/apply"
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="admin-create-test-btn"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                <span>{saving ? 'Saving…' : 'Save as Draft'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Jobs list */}
            <div className="surface-card !p-0 overflow-hidden">
                <div className="card-header-bar">
                    <p className="card-header-title">
                        {jobs.length} Job Posting{jobs.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-shnoor-indigoMedium">
                        <Loader2 size={28} className="animate-spin mr-3" />
                        <span>Loading job openings…</span>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Briefcase size={32} />
                        </div>
                        <h4 className="empty-state-title">No job postings yet.</h4>
                        <p className="empty-state-subtitle">
                            Click &ldquo;Post New Job&rdquo; to add the first one.
                        </p>
                        {!showForm && (
                            <button
                                type="button"
                                onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}
                                className="btn-secondary mt-1"
                            >
                                <Plus size={14} />
                                <span>Post New Job</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-shnoor-mist">
                        {jobs.map(job => (
                            <div key={job.id} className="px-4 py-4 sm:px-8 sm:py-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex items-center gap-x-3 flex-wrap gap-y-2">
                                            <h3 className="text-lg font-bold text-shnoor-navy truncate min-w-0">{job.job_role}</h3>
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${job.is_published
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {job.is_published ? '✓ Published' : '● Draft'}
                                            </span>
                                            <button
                                                onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                                                title="Toggle details"
                                                className="sm:hidden ml-auto flex items-center justify-center w-10 h-10 -mr-2 rounded-lg text-shnoor-indigoMedium hover:bg-shnoor-lavender transition-colors"
                                            >
                                                {expandedId === job.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-x-4 mt-2 text-sm text-shnoor-indigoMedium flex-wrap gap-y-2">
                                            <span className="flex items-center min-w-0 max-w-full">
                                                <Building2 size={14} className="mr-1 shrink-0" />
                                                <span className="truncate">{job.company_name}</span>
                                            </span>
                                            <span className="flex items-center">
                                                <Clock size={14} className="mr-1 shrink-0" />
                                                Deadline: {fmtDate(job.registration_deadline)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                        <button
                                            onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                                            title="Toggle details"
                                            className="hidden sm:flex items-center justify-center p-2 rounded-lg text-shnoor-indigoMedium hover:bg-shnoor-lavender transition-colors"
                                        >
                                            {expandedId === job.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>

                                        {job.is_published && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        const isClient = window.location.pathname.startsWith('/client') || Boolean(clientId);
                                                        navigate(isClient ? `/client/job-applicants/${job.id}` : `/admin/job-applicants/${job.id}`);
                                                    }}
                                                    title="View applicants"
                                                    className="flex-1 sm:flex-none min-w-0 min-h-[40px] flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 bg-theme-accent hover:bg-theme-accent2 text-white rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm cursor-pointer"
                                                >
                                                    <Users size={16} className="hidden sm:block shrink-0" />
                                                    <span>View Applicants</span>
                                                </button>

                                                <button
                                                    onClick={() => openTestLinkModal(job.id)}
                                                    title="Link tests to this job"
                                                    className="flex-1 sm:flex-none min-w-0 min-h-[40px] flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 bg-theme-accent2 hover:bg-theme-accent text-white rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm cursor-pointer"
                                                >
                                                    <TestTube size={16} className="hidden sm:block shrink-0" />
                                                    <span>Link Tests</span>
                                                </button>
                                            </>
                                        )}

                                        {!job.is_published && (
                                            <button
                                                onClick={() => handlePublish(job.id)}
                                                disabled={publishingId === job.id}
                                                title="Publish & send emails"
                                                className="flex-1 sm:flex-none min-h-[40px] flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-accent hover:bg-theme-accent2 text-white rounded-xl text-sm font-semibold whitespace-nowrap transition-all disabled:opacity-60 cursor-pointer"
                                            >
                                                {publishingId === job.id
                                                    ? <Loader2 size={16} className="animate-spin" />
                                                    : <Send size={16} />}
                                                <span>{publishingId === job.id ? 'Publishing…' : 'Publish'}</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            disabled={deletingId === job.id}
                                            title="Delete"
                                            className="shrink-0 ml-auto sm:ml-0 flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-60 cursor-pointer"
                                        >
                                            {deletingId === job.id
                                                ? <Loader2 size={18} className="animate-spin" />
                                                : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {expandedId === job.id && (
                                    <div className="mt-4 space-y-3 text-sm text-theme-text bg-theme-panel border border-theme-border rounded-xl p-4 sm:p-5 break-words">
                                        <div>
                                            <p className="font-semibold text-theme-muted uppercase text-xs tracking-wider mb-1">Job Description</p>
                                            <p className="whitespace-pre-wrap">{job.job_description}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-theme-muted uppercase text-xs tracking-wider mb-1">Eligibility Criteria</p>
                                            <p className="whitespace-pre-wrap">{job.eligibility_criteria}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-theme-muted uppercase text-xs tracking-wider mb-1">Application Link</p>
                                            <a href={job.application_link} target="_blank" rel="noopener noreferrer"
                                                className="text-theme-accent underline flex items-center space-x-1 break-all font-medium">
                                                <span>{job.application_link}</span>
                                                <ExternalLink size={13} />
                                            </a>
                                        </div>
                                        {job.published_at && (
                                            <div>
                                                <p className="font-semibold text-theme-muted uppercase text-xs tracking-wider mb-1">Published At</p>
                                                <p>{fmtDate(job.published_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Test Link Modal */}
            {showTestLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-theme-card border border-theme-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-theme-header px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-3 sticky top-0 z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                <TestTube size={24} className="text-white shrink-0" />
                                <h3 className="text-lg sm:text-xl font-bold text-white truncate">Link Tests to Job</h3>
                            </div>
                            <button
                                onClick={() => setShowTestLinkModal(null)}
                                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            {/* All Tests - Single List with Toggle */}
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                    <h4 className="text-sm font-bold uppercase text-theme-text">
                                        Available Tests
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                                            {linkedTests[showTestLinkModal]?.length || 0} Linked
                                        </span>
                                        <span className="bg-theme-panel text-theme-accent px-3 py-1 rounded-full text-xs font-bold border border-theme-border">
                                            {tests.length} Total
                                        </span>
                                    </div>
                                </div>

                                {tests.length === 0 ? (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
                                        <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
                                        <p className="text-sm text-amber-600 dark:text-amber-400 font-bold">No tests available</p>
                                        <p className="text-xs text-theme-muted mt-1">Create and publish tests from "Manage Exams" first</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                        {tests.map((test) => {
                                            const isLinked = linkedTests[showTestLinkModal]?.some(link => link.test_id === test.id);
                                            return (
                                                <div
                                                    key={test.id}
                                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4 transition-all ${isLinked
                                                        ? 'bg-shnoor-successLight border-2 border-shnoor-success shadow-sm'
                                                        : 'bg-white border border-shnoor-mist hover:border-shnoor-indigo hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {isLinked && <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                                            <p className="font-bold text-theme-text break-words min-w-0">{test.display_name}</p>
                                                        </div>
                                                        <p className="text-xs text-theme-muted ml-6">
                                                            {test.display_duration} min • {test.display_question_count} questions • {test.display_total_marks} marks
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => isLinked
                                                            ? handleUnlinkTest(showTestLinkModal, test.id)
                                                            : handleLinkTest(showTestLinkModal, test.id)
                                                        }
                                                        disabled={linkingTest}
                                                        className={`shrink-0 w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm hover:shadow-md ${isLinked
                                                            ? 'bg-shnoor-success hover:opacity-90 text-white'
                                                            : 'bg-shnoor-indigo hover:bg-[#4d4d9c] text-white'
                                                            }`}
                                                    >
                                                        {linkingTest ? (
                                                            <>
                                                                <Loader2 size={16} className="animate-spin" />
                                                                <span>{isLinked ? 'Unlinking...' : 'Linking...'}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {isLinked ? (
                                                                    <>
                                                                        <CheckCircle size={16} />
                                                                        <span>Linked</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <LinkIcon size={16} />
                                                                        <span>Link Test</span>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
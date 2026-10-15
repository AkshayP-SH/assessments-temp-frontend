import { formatDate } from '../utils/dateTime';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Briefcase, Loader2, RefreshCw, CheckCircle, Clock, FileText, AlertTriangle, XCircle, Trophy, PlayCircle, Award, ChevronDown, Building, MoreHorizontal, Archive, XSquare, Flag, User } from 'lucide-react';
import { apiFetch } from '../config/api';
import ThemeSelector from '../components/ThemeSelector';
import StudentHeader from '../components/StudentHeader';
import { clearStorageKeepTheme } from '../utils/theme';
import shnoorLogo from '../assets/shnoor-logo.png';

const STATUS_CONFIG = {
    submitted: { label: 'Submitted', color: 'blue', icon: FileText },
    screening: { label: 'Under Review', color: 'yellow', icon: Clock },
    assessment_assigned: { label: 'Assessment Assigned', color: 'purple', icon: AlertTriangle },
    assessment_completed: { label: 'Assessment Completed', color: 'indigo', icon: CheckCircle },
    shortlisted: { label: 'Shortlisted', color: 'green', icon: Trophy },
    rejected: { label: 'Not Selected', color: 'red', icon: XCircle }
};

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
    const Icon = config.icon;

    const colorClasses = {
        blue: 'bg-shnoor-lavender text-shnoor-indigo border-shnoor-mist',
        yellow: 'bg-shnoor-warningLight text-shnoor-warning border-shnoor-warningLight',
        purple: 'bg-shnoor-lavender border-shnoor-indigo text-shnoor-navy',
        indigo: 'bg-shnoor-indigo text-white border-shnoor-indigo',
        green: 'bg-shnoor-successLight text-shnoor-success border-shnoor-successLight',
        red: 'bg-shnoor-dangerLight text-shnoor-danger border-shnoor-dangerLight'
    };

    return (
        <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${colorClasses[config.color]}`}>
            <Icon size={14} />
            <span>{config.label}</span>
        </span>
    );
};

const fmtDate = (iso) => {
    if (!iso) return '—';
    return formatDate(iso, 'en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function MyApplications({ isEmbedded = false, onBrowseJobs }) {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedAppId, setExpandedAppId] = useState(null);
    const [appTests, setAppTests] = useState({}); // Map applicationId -> tests array
    const [loadingTests, setLoadingTests] = useState({});
    const [activeMenuAppId, setActiveMenuAppId] = useState(null);
    const [viewDetailsApp, setViewDetailsApp] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
    const [archivedApplicationIds, setArchivedApplicationIds] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('student_archived_applications') || '[]').map(String));
        } catch (error) {
            console.error('Failed to load archived applications', error);
            return new Set();
        }
    });

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuAppId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [studentName, setStudentName] = useState(() => localStorage.getItem('studentName') || '');
    const [studentId, setStudentId] = useState(() => localStorage.getItem('studentId') || '');
    const [institute, setInstitute] = useState(() => localStorage.getItem('institute') || '');

    const capitalizeInstitute = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => {
                if (word === 'shnoor') return 'SHNOOR';
                if (word === 'international') return 'international';
                if (word === 'llc') return 'LLC';
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    const fetchApplications = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('studentAuthToken');
            const res = await apiFetch('/api/job-applications/my-applications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            
            let allApps = [];

            if (data.success) {
                allApps = data.data;
            } else {
                setError(data.message || 'Failed to load applications');
            }



            setApplications(allApps);
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTestsForApplication = async (applicationId) => {
        if (appTests[applicationId]) return; // Already fetched

        setLoadingTests(prev => ({ ...prev, [applicationId]: true }));

        try {
            const token = localStorage.getItem('studentAuthToken');
            console.log('Fetching tests for application:', applicationId);

            const res = await apiFetch(`/api/job-applications/${applicationId}/tests`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                clearStorageKeepTheme();
                navigate('/login');
                return;
            }

            const data = await res.json();
            console.log('Tests response:', data);

            if (data.success) {
                console.log('Setting tests:', data.tests);
                setAppTests(prev => ({ ...prev, [applicationId]: Array.isArray(data.tests) ? data.tests : [] }));
            } else {
                console.error('Failed to fetch tests:', data.message);
            }
        } catch (error) {
            console.error('Failed to fetch tests - error:', error);
        } finally {
            setLoadingTests(prev => ({ ...prev, [applicationId]: false }));
        }
    };

    const handleToggleExpand = (applicationId) => {
        const newExpandedId = expandedAppId === applicationId ? null : applicationId;
        setExpandedAppId(newExpandedId);

        if (newExpandedId) {
            fetchTestsForApplication(newExpandedId);
        }
    };

    const handleTakeTest = (testId, applicationId) => {
        localStorage.setItem('selectedTestId', testId);
        localStorage.setItem('currentApplicationId', applicationId);
        navigate('/instructions');
    };

    // Determine the display status based on test completion
    const getDisplayStatus = (app) => {
        // If status is assessment_assigned, check if all tests are completed
        if (app.status === 'assessment_assigned') {
            const totalTests = parseInt(app.total_tests) || 0;
            const completedTests = parseInt(app.completed_tests) || 0;

            if (totalTests > 0 && completedTests >= totalTests) {
                return 'assessment_completed';
            }
        }

        return app.status;
    };

    useEffect(() => {
        setStudentName(localStorage.getItem('studentName') || 'Student');
        setStudentId(localStorage.getItem('studentId') || '');
        setInstitute(localStorage.getItem('institute') || '');
        fetchApplications();
    }, []);

    const handleLogout = () => {
        clearStorageKeepTheme();
        navigate('/login');
    };

    const getApplicationId = (app) => app.application_id ?? app.id;
    const isApplicationArchived = (app) =>
        Boolean(app.student_details?.isArchived) ||
        archivedApplicationIds.has(String(getApplicationId(app)));

    const handleViewDetails = (app) => {
        setViewDetailsApp(app);
        setActiveMenuAppId(null);
    };

    const handleArchive = (app) => {
        const appId = String(getApplicationId(app));
        const shouldArchive = !isApplicationArchived(app);
        const nextArchivedIds = new Set(archivedApplicationIds);

        if (shouldArchive) nextArchivedIds.add(appId);
        else nextArchivedIds.delete(appId);

        try {
            localStorage.setItem('student_archived_applications', JSON.stringify([...nextArchivedIds]));
            setArchivedApplicationIds(nextArchivedIds);
            setApplications(prev => prev.map(application =>
                String(getApplicationId(application)) === appId
                    ? {
                        ...application,
                        student_details: {
                            ...application.student_details,
                            isArchived: shouldArchive
                        }
                    }
                    : application
            ));
        } catch (error) {
            console.error('Failed to update archived applications', error);
            window.alert('Could not update the archived application. Please try again.');
        } finally {
            setActiveMenuAppId(null);
        }
    };

    return (
        <div className={isEmbedded ? "w-full font-sans" : "min-h-screen bg-[#F8F8FB] font-sans"}>
            {!isEmbedded && (
                <StudentHeader
                    studentName={studentName}
                    studentId={studentId}
                    institute={institute}
                    subtitle="My Applications"
                    showBackButton={true}
                    backTo="/dashboard"
                    onLogout={handleLogout}
                />
            )}

            <main className={isEmbedded ? "" : "w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
                {/* Page heading */}
                {!isEmbedded && (
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-shnoor-navy mb-2">
                            📋 Application Tracker
                        </h1>
                        <p className="text-shnoor-indigoMedium">
                            Track your job applications, assessment progress, and status updates
                        </p>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-20 text-shnoor-indigoMedium">
                        <Loader2 size={32} className="animate-spin mr-3" />
                        <span>Loading your applications...</span>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="text-center py-16">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button
                            onClick={fetchApplications}
                            className="flex items-center space-x-2 mx-auto px-5 py-2.5 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <RefreshCw size={16} />
                            <span>Retry</span>
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && applications.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-12 text-center">
                        <Briefcase size={64} className="mx-auto mb-4 text-shnoor-mist" />
                        <p className="font-bold text-xl text-shnoor-navy mb-2">
                            No Applications Yet
                        </p>
                        <p className="text-sm text-shnoor-indigoMedium mb-6">
                            Start applying to job openings to see them tracked here
                        </p>
                        <button
                            onClick={() => onBrowseJobs ? onBrowseJobs() : navigate('/job-board')}
                            className="inline-flex items-center space-x-2 px-6 py-3 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold transition-all shadow-sm"
                        >
                            <Briefcase size={18} />
                            <span>Browse Job Openings</span>
                        </button>
                    </div>
                )}

                {/* Applications list & Tabs */}
                {!loading && !error && applications.length > 0 && (
                    <div className="space-y-6">
                        {/* Tabs */}
                        <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-5 py-3 text-sm font-bold transition-colors relative ${activeTab === 'active' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                Active Applications
                                {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('archived')}
                                className={`px-5 py-3 text-sm font-bold transition-colors relative ${activeTab === 'archived' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                Archived
                                {activeTab === 'archived' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
                            </button>
                        </div>

                        {(() => {
                            const filteredApps = applications.filter(app => {
                                const isArchived = isApplicationArchived(app);
                                return activeTab === 'archived' ? isArchived : !isArchived;
                            });

                            if (filteredApps.length === 0) {
                                return (
                                    <div className="text-center py-12">
                                        <Archive size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                            No {activeTab} applications
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <p className="text-sm text-shnoor-indigoMedium font-medium">
                                        {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                        {filteredApps.map((app) => {
                                            const applicationId = getApplicationId(app);
                                            const applicationKey = String(applicationId);
                                            const isMenuOpen = activeMenuAppId === applicationKey;

                                            return (
                                    <div key={applicationKey} className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:shadow-[0_8px_30px_rgba(14,14,39,0.08)]">
                                        <div className="flex gap-4 w-full">
                                            {/* Grey icon box */}
                                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <Building size={28} className="text-slate-400 dark:text-slate-500" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Application status */}
                                                <div className="mb-2">
                                                    <StatusBadge status={getDisplayStatus(app)} />
                                                </div>
                                                
                                                {/* Job Info */}
                                                <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate mb-1">
                                                    {app.job_role || app.jobOpening?.job_role || 'Software Developer Intern'}
                                                </h3>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                                    {app.company_name || app.jobOpening?.company_name || 'SR NEXT'}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                                    Remote
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    Applied on {fmtDate(app.applied_at)}
                                                </p>

                                                {/* If there are tests, show them cleanly inline below */}
                                                {app.total_tests > 0 && (
                                                    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/50 max-w-xl">
                                                        <div className="flex items-center justify-between mb-3 cursor-pointer group" onClick={() => handleToggleExpand(app.application_id || app.id)}>
                                                            <div className="flex items-center space-x-2">
                                                                <FileText size={18} className="text-indigo-500" />
                                                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                                                                    View Assessment Tests ({app.total_tests})
                                                                </span>
                                                            </div>
                                                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${expandedAppId === (app.application_id || app.id) ? 'rotate-180' : ''}`} />
                                                        </div>

                                                        {expandedAppId === (app.application_id || app.id) && (
                                                            <div className="mt-3">
                                                                {loadingTests[app.application_id || app.id] ? (
                                                                    <div className="text-xs text-slate-500 py-2">Loading tests...</div>
                                                                ) : appTests[app.application_id || app.id]?.length > 0 ? (
                                                                    <div className="space-y-3">
                                                                        {appTests[app.application_id || app.id].map((test) => (
                                                                            <div key={test.test_id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                                                                <div>
                                                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">{test.test_name}</p>
                                                                                    <p className="text-[11px] font-medium text-slate-500">{test.duration} min • {test.total_marks} marks</p>
                                                                                </div>
                                                                                {!test.is_completed ? (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleTakeTest(test.test_id, app.application_id || app.id); }}
                                                                                        className="w-full sm:w-auto flex justify-center items-center space-x-2 px-4 py-2 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold transition-all shadow-sm text-sm shrink-0 mt-2 sm:mt-0 btn-action-gesture"
                                                                                    >
                                                                                        Take Test
                                                                                    </button>
                                                                                ) : (
                                                                                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1.5"><CheckCircle size={14}/> Completed</span>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-slate-500 py-2">No tests assigned yet.</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="relative shrink-0 flex items-center">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                        setActiveMenuAppId(isMenuOpen ? null : applicationKey);
                                                }}
                                                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>

                                            {/* Modal Popup Menu */}
                                            {isMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] sm:hidden" onClick={() => setActiveMenuAppId(null)}></div>
                                                    <div 
                                                        className="absolute right-0 top-12 sm:top-auto sm:right-full sm:mr-2 z-50 w-64 bg-white dark:bg-[#1A1A32] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Manage Application</span>
                                                            <button onClick={() => setActiveMenuAppId(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                                <XCircle size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="py-2">
                                                            <button onClick={() => handleViewDetails(app)} className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 font-medium transition-colors">
                                                                <User size={16} className="text-indigo-500" />
                                                                View details
                                                            </button>
                                                            <button onClick={() => handleArchive(app)} className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 font-medium transition-colors">
                                                                <Archive size={16} className="text-slate-500" />
                                                                {isApplicationArchived(app) ? 'Unarchive' : 'Archive'}
                                                            </button>

                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </main>

            {/* View Details Modal */}
            {viewDetailsApp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Application Details</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {viewDetailsApp.job_role || viewDetailsApp.jobOpening?.job_role} • {viewDetailsApp.company_name || viewDetailsApp.jobOpening?.company_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewDetailsApp(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {viewDetailsApp.student_details ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Primary Skill</label>
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium">
                                            {viewDetailsApp.student_details.primarySkill || 'Not provided'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Years of Experience</label>
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium">
                                            {viewDetailsApp.student_details.yearsOfExperience || 'Not provided'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Resume / Portfolio URL</label>
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                            {viewDetailsApp.student_details.githubUrl ? (
                                                <a href={viewDetailsApp.student_details.githubUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium break-all flex items-center gap-2">
                                                    {viewDetailsApp.student_details.githubUrl}
                                                </a>
                                            ) : (
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">Not provided</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
                                    <p>No additional details were provided during the application.</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                            <button
                                onClick={() => setViewDetailsApp(null)}
                                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

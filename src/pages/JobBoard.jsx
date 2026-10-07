// src/pages/JobBoard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, Building2, Clock, ArrowLeft, Loader2, RefreshCw, Search, CheckCircle2, CheckCircle, X, Code, Link2, Calendar, FileText, Info, Bookmark } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../config/api';
import ThemeSelector from '../components/ThemeSelector';
import StudentHeader from '../components/StudentHeader';
import { clearStorageKeepTheme } from '../utils/theme';
import shnoorLogo from '../assets/shnoor-logo.png';
import { useSEO } from '../hooks/useSEO';
import { useDebounce } from '../hooks/useDebounce';

const fmtDeadline = (iso) =>
    iso
        ? new Date(iso).toLocaleString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'No deadline specified';

const isExpiringSoon = (iso) => {
    if (!iso) return false;
    const ms = new Date(iso) - new Date();
    return ms > 0 && ms < 3 * 24 * 60 * 60 * 1000; // within 3 days
};

const isRegistrationClosed = (iso) => {
    if (!iso) return false;
    return new Date(iso) < new Date();
};



export default function JobBoard({ isEmbedded = false }) {
    useSEO({
        title: "Job Board - SHNOOR Assessments",
        description: "View and apply to active job openings",
        canonical: "https://assessments.shnoor.com/job-board"
    });

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [enrollingJobs, setEnrollingJobs] = useState(new Set());
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);
    
    // Application form state
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applicationForm, setApplicationForm] = useState({
        primarySkill: '',
        yearsOfExperience: '',
        githubUrl: ''
    });

    // View Details state
    const [viewDetailsJob, setViewDetailsJob] = useState(null);
    const [viewDetailsData, setViewDetailsData] = useState(null);

    // View Description state
    const [viewDescriptionJob, setViewDescriptionJob] = useState(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const [studentName, setStudentName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [institute, setInstitute] = useState('');

    const capitalizeInstitute = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const { data: queryData, isLoading: loading, error: queryError, refetch: fetchJobsAndEnrollments } = useQuery({
        queryKey: ['jobBoardData'],
        queryFn: async () => {
            let jobsRes = await apiFetch('/api/job-openings/public/all');

            if (jobsRes.status === 404) {
                jobsRes = await apiFetch('/api/job-openings/public/active');
            }

            const jobsData = await jobsRes.json();

            if (!jobsRes.ok || !jobsData.success) {
                throw new Error('Could not load job openings. Please try again.');
            }

            let allJobs = Array.isArray(jobsData.data) ? [...jobsData.data] : [];
            const allJobIds = new Set(allJobs.map(job => job.id));
            const applicationsMap = new Map();

            const token = localStorage.getItem('studentAuthToken');
            if (token) {
                const enrolledRes = await apiFetch('/api/job-applications/my-applications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (enrolledRes.status === 401) {
                    clearStorageKeepTheme();
                    window.location.href = '/login';
                    return { jobs: [], applications: applicationsMap };
                }
                
                const enrolledData = await enrolledRes.json();
                if (enrolledData.success) {
                    enrolledData.data.forEach(app => {
                        applicationsMap.set(app.job_opening_id, app);
                        if (!allJobIds.has(app.job_opening_id)) {
                            allJobs.push({
                                id: app.job_opening_id,
                                company_name: app.company_name,
                                job_role: app.job_role,
                                job_description: app.job_description,
                                registration_deadline: app.registration_deadline,
                                eligibility_criteria: app.eligibility_criteria,
                                application_link: null,
                                published_at: null,
                                is_enrolled: true
                            });
                        }
                    });
                }
            }

            // Restore mock job applications from localStorage (since they don't exist in DB)
            try {
                const savedData = JSON.parse(localStorage.getItem('student_job_applications') || '{}');
                Object.keys(savedData).forEach(jobId => {
                    if (jobId.startsWith('mock-') && !applicationsMap.has(jobId)) {
                        applicationsMap.set(jobId, {
                            id: `mock-app-${jobId}`,
                            job_opening_id: jobId,
                            status: 'submitted',
                            total_tests: 0,
                            completed_tests: 0
                        });
                    }
                });
            } catch(e) { console.error('Failed to parse local mock apps', e); }
            const getMockDesc = (role) => `We are looking for an exceptional ${role} to join our team and help build our next-generation platform. In this role, you will be responsible for designing, developing, and maintaining high-performance, scalable, and reliable systems tailored for our ${role} capabilities. You will work closely with cross-functional teams including product managers, designers, and other engineers to deliver impactful solutions. 
Key Responsibilities for the ${role} position:
- Write clean, maintainable, and efficient code.
- Participate in all phases of the software development lifecycle.
- Drive continuous improvement and innovation within the team.
- Troubleshoot, debug, and upgrade existing systems.
- Collaborate with internal teams to fix issues and improve performance.
- Stay updated with industry trends and emerging technologies.

We offer a competitive salary, comprehensive health benefits, and a flexible work environment. Join us to make a real impact!`;

            const MOCK_JOBS = [
                { id: 'mock-1', company_name: 'TechCorp', job_role: 'Data Analytics', job_type: 'Full-time', location: 'Remote', job_description: getMockDesc('Data Analytics'), registration_deadline: new Date(Date.now() + 864000000).toISOString(), eligibility_criteria: 'B.Tech/B.E. in Computer Science or related field.' },
                { id: 'mock-2', company_name: 'WebSolutions', job_role: 'React Developer', job_type: 'Contract', location: 'Hybrid', job_description: getMockDesc('React Developer'), registration_deadline: new Date(Date.now() + 432000000).toISOString(), eligibility_criteria: '2+ years of experience in React.' },
                { id: 'mock-3', company_name: 'DataSystems', job_role: 'Backend Developer', job_type: 'Full-time', location: 'On-site', job_description: getMockDesc('Backend Developer'), registration_deadline: new Date(Date.now() + 1728000000).toISOString(), eligibility_criteria: 'Proficiency in Node.js and SQL.' },
                { id: 'mock-4', company_name: 'AI Innovations', job_role: 'Data Scientist', job_type: 'Full-time', location: 'Remote', job_description: getMockDesc('Data Scientist'), registration_deadline: new Date(Date.now() + 604800000).toISOString(), eligibility_criteria: 'Experience with Python, Pandas, and Scikit-learn.' },
                { id: 'mock-5', company_name: 'CloudNet', job_role: 'DevOps Engineer', job_type: 'Contract', location: 'Remote', job_description: getMockDesc('DevOps Engineer'), registration_deadline: new Date(Date.now() + 259200000).toISOString(), eligibility_criteria: 'AWS Certification preferred. Terraform knowledge.' },
                { id: 'mock-6', company_name: 'CyberSec Systems', job_role: 'Security Analyst', job_type: 'Full-time', location: 'Hybrid', job_description: getMockDesc('Security Analyst'), registration_deadline: new Date(Date.now() + 864000000).toISOString(), eligibility_criteria: 'CISSP or equivalent certification.' },
                { id: 'mock-7', company_name: 'MobileFirst', job_role: 'iOS Developer', job_type: 'Full-time', location: 'On-site', job_description: getMockDesc('iOS Developer'), registration_deadline: new Date(Date.now() + 1209600000).toISOString(), eligibility_criteria: '3+ years of iOS development experience.' },
                { id: 'mock-8', company_name: 'FinTech Solutions', job_role: 'Java Developer', job_type: 'Full-time', location: 'Remote', job_description: getMockDesc('Java Developer'), registration_deadline: new Date(Date.now() + 345600000).toISOString(), eligibility_criteria: 'Strong knowledge of Java Spring Boot.' },
                { id: 'mock-9', company_name: 'UX Studios', job_role: 'UI/UX Designer', job_type: 'Contract', location: 'Hybrid', job_description: getMockDesc('UI/UX Designer'), registration_deadline: new Date(Date.now() + 777600000).toISOString(), eligibility_criteria: 'Portfolio demonstrating web and mobile design.' },
                { id: 'mock-10', company_name: 'NextGen AI', job_role: 'Machine Learning Engineer', job_type: 'Full-time', location: 'Remote', job_description: getMockDesc('Machine Learning Engineer'), registration_deadline: new Date(Date.now() + 1036800000).toISOString(), eligibility_criteria: 'Experience with PyTorch or TensorFlow.' },
                { id: 'mock-11', company_name: 'GameDev Corp', job_role: 'Unity Developer', job_type: 'Internship', location: 'On-site', job_description: getMockDesc('Unity Developer'), registration_deadline: new Date(Date.now() + 518400000).toISOString(), eligibility_criteria: 'Experience in C# and Unity3D.' },
                { id: 'mock-12', company_name: 'Quantum Computing', job_role: 'Research Scientist', job_type: 'Full-time', location: 'Hybrid', job_description: getMockDesc('Research Scientist'), registration_deadline: new Date(Date.now() + 1468800000).toISOString(), eligibility_criteria: 'Ph.D. in Physics or Computer Science.' }
            ];

            MOCK_JOBS.forEach(mj => {
                if (!allJobIds.has(mj.id)) {
                    allJobs.push(mj);
                    allJobIds.add(mj.id);
                }
            });
            
            return { jobs: allJobs, applications: applicationsMap };
        }
    });

    const jobs = queryData?.jobs || [];
    const applications = queryData?.applications || new Map();
    const error = queryError?.message || '';

    useEffect(() => {
        setStudentName(localStorage.getItem('studentName') || 'Student');
        setStudentId(localStorage.getItem('studentId') || '');
        setInstitute(localStorage.getItem('institute') || '');
    }, []);

    const handleLogout = () => {
        clearStorageKeepTheme();
        navigate('/login');
    };

    // Debounce search — only re-filter 300ms after user stops typing
    const debouncedSearch = useDebounce(search, 300);

    // Memoized filtered list — recomputes only when jobs or debouncedSearch changes
    const filtered = useMemo(() => {
        const term = debouncedSearch.toLowerCase();
        return jobs.filter(j =>
            (j.company_name || '').toLowerCase().includes(term) ||
            (j.job_role || '').toLowerCase().includes(term) ||
            (j.eligibility_criteria || '').toLowerCase().includes(term)
        );
    }, [debouncedSearch, jobs]);

    const handleEnrollClick = (job) => {
        const token = localStorage.getItem('studentAuthToken');
        if (!token) {
            navigate('/login?redirect=/job-board&message=Please login to enroll in jobs');
            return;
        }

        if (applications.has(job.id)) {
            return;
        }

        setSelectedJob(job);
        setApplicationForm({ primarySkill: '', yearsOfExperience: '', githubUrl: '' });
        setShowApplicationModal(true);
    };

    const submitApplication = async (e) => {
        e.preventDefault();
        const job = selectedJob;
        if (!job) return;

        const token = localStorage.getItem('studentAuthToken');

        // Save form data locally for "View Details" to show later
        try {
            const savedData = JSON.parse(localStorage.getItem('student_job_applications') || '{}');
            savedData[job.id] = applicationForm;
            localStorage.setItem('student_job_applications', JSON.stringify(savedData));
        } catch(e) { console.error('Failed to save local app data', e); }

        setShowApplicationModal(false);
        setEnrollingJobs(prev => new Set([...prev, job.id]));

        try {
            // Mock jobs shouldn't hit the API as they aren't in the database
            if (String(job.id).startsWith('mock-')) {
                await new Promise(resolve => setTimeout(resolve, 800)); // simulate network delay
                
                queryClient.setQueryData(['jobBoardData'], oldData => {
                    if (!oldData) return oldData;
                    const newMap = new Map(oldData.applications);
                    newMap.set(job.id, {
                        job_opening_id: job.id,
                        status: 'submitted',
                        application_id: 'mock-app-' + Date.now(),
                        total_tests: 0,
                        completed_tests: 0
                    });
                    return { ...oldData, applications: newMap };
                });

                setSuccessData({
                    jobRole: job.job_role,
                    companyName: job.company_name,
                    testsAssigned: 0
                });
                setShowSuccessModal(true);
            } else {
                // Real jobs hitting real API
                const res = await apiFetch(`/api/job-applications/apply/${job.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        resume_url: null,
                        cover_letter: '',
                        form_data: applicationForm // Sending the modal form data as well
                    })
                });

                const data = await res.json();

                if (data.success) {
                    queryClient.setQueryData(['jobBoardData'], oldData => {
                        if (!oldData) return oldData;
                        const newMap = new Map(oldData.applications);
                        newMap.set(job.id, {
                            job_opening_id: job.id,
                            status: data.data.status || 'submitted',
                            application_id: data.data.applicationId,
                            total_tests: data.data.testsAssigned || 0,
                            completed_tests: 0
                        });
                        return { ...oldData, applications: newMap };
                    });

                    setSuccessData({
                        jobRole: job.job_role,
                        companyName: job.company_name,
                        testsAssigned: data.data.testsAssigned || 0
                    });
                    setShowSuccessModal(true);
                } else {
                    alert(data.message || 'Failed to enroll. Please try again.');
                }
            }
        } catch (err) {
            console.error('Enrollment error:', err);
            alert('Network error. Please check your connection and try again.');
        } finally {
            setEnrollingJobs(prev => {
                const newSet = new Set(prev);
                newSet.delete(job.id);
                return newSet;
            });
        }
    };

    return (
        <div className={isEmbedded ? "w-full font-sans" : "min-h-screen bg-[#F8F8FB] font-sans"}>
            {!isEmbedded && (
                <StudentHeader
                    studentName={studentName}
                    studentId={studentId}
                    institute={institute}
                    subtitle="Job Board"
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
                            🎯 Job Openings &amp; Off-Campus Hiring
                        </h1>
                        <p className="text-shnoor-indigoMedium">
                            Opportunities posted by your placement team — apply before the deadline!
                        </p>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-shnoor-soft" />
                    <input
                        type="text"
                        placeholder="Search by company, role or eligibility…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-shnoor-mist rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-shnoor-indigo"
                    />
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-20 text-shnoor-indigoMedium">
                        <Loader2 size={32} className="animate-spin mr-3" />
                        <span>Loading job openings…</span>
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-12 text-center">
                        <p className="text-red-600 font-medium mb-4">{error}</p>
                        <button onClick={fetchJobsAndEnrollments} className="flex items-center space-x-2 mx-auto px-5 py-2.5 bg-shnoor-indigo text-white rounded-xl text-sm font-semibold">
                            <RefreshCw size={16} /><span>Retry</span>
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && filtered.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-light p-12 text-center">
                        <Briefcase className="mx-auto h-16 w-16 text-shnoor-mist mb-4" />
                        <h3 className="text-xl font-bold text-shnoor-navy mb-2">
                            {search ? 'No Matching Jobs Found' : 'No Active Job Openings'}
                        </h3>
                        <p className="text-shnoor-indigoMedium">
                            {search ? 'Try adjusting your search criteria or clear your search query.' : 'Check back soon — new opportunities are posted regularly.'}
                        </p>
                    </div>
                )}

                {/* Job cards */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="space-y-6">
                        <p className="text-sm text-shnoor-indigoMedium font-medium">
                            {filtered.length} opening{filtered.length !== 1 ? 's' : ''}
                            {search ? ` matching "${search}"` : ''}
                        </p>

                        {/* Job Board Master-Detail Layout */}
                        <div className="flex flex-col lg:flex-row items-start gap-6 relative">
                            {/* Left Column: Job List */}
                            <div className="w-full lg:w-[40%] xl:w-[35%] flex-shrink-0 flex flex-col gap-4">
                                {filtered.map(job => {
                                    const isSelected = viewDescriptionJob?.id === job.id;
                                    const cardBorder = isSelected 
                                        ? 'border-[#403f75] dark:border-indigo-500 shadow-md ring-1 ring-[#403f75] dark:ring-indigo-500' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-[#403f75]/50 dark:hover:border-indigo-500/50';
                                    
                                    return (
                                        <div
                                            key={job.id}
                                            onClick={() => setViewDescriptionJob(job)}
                                            className={`bg-white dark:bg-[#1A1A32] border ${cardBorder} rounded-xl p-4 sm:p-5 shadow-sm transition-all duration-200 cursor-pointer flex flex-col`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white line-clamp-2 pr-4 group-hover:underline">{job.job_role}</h3>
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                                                    <Briefcase size={16} />
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{job.company_name}</p>
                                            
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 mb-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">{job.location || 'Remote'}</span>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-[#403f75] dark:text-indigo-400">{job.job_type || 'Full-time'}</span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                                {applications.has(job.id) ? (
                                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                        <CheckCircle2 size={14} /> Applied
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-[#403f75] dark:text-indigo-400 flex items-center gap-1.5">
                                                        {isRegistrationClosed(job.registration_deadline) ? (
                                                            <><Clock size={14} /> Closed</>
                                                        ) : (
                                                            <><span className="w-1.5 h-1.5 rounded-full bg-[#403f75] dark:bg-indigo-400" /> Easily apply</>
                                                        )}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {fmtDeadline(job.registration_deadline)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Column: Sticky Detail Pane (Desktop only) */}
                            <div className="hidden lg:flex flex-col flex-1 sticky top-24 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#1A1A32] shadow-sm overflow-hidden" style={{height: 'calc(100vh - 8rem)'}}>
                                {viewDescriptionJob ? (
                                    <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{viewDescriptionJob.job_role}</h2>
                                            <p className="text-base text-[#403f75] dark:text-indigo-400 font-medium hover:underline cursor-pointer mb-6">{viewDescriptionJob.company_name}</p>
                                            
                                            <div className="flex flex-wrap items-center gap-3">
                                                {applications.has(viewDescriptionJob.id) ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-[#403f75] dark:text-indigo-400 font-bold rounded-xl flex items-center gap-2 border border-indigo-100 dark:border-indigo-800/50">
                                                            <CheckCircle2 size={18} /> Enrolled
                                                        </div>
                                                        {applications.get(viewDescriptionJob.id).total_tests > applications.get(viewDescriptionJob.id).completed_tests ? (
                                                            <button
                                                                onClick={() => navigate('/student/my-applications')}
                                                                className="px-6 py-2.5 bg-gradient-to-r from-[#403f75] to-[#57569b] hover:from-[#343360] hover:to-[#4a4988] text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                                                            >
                                                                Take Pending Tests ({applications.get(viewDescriptionJob.id).total_tests - applications.get(viewDescriptionJob.id).completed_tests})
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    let data = null;
                                                                    try {
                                                                        const savedData = JSON.parse(localStorage.getItem('student_job_applications') || '{}');
                                                                        data = savedData[viewDescriptionJob.id] || null;
                                                                    } catch(e) {}
                                                                    setViewDetailsJob(viewDescriptionJob);
                                                                    setViewDetailsData(data);
                                                                }}
                                                                className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
                                                            >
                                                                View Details
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleEnrollClick(viewDescriptionJob)}
                                                        disabled={enrollingJobs.has(viewDescriptionJob.id) || isRegistrationClosed(viewDescriptionJob.registration_deadline)}
                                                        className="px-8 py-2.5 bg-gradient-to-r from-[#403f75] to-[#57569b] hover:from-[#343360] hover:to-[#4a4988] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                                                    >
                                                        {enrollingJobs.has(viewDescriptionJob.id) ? (
                                                            <><Loader2 size={16} className="animate-spin" /> Enrolling...</>
                                                        ) : isRegistrationClosed(viewDescriptionJob.registration_deadline) ? (
                                                            'Registration Closed'
                                                        ) : (
                                                            'Enroll Now'
                                                        )}
                                                    </button>
                                                )}
                                                <button className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700">
                                                    <Bookmark size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 sm:p-8">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Job details</h3>
                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
                                                    <Briefcase size={18} className="mt-0.5 text-slate-400" />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">Job type</p>
                                                        <p>{viewDescriptionJob.job_type || 'Full-time'}, {viewDescriptionJob.location || 'Remote'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
                                                    <Clock size={18} className="mt-0.5 text-slate-400" />
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">Registration Deadline</p>
                                                        <p>{fmtDeadline(viewDescriptionJob.registration_deadline)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Full job description</h3>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-8">
                                                {viewDescriptionJob.job_description || 'No description provided.'}
                                            </p>

                                            {viewDescriptionJob.eligibility_criteria && (
                                                <>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Eligibility Criteria</h3>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-8">
                                                        {viewDescriptionJob.eligibility_criteria}
                                                    </p>
                                                </>
                                            )}

                                            {viewDescriptionJob.application_link && (
                                                <>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">External Application Link</h3>
                                                    <a href={viewDescriptionJob.application_link} target="_blank" rel="noopener noreferrer" className="text-[#403f75] dark:text-indigo-400 hover:underline text-sm break-all font-medium flex items-center gap-2">
                                                        <Link2 size={16} /> {viewDescriptionJob.application_link}
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                        <Briefcase size={48} className="mb-4 opacity-50" />
                                        <p className="font-medium">Select a job to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* View Description Modal (Mobile Only) */}
            {viewDescriptionJob && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewDescriptionJob(null)}></div>
                    <div className="bg-white dark:bg-[#1A1A32] rounded-2xl p-6 sm:p-8 max-w-lg w-full relative z-10 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-700/60">
                        <button
                            onClick={() => setViewDescriptionJob(null)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6 flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-indigo-800/60">
                                <FileText size={24} className="text-[#403f75] dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Job Description</h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                    {viewDescriptionJob.job_role} at {viewDescriptionJob.company_name}
                                </p>
                            </div>
                        </div>

                        <div className="mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            <p className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                                {viewDescriptionJob.job_description || 'No description available for this role.'}
                            </p>
                            
                            {viewDescriptionJob.job_description?.length > 150 && !isDescriptionExpanded && (
                                <button 
                                    onClick={() => setIsDescriptionExpanded(true)}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-bold mt-2"
                                >
                                    Read more
                                </button>
                            )}

                            {(isDescriptionExpanded || (viewDescriptionJob.job_description?.length || 0) <= 150) && (
                                <div className="animate-fade-in">
                                    {viewDescriptionJob.job_description?.length > 150 && (
                                        <button 
                                            onClick={() => setIsDescriptionExpanded(false)}
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-bold mt-3 block"
                                        >
                                            Show less
                                        </button>
                                    )}

                                    {viewDescriptionJob.eligibility_criteria && (
                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-3 tracking-widest uppercase flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                                Eligibility Criteria
                                            </h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words pl-6">
                                                {viewDescriptionJob.eligibility_criteria}
                                            </p>
                                        </div>
                                    )}

                                    {viewDescriptionJob.application_link && (
                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-3 tracking-widest uppercase flex items-center gap-2">
                                                <Link2 size={16} className="text-indigo-500" />
                                                Application Link
                                            </h4>
                                            <a 
                                                href={viewDescriptionJob.application_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline break-all flex items-center gap-1.5 pl-6"
                                            >
                                                {viewDescriptionJob.application_link}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-5">
                            <button
                                onClick={() => setViewDescriptionJob(null)}
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Modal */}
            {showApplicationModal && selectedJob && (
                <div 
                    className="fixed inset-0 bg-[#0E0E27]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans animate-fade-in"
                    onClick={() => setShowApplicationModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-[#1E1E38] rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Job Application</h3>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{selectedJob.job_role} at {selectedJob.company_name}</p>
                            </div>
                            <button
                                onClick={() => setShowApplicationModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1.5 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submitApplication} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Primary Technical Skill</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="e.g. React, Python, Data Analysis"
                                    value={applicationForm.primarySkill}
                                    onChange={(e) => setApplicationForm({...applicationForm, primarySkill: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1A1A32] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#403f75]/50 dark:text-white transition-all"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Years of Experience</label>
                                <select 
                                    required
                                    value={applicationForm.yearsOfExperience}
                                    onChange={(e) => setApplicationForm({...applicationForm, yearsOfExperience: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1A1A32] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#403f75]/50 dark:text-white transition-all appearance-none"
                                >
                                    <option value="" disabled>Select experience level</option>
                                    <option value="Fresher (0 years)">Fresher (0 years)</option>
                                    <option value="1-2 years">1-2 years</option>
                                    <option value="3-5 years">3-5 years</option>
                                    <option value="5+ years">5+ years</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Portfolio / GitHub / LinkedIn URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <input 
                                    type="url" 
                                    placeholder="https://..."
                                    value={applicationForm.githubUrl}
                                    onChange={(e) => setApplicationForm({...applicationForm, githubUrl: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1A1A32] border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#403f75]/50 dark:text-white transition-all"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-gradient-to-r from-[#403f75] to-[#57569b] hover:from-[#343360] hover:to-[#4a4988] text-white rounded-xl font-bold text-sm shadow-md shadow-[#403f75]/20 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && successData && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
                    onClick={() => setShowSuccessModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-[0_8px_30px_rgba(14,14,39,0.06)] border border-shnoor-mist max-w-md w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-shnoor-success px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Successfully Enrolled!</h3>
                                    <p className="text-white/80 text-sm">You're all set</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-shnoor-successLight border border-shnoor-success text-shnoor-success rounded-xl p-4">
                                <p className="text-sm font-medium">
                                    You have been enrolled in <span className="font-bold">{successData.jobRole}</span> at <span className="font-bold">{successData.companyName}</span>.
                                </p>
                            </div>

                            {successData.testsAssigned > 0 && (
                                <div className="bg-shnoor-lavender border border-shnoor-indigo text-shnoor-navy rounded-xl p-4">
                                    <p className="text-sm font-semibold">
                                        🎯 {successData.testsAssigned} assessment{successData.testsAssigned !== 1 ? 's have' : ' has'} been assigned to you!
                                    </p>
                                    <p className="text-xs mt-2 text-shnoor-indigoMedium">
                                        Complete {successData.testsAssigned === 1 ? 'it' : 'them'} from your dashboard to proceed with your application.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={() => navigate('/student/my-applications')}
                                    className="w-full py-3 bg-shnoor-indigo hover:bg-[#4d4d9c] text-white rounded-lg font-bold transition-all shadow-sm"
                                >
                                    View My Applications
                                </button>
                                {successData.testsAssigned > 0 && (
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-3 border-2 border-shnoor-indigo text-shnoor-indigo rounded-lg font-bold hover:bg-shnoor-lavender transition-all shadow-sm"
                                    >
                                        Go to Dashboard
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewDetailsJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewDetailsJob(null)}></div>
                    <div className="bg-white dark:bg-[#1A1A32] rounded-2xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-700/60">
                        <button
                            onClick={() => setViewDetailsJob(null)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-800/60">
                                <Briefcase size={28} className="text-[#403f75] dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">Application Details</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {viewDetailsJob.job_role} at {viewDetailsJob.company_name}
                            </p>
                        </div>

                        <div className="space-y-3 mb-8">
                            {viewDetailsData ? (
                                <>
                                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-[#1E1E38]/50 border border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-[#1A1A32] hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-default">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-[#403f75] dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-all">
                                            <Code size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Primary Technical Skill</p>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                {viewDetailsData.primarySkill || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-[#1E1E38]/50 border border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-[#1A1A32] hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-default">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-[#403f75] dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-all">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Years of Experience</p>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                {viewDetailsData.yearsOfExperience || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-[#1E1E38]/50 border border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-[#1A1A32] hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-default">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-[#403f75] dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-all">
                                            <Link2 size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Portfolio / GitHub / LinkedIn</p>
                                            {viewDetailsData.githubUrl ? (
                                                <a href={viewDetailsData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline truncate block">
                                                    {viewDetailsData.githubUrl}
                                                </a>
                                            ) : (
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Not provided</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FileText size={20} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                                        No custom application details found for this job.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setViewDetailsJob(null)}
                                className="w-full h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl transition-all shadow-sm"
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

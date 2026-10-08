import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { LogOut, Clock, BookOpen, AlertCircle, FileText, X, Video, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import ExamSearchFilter from '../components/ExamSearchFilter';
import StudentInterviews from '../components/StudentInterviews';
import JobBoard from './JobBoard';
import MyApplications from './MyApplications';
import StudentProfile from './StudentProfile';
import StudentSupportChatbot from '../components/chatbot/StudentSupportChatbot';
import ThemeSelector from '../components/ThemeSelector';
import StudentHeader from '../components/StudentHeader';
import StudentSidebar from '../components/StudentSidebar';
import { clearStorageKeepTheme } from '../utils/theme';
import { apiFetch } from '../config/api';
import { useSEO } from '../hooks/useSEO';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
const STUDENT_DASHBOARD_TABS = ['tests', 'interviews', 'job-board', 'my-applications', 'profile'];

const Dashboard = () => {
  useSEO({
    title: "Student Dashboard - SHNOOR Assessments",
    description: "View and take your assigned tests",
    canonical: "https://assessments.shnoor.com/dashboard"
  });

  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institute, setInstitute] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) return;

    const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
    });

    socket.on('connect', () => {
      socket.emit('student:join-dashboard', { studentId });
    });

    socket.on('test:assigned', () => {
      // Refresh the queries to get new tests
      queryClient.invalidateQueries(['studentTests']);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const [selectedTest, setSelectedTest] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobRoleIndex, setSelectedJobRoleIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('studentDashboardTab');
    return STUDENT_DASHBOARD_TABS.includes(savedTab) ? savedTab : 'tests';
  });

  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('studentSidebarPinned');
    return saved === null ? true : saved === 'true';
  });
  const [filters, setFilters] = useState({
    published: 'all',
    attempted: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('latest');

  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['studentTests'],
    queryFn: async () => {
      const { validateAndCleanupToken } = await import('../utils/tokenValidator');
      if (!validateAndCleanupToken()) {
        navigate('/login');
        return { availableTests: [], testsWithProgress: new Set() };
      }

      const token = localStorage.getItem('studentAuthToken');
      if (!token) {
        navigate('/login');
        return { availableTests: [], testsWithProgress: new Set() };
      }

      setStudentName(localStorage.getItem('studentName') || 'Student');
      setStudentId(localStorage.getItem('studentId') || '');
      setInstitute(localStorage.getItem('institute') || '');

      const response = await apiFetch('api/student/tests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        clearStorageKeepTheme();
        navigate('/login');
        return { availableTests: [], testsWithProgress: new Set() };
      }

      if (!response.ok) {
        throw new Error('Failed to fetch tests');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to load tests');
      }

      const availableTests = data.tests || [];

          // Check for saved progress for each test
          const progressChecks = await Promise.all(
            availableTests.map(async (test) => {
              // Skip progress check if test is not available, already taken, or no attempts left
              if (!test.isAvailable || test.alreadyTaken || !test.hasAttemptsLeft) {
                return { testId: test.id, hasProgress: false };
              }

              try {
                const progressResponse = await apiFetch(`api/student/test/${test.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });

                if (progressResponse.ok) {
                  const progressData = await progressResponse.json();
                  return {
                    testId: test.id,
                    hasProgress: progressData.savedProgress !== null
                  };
                }
              } catch (err) {
                console.error(`Error checking progress for test ${test.id}:`, err);
              }
              return { testId: test.id, hasProgress: false };
            })
          );

          const testsWithProgress = new Set(
            progressChecks
              .filter(p => p.hasProgress)
              .map(p => p.testId)
          );

          return { availableTests, testsWithProgress };
        },
        refetchInterval: 30000
      });

  const availableTests = dashboardData?.availableTests || [];
  const testsWithProgress = dashboardData?.testsWithProgress || new Set();

  useEffect(() => {
    localStorage.setItem('studentDashboardTab', activeTab);
  }, [activeTab]);

  const handleLogout = () => {
    clearStorageKeepTheme();
    navigate('/login');
  };

  const handleTakeTest = (testId) => {
    localStorage.setItem('selectedTestId', testId);
    navigate('/instructions');
  };

  const handleViewJobDescription = useCallback((test) => {
    setSelectedTest(test);
    setSelectedJobRoleIndex(0);
    setShowJobModal(true);
  }, []);

  // Filter and Sort Tests — memoized so it only recomputes when inputs change
  const filteredTests = useMemo(() => {
    let filtered = [...availableTests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Attempted filter
    if (filters.attempted === 'attempted') {
      filtered = filtered.filter(test => test.alreadyTaken);
    } else if (filters.attempted === 'not-attempted') {
      filtered = filtered.filter(test => !test.alreadyTaken && test.attemptsTaken === 0);
    } else if (filters.attempted === 'in-progress') {
      filtered = filtered.filter(test => testsWithProgress.has(test.id));
    }

    // Date range filter (based on availability)
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(test => {
        if (!test.startDateTime) return true;
        const testDate = new Date(test.startDateTime);
        switch (filters.dateRange) {
          case 'today':
            return testDate.toDateString() === now.toDateString();
          case 'week': {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return testDate >= weekAgo;
          }
          case 'month':
            return testDate.getMonth() === now.getMonth() && testDate.getFullYear() === now.getFullYear();
          case 'year':
            return testDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.startDateTime || 0);
          const dateB = new Date(b.startDateTime || 0);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = new Date(a.startDateTime || 0);
          const dateB = new Date(b.startDateTime || 0);
          return dateA - dateB;
        });
        break;
      case 'duration-asc':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
      case 'duration-desc':
        filtered.sort((a, b) => b.duration - a.duration);
        break;
      default:
        break;
    }

    // Always put Mock Tests at the end
    const realTests = filtered.filter(t => !t.isMockTest);
    const mockTests = filtered.filter(t => t.isMockTest);

    return [...realTests, ...mockTests];
  }, [availableTests, searchTerm, filters, sortBy, testsWithProgress]);

  return (
    <div className="min-h-screen bg-[#F0F2F8] dark:bg-[#0E0E27] text-slate-900 dark:text-slate-100">
      {showJobModal && selectedTest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1E38] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden modal-3d-entrance">
            {/* Modal Header */}
            <div className="bg-[#403f75] dark:bg-indigo-600 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div className="flex-1 pr-4 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight capitalize truncate">
                  {selectedTest.title}
                </h3>
                <p className="text-white/80 text-xs mt-0.5 font-medium">
                  Job Role & Description
                </p>
              </div>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/15 rounded-xl p-1.5 transition-all flex-shrink-0 cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {selectedTest.jobRoles && selectedTest.jobRoles.length > 0 ? (
                <>
                  {/* Job role selector */}
                  {selectedTest.jobRoles.length > 1 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Select Job Role ({selectedTest.jobRoles.length} available)
                      </label>
                      <select
                        value={selectedJobRoleIndex}
                        onChange={(e) => setSelectedJobRoleIndex(parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#403f75] bg-white dark:bg-[#1A1A30] text-slate-800 dark:text-slate-100 font-medium text-sm"
                      >
                        {selectedTest.jobRoles.map((role, index) => (
                          <option key={index} value={index}>
                            {role.jobRole}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Job Role Display */}
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg flex items-center justify-center mr-2.5">
                        <FileText className="w-4 h-4 text-[#403f75] dark:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Job Role
                      </h4>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-xl">
                      <p className="text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg">
                        {selectedTest.jobRoles[selectedJobRoleIndex]?.jobRole || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Job Description */}
                  {selectedTest.jobRoles[selectedJobRoleIndex]?.jobDescription && (
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center mr-2.5">
                          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Job Description
                        </h4>
                      </div>
                      <div className="bg-white dark:bg-[#1A1A30] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                          {selectedTest.jobRoles[selectedJobRoleIndex].jobDescription}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : selectedTest.jobRole ? (
                <>
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg flex items-center justify-center mr-2.5">
                        <FileText className="w-4 h-4 text-[#403f75] dark:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Job Role
                      </h4>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-xl">
                      <p className="text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg">
                        {selectedTest.jobRole}
                      </p>
                    </div>
                  </div>

                  {selectedTest.description && (
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg flex items-center justify-center mr-2.5">
                          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Job Description
                        </h4>
                      </div>
                      <div className="bg-white dark:bg-[#1A1A30] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                          {selectedTest.description}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <FileText className="mx-auto h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No job description available for this test</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#18182E] border-t border-slate-200 dark:border-slate-800 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowJobModal(false)}
                className="px-5 py-2 bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-all shadow-2xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentHeader
        studentName={studentName}
        studentId={studentId}
        institute={institute}
        onLogout={handleLogout}
        showNotifications
      />

      {/* Main content */}
      <main className={`w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:pr-8 ${isSidebarExpanded ? 'lg:pl-[288px]' : 'lg:pl-[96px]'} pt-2.5 sm:pt-6 pb-12 transition-all duration-300 ease-in-out`}>
        {/* Sidebar Navigation */}
        <StudentSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onExpandChange={setIsSidebarExpanded}
        />

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  My Tests
                </h2>
                <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium">
                  View and take your assigned tests and assessments
                </p>
              </div>
            </div>

            {/* 3D Quick Metrics Overview */}
            {!loading && availableTests.length > 0 && (() => {
              const totalCount = availableTests.length;
              const completedCount = availableTests.filter(t => t.alreadyTaken).length;
              const inProgressCount = availableTests.filter(t => testsWithProgress.has(t.id)).length;
              const pendingCount = totalCount - completedCount;

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 perspective-1000">
                  <div className="bg-white dark:bg-[#1A1A32] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 card-3d-lift shimmer-hover transform-style-3d border-glow-hover animate-entry-3d stagger-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Assigned</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-[#403f75] dark:text-indigo-300 flex items-center justify-center layer-3d-deep icon-gesture shadow-2xs">
                        <FileText size={16} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white layer-3d-float">{totalCount}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Assessments enrolled</p>
                  </div>

                  <div className="bg-white dark:bg-[#1A1A32] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 card-3d-lift shimmer-hover transform-style-3d border-glow-hover animate-entry-3d stagger-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Available / Pending</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 flex items-center justify-center layer-3d-deep icon-gesture shadow-2xs">
                        <Clock size={16} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 layer-3d-float">{pendingCount}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Ready to attempt</p>
                  </div>

                  <div className="bg-white dark:bg-[#1A1A32] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 card-3d-lift shimmer-hover transform-style-3d border-glow-hover animate-entry-3d stagger-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">In Progress</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 flex items-center justify-center layer-3d-deep icon-gesture shadow-2xs relative">
                        {inProgressCount > 0 && (
                          <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-xl bg-amber-400 opacity-60"></span>
                        )}
                        <AlertCircle size={16} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 layer-3d-float">{inProgressCount}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Resume at any time</p>
                  </div>

                  <div className="bg-white dark:bg-[#1A1A32] border border-indigo-100/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 card-3d-lift shimmer-hover transform-style-3d border-glow-hover animate-entry-3d stagger-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Completed</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300 flex items-center justify-center layer-3d-deep icon-gesture shadow-2xs">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 layer-3d-float">{completedCount}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Submitted assessments</p>
                  </div>
                </div>
              );
            })()}

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shnoor-indigo"></div>
                <span className="ml-3 text-shnoor-indigoMedium">Loading...</span>
              </div>
            )}



            {!loading && availableTests.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <BookOpen className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Tests Available</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">You have completed all available tests or there are no new assessments at this time.</p>
              </div>
            )}

            {!loading && availableTests.length > 0 && (
              <>
                {/* Search & filter */}
                <div className="mb-8 sm:mb-10">
                  <ExamSearchFilter
                    onSearchChange={setSearchTerm}
                    onFilterChange={setFilters}
                    onSortChange={setSortBy}
                    showPublishedFilter={false}
                    showAttemptedFilter={true}
                    resultCount={filteredTests.length}
                    sortOptions={[
                      { value: 'latest', label: 'Latest Available' },
                      { value: 'oldest', label: 'Oldest Available' },
                      { value: 'duration-asc', label: 'Shortest Duration' },
                      { value: 'duration-desc', label: 'Longest Duration' }
                    ]}
                  />
                </div>

                {filteredTests.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-white dark:bg-[#1E1E38] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-4">
                    <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mb-4" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">No Tests Match Your Filters</h3>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search or filters to see more tests.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {filteredTests.map((test) => {
                      const isCompleted = test.alreadyTaken || test.testStatus === 'expired';
                      const isInProgress = test.isAvailable && !test.alreadyTaken && testsWithProgress.has(test.id);

                      // Uniform blue/indigo styling for cards
                      const topAccentGradient = 'from-[#403f75] via-indigo-500 to-[#57569b]';
                      const cardBorder = 'border border-indigo-100/90 dark:border-slate-800 hover:border-[#403f75]/60 dark:hover:border-indigo-500/50';
                      const iconBoxClass = 'bg-indigo-50 dark:bg-indigo-950/60 text-[#403f75] dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60';

                      return (
                        <div
                          key={test.id}
                          className={`bg-white dark:bg-[#1A1A32] ${cardBorder} ${test.isMockTest ? 'col-span-full' : ''} rounded-2xl flex flex-col justify-between card-3d-lift shimmer-hover min-h-[320px] h-full overflow-hidden group transform-style-3d border-glow-hover`}
                        >
                          {/* Card top color accent bar (3-4px) */}
                          <div className={`h-[3.5px] w-full bg-gradient-to-r ${topAccentGradient}`} />

                          <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                            <div className="flex-1 flex flex-col">
                              {/* Card Top Header: Badges and Icon */}
                              <div className="flex justify-between items-start mb-3.5 gap-2.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {/* Subject Tag */}
                                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50/80 dark:bg-indigo-950/50 text-[#403f75] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60">
                                    {test.subject || 'General'}
                                  </span>

                                  {/* Status Tags */}
                                  {test.isMockTest && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                      Mock Test
                                    </span>
                                  )}

                                  {isCompleted && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60">
                                      Attempts ({test.attemptsTaken}/{test.maxAttempts})
                                    </span>
                                  )}

                                  {!isCompleted && !test.isMockTest && test.isAvailable && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 animate-pulse-subtle">
                                      Available
                                    </span>
                                  )}

                                  {isInProgress && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/60 animate-pulse-subtle">
                                      In Progress
                                    </span>
                                  )}

                                  {test.testStatus === 'upcoming' && !test.alreadyTaken && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                                      Upcoming
                                    </span>
                                  )}
                                </div>

                                <div className={`w-8 h-8 rounded-xl ${iconBoxClass} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 group-hover:-rotate-3 layer-3d-deep shadow-2xs`}>
                                  <BookOpen size={15} />
                                </div>
                              </div>

                              {/* Title */}
                              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white capitalize tracking-tight mt-1 mb-1 break-words leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-shnoor-indigo dark:group-hover:text-indigo-300 transition-colors layer-3d-float" title={test.title}>
                                {test.title}
                              </h3>

                              {test.isMockTest && (
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-2">
                                  Practice test to get familiar with the assessment platform
                                </p>
                              )}

                              {/* Details List */}
                              <div className="space-y-2 mt-3.5 mb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center mr-2.5 flex-shrink-0 text-[#403f75] dark:text-indigo-400">
                                    <Clock size={13} />
                                  </div>
                                  <span>Duration: <strong className="text-slate-900 dark:text-white font-bold">{test.duration} mins</strong></span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center mr-2.5 flex-shrink-0 text-sky-600 dark:text-sky-400">
                                    <AlertCircle size={13} />
                                  </div>
                                  <span><strong className="text-slate-900 dark:text-white font-bold">{test.questions}</strong> Questions • <span className="capitalize">{test.difficulty || 'Medium'}</span></span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center mr-2.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                                    <BookOpen size={13} />
                                  </div>
                                  <span>Attempts: <strong className="text-slate-900 dark:text-white font-bold">{test.attemptsTaken}/{test.maxAttempts}</strong> ({test.attemptsRemaining} left)</span>
                                </div>
                                {test.startDateTime && (
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-2.5 flex-shrink-0 text-slate-500 dark:text-slate-400">
                                      <Clock size={13} />
                                    </div>
                                    <span className="truncate">From: <strong className="text-slate-800 dark:text-slate-200">{new Date(test.startDateTime).toLocaleDateString()}</strong></span>
                                  </div>
                                )}
                                {test.endDateTime && (
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-2.5 flex-shrink-0 text-slate-500 dark:text-slate-400">
                                      <Clock size={13} />
                                    </div>
                                    <span className="truncate">Until: <strong className="text-slate-800 dark:text-slate-200">{new Date(test.endDateTime).toLocaleDateString()}</strong></span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2.5 pt-2 mt-auto">
                              <button
                                onClick={() => handleViewJobDescription(test)}
                                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-[#1E1E38] hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-[#403f75] dark:hover:text-indigo-300 font-bold rounded-xl border border-slate-200/90 dark:border-slate-700 hover:border-indigo-200/80 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-2xs btn-action-gesture"
                              >
                                <FileText size={15} />
                                <span>View Job Description</span>
                              </button>

                              <button
                                onClick={() => test.isAvailable && !test.alreadyTaken && handleTakeTest(test.id)}
                                disabled={!test.isAvailable || test.alreadyTaken}
                                className={`w-full h-10 px-3.5 font-bold rounded-xl transition-all shadow-sm text-xs sm:text-sm flex items-center justify-center btn-action-gesture ${test.alreadyTaken
                                  ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed'
                                  : test.testStatus === 'upcoming'
                                    ? 'bg-amber-500 text-white cursor-not-allowed'
                                    : test.testStatus === 'expired'
                                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-[#403f75] to-[#57569b] hover:from-[#343360] hover:to-[#4a4988] text-white shadow-md shadow-[#403f75]/20 hover:shadow-lg cursor-pointer'
                                  }`}
                              >
                                {test.alreadyTaken
                                  ? `Completed (${test.attemptsTaken}/${test.maxAttempts} attempts)`
                                  : test.testStatus === 'upcoming'
                                    ? `Available from ${new Date(test.startDateTime).toLocaleDateString()}`
                                    : test.testStatus === 'expired'
                                      ? `Expired on ${new Date(test.endDateTime).toLocaleDateString()}`
                                      : isInProgress
                                        ? 'Resume Test'
                                        : `Take Test (${test.attemptsRemaining} attempts left)`}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Interviews
                </h2>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  View and join your scheduled interview sessions
                </p>
              </div>
            </div>
            <StudentInterviews />
          </>
        )}

        {/* Job Board Tab */}
        {activeTab === 'job-board' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Job Board
                </h2>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Explore and apply to active job openings and off-campus hiring opportunities
                </p>
              </div>
            </div>
            <JobBoard isEmbedded onTabChange={setActiveTab} />
          </>
        )}

        {/* My Applications Tab */}
        {activeTab === 'my-applications' && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  My Applications
                </h2>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Track your job applications, assessment progress, and status updates
                </p>
              </div>
            </div>
            <MyApplications isEmbedded onBrowseJobs={() => setActiveTab('job-board')} />
          </>
        )}

        {/* My Profile Tab */}
        {activeTab === 'profile' && (
          <StudentProfile />
        )}

        {/* Info Section */}
        {(activeTab === 'tests' || activeTab === 'interviews') && (
          <div className="mt-12 bg-white dark:bg-[#1E1E38] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_2px_12px_rgba(14,14,39,0.04)] overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-[#403f75] via-indigo-500 to-[#6868AC]" />
            <div className="p-6 sm:p-7">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
                Important Assessment Guidelines
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2.5 text-[#403f75] dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Stable Connection:</strong> Ensure you have a stable internet connection before starting.</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2.5 text-[#403f75] dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Fullscreen Mode:</strong> All tests require fullscreen mode and prohibit tab switching.</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2.5 text-[#403f75] dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Strict Warnings:</strong> Three warnings for tab switching will result in automatic submission.</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2.5 text-[#403f75] dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Auto-Saved Progress:</strong> Your progress is automatically saved — you can resume tests if interrupted.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
      <StudentSupportChatbot />
    </div>
  );
};

export default Dashboard;


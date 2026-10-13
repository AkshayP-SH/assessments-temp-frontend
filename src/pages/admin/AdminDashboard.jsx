import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FileSpreadsheet, Users, AlertCircle, Video, Loader2, Building2, Briefcase, Landmark, FileText, X,
  BarChart3, UploadCloud, ShieldAlert, CreditCard, MessageSquare, Settings, ChevronLeft, ChevronRight, ChevronDown, User
} from 'lucide-react';

import { apiFetch } from '../../config/api';
import AdminHeader from '../../components/AdminHeader';
import { useSEO } from '../../hooks/useSEO';

// Lazy load external submodules
const CreateTestSection = lazy(() => import('../../components/admin/CreateTestSection'));
const ViewTestDetailsModal = lazy(() => import('../../components/admin/ViewTestDetailsModal'));
const EditTestDetailsModal = lazy(() => import('../../components/admin/EditTestDetailsModal'));
const BulkStudentUpload = lazy(() => import('../../components/admin/BulkStudentUpload'));
const InstituteRegistrationControl = lazy(() => import('../../components/admin/InstituteRegistrationControl'));
const InterviewsList = lazy(() => import('./InterviewsList'));
const InterviewSchedule = lazy(() => import('./InterviewSchedule'));
const AdminJobOpenings = lazy(() => import('../../components/admin/AdminJobOpenings'));
const AdminReports = lazy(() => import('./AdminReports'));
const SubscriptionPlansSettings = lazy(() => import('./SubscriptionPlansSettings'));
const AdminProfile = lazy(() => import('./AdminProfile'));
const AdminSettings = lazy(() => import('./AdminSettings'));
const AdminClients = lazy(() => import('./AdminClients'));
const StudentMessages = lazy(() => import('./StudentMessages'));

// Modular Admin Components
import ExamsTab from './ExamsTab';
import ResultsTab from './ResultsTab';
import InstitutesTab from './InstitutesTab';
import ViolationsTab from './ViolationsTab';
import CloneModal from './CloneModal';
import JobModal from './JobModal';
import AssignedTestsModal from './AssignedTestsModal';
import StudentManageModal from './StudentManageModal';
import PreviewModal from './PreviewModal';
import TestHistoryModal from './TestHistoryModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId: routeExamId } = useParams();

  const isClientPortal = location.pathname.startsWith('/client');
  const basePath = isClientPortal ? '/client' : '/admin';

  const getTabFromLocation = useCallback(() => {
    const path = location.pathname.replace(/\/+$/, '');
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (path.endsWith('/settings')) return 'settings';
    if (tabParam) return tabParam;

    if (path.endsWith('/institutes')) return 'institutes';
    if (path.endsWith('/reports')) return 'reports';
    if (path.endsWith('/bulk-upload')) return 'bulk-upload';
    if (path.endsWith('/violations')) return 'violations';
    if (path.endsWith('/interviews')) return 'interviews';
    if (path.endsWith('/job-openings')) return 'job-openings';
    if (path.endsWith('/student-messages') || path.endsWith('/messages')) return 'messages';
    if (path.endsWith('/clients')) return 'clients';
    if (path.endsWith('/subscription-plans')) return 'subscription-plans';
    if (path.endsWith('/profile')) return 'profile';
    if (path.includes('/tests/create')) return 'create-test';
    if (path.includes('/results')) return 'results';
    return location.state?.activeTab || 'exams';
  }, [location.pathname, location.search, location.state]);

  const [activeTab, setActiveTab] = useState(getTabFromLocation);

  const isCreateTestRoute = location.pathname.includes('/tests/create');
  const [showCreateTest, setShowCreateTest] = useState(isCreateTestRoute);
  const [editingTest, setEditingTest] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(() => routeExamId || null);

  useEffect(() => {
    const isCreate = location.pathname.includes('/tests/create');
    setShowCreateTest(isCreate);

    if (routeExamId) {
      setSelectedExamId(routeExamId);
    } else if (!location.pathname.includes('/results')) {
      setSelectedExamId(null);
    }

    const tab = getTabFromLocation();
    if (tab !== 'create-test' && tab !== 'results') {
      setActiveTab(tab);
    }
  }, [location.pathname, location.search, routeExamId, getTabFromLocation]);

  const pageTitles = useMemo(() => ({
    exams: "Manage Exams - SHNOOR Assessments",
    institutes: "Manage Institutes - SHNOOR Assessments",
    reports: "Reports & Analytics - SHNOOR Assessments",
    'bulk-upload': "Bulk Student Upload - SHNOOR Assessments",
    violations: "Proctoring Violations - SHNOOR Assessments",
    interviews: "Interviews - SHNOOR Assessments",
    'job-openings': "Job Openings - SHNOOR Assessments",
    messages: "Student Messages - SHNOOR Assessments",
    clients: "Client Management - SHNOOR Assessments",
    'subscription-plans': "Subscription Plans - SHNOOR Assessments",
    profile: "Admin Profile - SHNOOR Assessments",
    settings: "Admin Settings - SHNOOR Assessments",
  }), []);

  useSEO({
    title: showCreateTest
      ? (editingTest ? "Edit Test - SHNOOR Assessments" : "Create Test - SHNOOR Assessments")
      : selectedExamId
        ? `Results - SHNOOR Assessments`
        : (pageTitles[activeTab] || "Admin Dashboard - SHNOOR Assessments"),
    description: "Manage tests, users, and settings"
  });
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedStudentsForDelete, setSelectedStudentsForDelete] = useState([]);
  const [studentsData, setStudentsData] = useState({});
  const [loading, setLoading] = useState(false);

  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pass', 'fail'
  const [showQuickSelectMenu, setShowQuickSelectMenu] = useState(false);

  // Job Role/Description Modal States
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobTest, setSelectedJobTest] = useState(null);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRoleIndex, setSelectedJobRoleIndex] = useState(0);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [isLoadingJobRoles, setIsLoadingJobRoles] = useState(false);

  // Institute Management States
  const [allInstitutes, setAllInstitutes] = useState([]);
  const [instituteSearchTerm, setInstituteSearchTerm] = useState('');
  const [isLoadingAllInstitutes, setIsLoadingAllInstitutes] = useState(false);
  const [newInstituteName, setNewInstituteName] = useState('');
  const [isAddingInstitute, setIsAddingInstitute] = useState(false);
  const [showRegistrationControlModal, setShowRegistrationControlModal] = useState(false);
  const [selectedInstituteForRegistration, setSelectedInstituteForRegistration] = useState(null);

  // Multi-Institute Selection States (for bulk test assignment)
  const [selectedInstitutes, setSelectedInstitutes] = useState([]);
  const [selectedTestsForMultipleInstitutes, setSelectedTestsForMultipleInstitutes] = useState([]);
  const [isAssigningTestToMultipleInstitutes, setIsAssigningTestToMultipleInstitutes] = useState(false);
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);

  // Assigned Tests Modal States
  const [showAssignedTestsModal, setShowAssignedTestsModal] = useState(false);
  const [selectedInstituteForTests, setSelectedInstituteForTests] = useState(null);
  const [assignedTests, setAssignedTests] = useState([]);
  const [isLoadingAssignedTests, setIsLoadingAssignedTests] = useState(false);
  const [selectedTestsForInstitute, setSelectedTestsForInstitute] = useState([]);
  const [isAssigningTestToInstitute, setIsAssigningTestToInstitute] = useState(false);
  const [isInstituteTestDropdownOpen, setIsInstituteTestDropdownOpen] = useState(false);
  const [selectedTestsForUnassign, setSelectedTestsForUnassign] = useState([]);
  const [isUnassigningTests, setIsUnassigningTests] = useState(false);

  // Student Management States
  const [showStudentManagementModal, setShowStudentManagementModal] = useState(false);
  const [selectedInstituteForStudents, setSelectedInstituteForStudents] = useState(null);
  const [instituteStudentsForManagement, setInstituteStudentsForManagement] = useState([]);
  const [isLoadingStudentsForManagement, setIsLoadingStudentsForManagement] = useState(false);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [selectedTestsForStudentModal, setSelectedTestsForStudentModal] = useState([]);
  const [isAssigningTestInModal, setIsAssigningTestInModal] = useState(false);
  const [isStudentTestDropdownOpen, setIsStudentTestDropdownOpen] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: '', end: '' });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [newStudentData, setNewStudentData] = useState({
    full_name: '',
    email: '',
    roll_number: '',
    institute: 'Others'
  });
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [expandedStudentTests, setExpandedStudentTests] = useState({});

  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    published: 'all',
    attempted: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('latest');

  const [examCurrentPage, setExamCurrentPage] = useState(1);
  const [examItemsPerPage, setExamItemsPerPage] = useState(9);

  const [instituteCurrentPage, setInstituteCurrentPage] = useState(1);
  const [instituteItemsPerPage, setInstituteItemsPerPage] = useState(9);

  const [resultsCurrentPage, setResultsCurrentPage] = useState(1);
  const [resultsRowsPerPage, setResultsRowsPerPage] = useState(40);

  // 3-Dot Menu States
  const [openMenuId, setOpenMenuId] = useState(null);

  // Clone Test Modal States
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [testToClone, setTestToClone] = useState(null);
  const [cloneTestName, setCloneTestName] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');

  // View/Edit Test Details Modal States
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [selectedTestForDetails, setSelectedTestForDetails] = useState(null);
  const [detailViewTab, setDetailViewTab] = useState('results'); // 'results' or 'feedback'
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Violations Tab States
  const [, setViolations] = useState([]);
  const [, setViolationSummary] = useState(null);
  const [flaggedStudents, setFlaggedStudents] = useState([]);
  const [violationsByStudent, setViolationsByStudent] = useState([]);
  const [selectedTestForViolations, setSelectedTestForViolations] = useState('');
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);

  // Preview Questions Modal States
  const [showPreviewQuestionsModal, setShowPreviewQuestionsModal] = useState(false);
  const [previewTest, setPreviewTest] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Test History Modal States
  const [showTestHistoryModal, setShowTestHistoryModal] = useState(false);
  const [testHistory, setTestHistory] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Interview Schedule Modal States
  const [showInterviewScheduleModal, setShowInterviewScheduleModal] = useState(false);
  const [selectedStudentForInterview, setSelectedStudentForInterview] = useState(null);

  // Super admin client filter — defaults to Shnoor International
  const [clientsList, setClientsList] = useState([]);
  const [viewAsClientId, setViewAsClientId] = useState(() => {
    return sessionStorage.getItem('superAdminSelectedClientId') || '';
  });
  const [quota, setQuota] = useState(null); // plan quota for client admin

  const isSuperAdmin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('adminUser') || '{}');
      return u.role === 'super_admin' || u.role === 'admin';
    } catch { return false; }
  })();

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch { return {}; }
  }, []);

  const defaultClientId = useMemo(() => {
    return '';
  }, [clientsList]);

  // Calculate days remaining for banner
  const daysRemaining = useMemo(() => {
    if (!currentUser?.subscriptionEndDate) return null;
    const diff = new Date(currentUser.subscriptionEndDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [currentUser]);

  const isClientAdmin = currentUser?.role === 'client_admin' || !!localStorage.getItem('clientToken');

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Sync unread message count from backend
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('clientToken');
        if (!token) return;
        const res = await apiFetch('api/student-messages/unread-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUnreadMessageCount(data.count || 0);
          }
        }
      } catch (err) {
        // silent
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const sidebarNavItems = useMemo(() => [
    { id: 'exams', label: 'Manage Exams', icon: FileSpreadsheet, path: `${basePath}/exams` },
    { id: 'institutes', label: 'Manage Institutes', icon: Landmark, path: `${basePath}/institutes` },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: `${basePath}/reports` },
    { id: 'bulk-upload', label: 'Bulk Upload', icon: UploadCloud, path: `${basePath}/bulk-upload` },
    { id: 'violations', label: 'Violations', icon: ShieldAlert, path: `${basePath}/violations` },
    { id: 'interviews', label: 'Interviews', icon: Video, path: `${basePath}/interviews` },
    { id: 'job-openings', label: 'Job Openings', icon: Briefcase, path: `${basePath}/job-openings` },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessageCount, path: `${basePath}/student-messages` },
    ...(!isClientAdmin ? [{ id: 'clients', label: 'Clients', icon: Building2, path: `${basePath}/clients` }] : []),
    ...(isSuperAdmin ? [{ id: 'subscription-plans', label: 'Subscription Plans', icon: CreditCard, path: `${basePath}/subscription-plans` }] : []),
    { id: 'profile', label: 'My Profile', icon: User, path: `${basePath}/profile` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `${basePath}/settings` }
  ], [basePath, isClientAdmin, isSuperAdmin, unreadMessageCount]);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('adminSidebarExpanded');
    return saved === null ? true : saved === 'true';
  });
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const isExpanded = isSidebarExpanded || isSidebarHovered;

  const toggleSidebarExpanded = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('adminSidebarExpanded', String(next));
      return next;
    });
  };

  // Fetch clients list for super admin selector and default to Shnoor International
  useEffect(() => {
    if (!isSuperAdmin) return;
    const token = localStorage.getItem('adminToken');
    apiFetch('api/clients', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const list = d.clients || [];
          setClientsList(list);

          const savedId = sessionStorage.getItem('superAdminSelectedClientId');
          // If already explicitly selected by Super Admin in this session, keep that choice
          if (savedId !== null && savedId !== undefined) {
            if (savedId === '') {
              setViewAsClientId('');
              return;
            }
            const exists = list.some(c => String(c.id) === String(savedId));
            if (exists) {
              setViewAsClientId(String(savedId));
              return;
            }
          }
          // Default to Global View for Super Admin
          if (!sessionStorage.getItem('superAdminSelectedClientId')) {
            setViewAsClientId('');
            sessionStorage.setItem('superAdminSelectedClientId', '');
          }
        }
      })
      .catch(() => { });
  }, [isSuperAdmin]);

  // Fetch quota for client admins (so they can see plan usage)
  useEffect(() => {
    if (isSuperAdmin) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    apiFetch('api/client/auth/me/quota', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success) setQuota(d.quota); })
      .catch(() => { });
  }, [isSuperAdmin]);

  const clientParam = (isSuperAdmin && viewAsClientId) ? `?clientId=${viewAsClientId}` : '';

  const handleSelectExam = (examId) => {
    if (examId) {
      setSelectedExamId(examId);
      navigate(`${basePath}/results/${examId}`);
    } else {
      setSelectedExamId(null);
      navigate(`${basePath}/exams`);
    }
    setSelectedCandidates([]);
    setResultsCurrentPage(1);
    setStatusFilter('all');
  };

  // Derived state: Get students for the selected exam
  const selectedExamStudents = selectedExamId ? (studentsData[selectedExamId] || []) : [];
  const selectedExamDetails = tests.find(t => t.id === selectedExamId);

  // Fetch feedback when feedback tab is selected
  useEffect(() => {
    if (selectedExamId && detailViewTab === 'feedback') {
      fetchFeedback();
    }
  }, [selectedExamId, detailViewTab, clientParam]);

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/test/${selectedExamId}${clientParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFeedbackData(data.feedbacks || []);
        setFeedbackStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Filter and Sort Tests — memoized so it only recomputes when deps change
  const filteredTests = useMemo(() => {
    let filtered = [...tests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Published/Draft filter
    if (filters.published !== 'all') {
      filtered = filtered.filter(test =>
        test.status === filters.published
      );
    }

    // Attempted filter (based on attempts count)
    if (filters.attempted === 'attempted') {
      filtered = filtered.filter(test => test.attempts > 0);
    } else if (filters.attempted === 'not-attempted') {
      filtered = filtered.filter(test => test.attempts === 0);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(test => {
        const testDate = new Date(test.date);
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
      case 'most-attempted':
        filtered.sort((a, b) => b.attempts - a.attempts);
        break;
      case 'latest':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
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

    return filtered;
  }, [tests, searchTerm, filters, sortBy]);

  const paginatedTests = useMemo(() => {
    const startIndex = (examCurrentPage - 1) * examItemsPerPage;
    return filteredTests.slice(startIndex, startIndex + examItemsPerPage);
  }, [filteredTests, examCurrentPage, examItemsPerPage]);
  const examTotalPages = Math.ceil(filteredTests.length / examItemsPerPage);

  const filteredInstitutes = useMemo(() => {
    if (!instituteSearchTerm) return allInstitutes;
    return allInstitutes.filter(inst =>
      inst.name.toLowerCase().includes(instituteSearchTerm.toLowerCase())
    );
  }, [allInstitutes, instituteSearchTerm]);

  const paginatedInstitutes = useMemo(() => {
    const startIndex = (instituteCurrentPage - 1) * instituteItemsPerPage;
    return filteredInstitutes.slice(startIndex, startIndex + instituteItemsPerPage);
  }, [filteredInstitutes, instituteCurrentPage, instituteItemsPerPage]);
  const instituteTotalPages = Math.ceil(filteredInstitutes.length / instituteItemsPerPage);

  useEffect(() => {
    setExamCurrentPage(1);
  }, [filteredTests]);

  useEffect(() => {
    setInstituteCurrentPage(1);
  }, [filteredInstitutes]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/login');
    else {
      fetchTests();
      if (activeTab === 'institutes') {
        fetchAllInstitutes();
      }
      if (activeTab === 'violations' && selectedTestForViolations) {
        fetchViolations();
      }
    }
  }, [navigate, activeTab, selectedTestForViolations, viewAsClientId]);

  // Auto-refresh institute counts every 30 s when on institutes tab (silent — no loading state, no alerts)
  useEffect(() => {
    if (activeTab !== 'institutes') return;
    const silentRefresh = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await apiFetch('api/institutes', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok && data.success) {
          setAllInstitutes(prev => JSON.stringify(data.institutes) === JSON.stringify(prev) ? prev : data.institutes);
        }
      } catch { /* silent background refresh */ }
    };
    const intervalId = setInterval(silentRefresh, 30000);
    return () => clearInterval(intervalId);
  }, [activeTab]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.relative')) {
        setOpenMenuId(null);
      }
      // Close test dropdown when clicking outside
      if (isTestDropdownOpen && !event.target.closest('.relative')) {
        setIsTestDropdownOpen(false);
      }
      // Close institute test dropdown when clicking outside
      if (isInstituteTestDropdownOpen && !event.target.closest('.relative')) {
        setIsInstituteTestDropdownOpen(false);
      }
      // Close student test dropdown when clicking outside
      if (isStudentTestDropdownOpen && !event.target.closest('.relative')) {
        setIsStudentTestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId, isTestDropdownOpen, isInstituteTestDropdownOpen, isStudentTestDropdownOpen]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests${clientParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Transform tests data to match UI expectations
        const transformedTests = data.tests.map(test => ({
          id: test.id,
          name: test.title,
          questions: test.question_count,
          attempts: parseInt(test.total_attempts) || 0,
          avgScore: 0, // Will be updated from detailed results if available
          passedCount: parseInt(test.pass_count ?? test.passed_count) || 0,
          passRate: parseInt(test.pass_percentage) || 0,
          status: test.status || 'draft',
          duration: test.duration || 60,
          maxAttempts: test.max_attempts || 1,
          passingPercentage: test.passing_percentage || 50,
          startDateTime: test.start_datetime,
          endDateTime: test.end_datetime,
          jobRole: test.job_role || '',
          description: test.description || '',
          date: new Date(test.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }));

        setTests(transformedTests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId && !studentsData[selectedExamId]) {
      fetchResultsForTest(selectedExamId);
    }
  }, [selectedExamId, studentsData]);

  const fetchResultsForTest = async (testId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/export/all-results?testId=${testId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.results)) {
        const testObj = tests.find(t => t.id === testId);
        const filtered = data.results.filter(result => {
          if (result.test_id && (result.test_id === testId || String(result.test_id) === String(testId))) {
            return true;
          }
          if (testObj && testObj.name && result.exam_name && result.exam_name.trim().toLowerCase() === testObj.name.trim().toLowerCase()) {
            return true;
          }
          return false;
        });

        const testResults = filtered.map(result => ({
          id: result.roll_number || result.student_id,
          student_id: result.student_id,
          name: result.student_name,
          email: result.student_email,
          institute_name: result.institute_name || 'Not Specified',
          score: result.marks_obtained,
          total: result.total_marks,
          passingPercentage: result.passing_percentage || testObj?.passingPercentage || selectedExamDetails?.passingPercentage || 50,
          date: result.submitted_at ? new Date(result.submitted_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A',
          noFace: result.no_face_count || 0,
          multipleFaces: result.multiple_faces_count || 0,
          phoneDetected: result.phone_detected_count || 0,
          loudNoise: result.loud_noise_count || 0,
          voiceDetected: result.voice_detected_count || 0,
          totalViolations: result.total_violations || 0,
          highSeverityCount: result.high_severity_count || 0,
          flagged: (result.high_severity_count || 0) >= 3
        }));

        setStudentsData(prev => ({
          ...prev,
          [testId]: testResults
        }));
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleDeleteTest = async (testId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${testId}${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTests(prevTests => prevTests.filter(test => test.id !== testId));
        if (activeTab === 'institutes') {
          fetchAllInstitutes();
        }
      } else {
        alert('Failed to delete test');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete test');
    }
  };

  const handleBulkDeleteTests = async () => {
    if (selectedTests.length === 0) {
      alert('Please select tests to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTests.length} test(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/bulk${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test_ids: selectedTests })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Successfully deleted ${data.deleted_count} test(s)`);
        setSelectedTests([]);
        setTests(prevTests => prevTests.filter(test => !selectedTests.includes(test.id)));
        if (activeTab === 'institutes') {
          fetchAllInstitutes();
        }
      } else {
        alert(data.message || 'Failed to delete tests');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete tests');
    }
  };

  const toggleTestSelection = (testId) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const toggleAllTests = () => {
    if (selectedTests.length === filteredTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(filteredTests.map(t => t.id));
    }
  };

  const handleTogglePublish = async (testId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publish' : 'unpublish';

    if (!confirm(`Are you sure you want to ${action} this test?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${testId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Test ${action}ed successfully`);
        fetchTests(); // Refresh the list
      } else {
        alert(data.message || `Failed to ${action} test`);
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      alert(`Failed to ${action} test`);
    }
  };

  const handleCreateTestComplete = (updatedTest) => {
    setShowCreateTest(false);
    setEditingTest(null);
    if (updatedTest) {
      setTests(prevTests => prevTests.map(test => test.id === updatedTest.id
        ? {
          ...test,
          ...updatedTest,
          name: updatedTest.title || updatedTest.name || test.name,
          questions: updatedTest.question_count ?? updatedTest.questions ?? test.questions,
          duration: updatedTest.duration || test.duration,
          passingPercentage: updatedTest.passing_percentage ?? updatedTest.passingPercentage ?? test.passingPercentage,
          status: updatedTest.status || test.status
        }
        : test
      ));
    }
    fetchTests(); // Refresh the list
  };

  const exportToExcel = async () => {
    if (selectedExamStudents.length === 0) {
      alert('No results to export. No students have taken this exam yet.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      let url = `api/export/results?testId=${selectedExamId}`;

      if (selectedCandidates.length > 0) {
        console.log('Exporting selected students:', selectedCandidates);
        url += `&studentIds=${selectedCandidates.join(',')}`;
      }

      const response = await apiFetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          alert(errorData.error || 'No results found for this exam. Please ensure students have completed the exam before exporting.');
        } else {
          alert(errorData.error || 'Failed to export results. Please try again.');
        }
        return;
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `exam_${selectedExamId}_results.xlsx`;

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      if (selectedCandidates.length > 0) {
        alert('Excel file downloaded successfully!');
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export results. Please try again.');
    }
  };

  const handleDownloadShortlistedPDF = async () => {
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate');
      return;
    }

    try {
      const selectedStudents = selectedExamStudents.filter(student => {
        const studentIdentifier = student.student_id || student.id;
        return selectedCandidates.includes(studentIdentifier);
      });

      if (selectedStudents.length === 0) {
        alert('Error: Could not find selected students. Please try again.');
        return;
      }

      const collegeName = selectedStudents[0]?.institute_name || 'Not Specified';
      const examName = selectedExamDetails?.name || 'Exam';

      const pdfData = selectedStudents.map(student => {
        const percentage = (student.score / student.total * 100);
        const isPassed = percentage >= (student.passingPercentage || selectedExamDetails?.passingPercentage || 50);
        const isShortlisted = isPassed && !student.flagged;
        return {
          student_id: student.student_id || student.id,
          roll_number: student.id,
          full_name: student.name,
          student_name: student.name,
          name: student.name,
          email: student.email,
          date: student.date,
          marks_obtained: student.score,
          total_marks: student.total,
          percentage: percentage.toFixed(2),
          status: isPassed ? 'Pass' : 'Fail',
          no_face: student.noFace || 0,
          multiple_faces: student.multipleFaces || 0,
          phone_detected: student.phoneDetected || 0,
          loud_noise: student.loudNoise || 0,
          voice_detected: student.voiceDetected || 0,
          total_violations: student.totalViolations || 0,
          flagged: student.flagged ? 'Yes' : 'No',
          shortlisted: isShortlisted ? 'Yes' : 'No'
        };
      });

      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/export/shortlisted-pdf`,
        {
          examName,
          collegeName,
          students: pdfData
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Shortlisted_${examName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      alert('PDF downloaded successfully!');
      setSelectedCandidates([]);
    } catch (error) {
      console.error('PDF download error:', error);
      let errorMessage = 'Failed to generate PDF. Please try again.';
      if (error.response?.data) {
        try {
          if (error.response.data instanceof Blob) {
            const text = await error.response.data.text();
            const jsonError = JSON.parse(text);
            errorMessage = jsonError.message || errorMessage;
          } else if (typeof error.response.data === 'object') {
            errorMessage = error.response.data.message || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
      }
      alert(errorMessage);
    }
  };

  const getPassingPercentage = (student) => {
    return student.passingPercentage || selectedExamDetails?.passingPercentage || 50;
  };

  const handleViewJob = async (test) => {
    setSelectedJobTest(test);
    setIsEditingJob(false);
    setShowJobModal(true);
    setIsLoadingJobRoles(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${test.id}/job-roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success && data.job_roles.length > 0) {
        const roles = data.job_roles.map(r => ({
          jobRole: r.job_role,
          jobDescription: r.job_description,
          isDefault: r.is_default
        }));
        setJobRoles(roles);
        setSelectedJobRoleIndex(0);
      } else {
        setJobRoles([{
          jobRole: test.jobRole || '',
          jobDescription: test.description || '',
          isDefault: true
        }]);
        setSelectedJobRoleIndex(0);
      }
    } catch (error) {
      console.error('Error fetching job roles:', error);
      setJobRoles([{
        jobRole: test.jobRole || '',
        jobDescription: test.description || '',
        isDefault: true
      }]);
      setSelectedJobRoleIndex(0);
    } finally {
      setIsLoadingJobRoles(false);
    }
  };

  const handleSaveJob = async () => {
    try {
      setIsSavingJob(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${selectedJobTest.id}/job-roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_roles: jobRoles.map(r => ({
            job_role: r.jobRole.trim(),
            job_description: r.jobDescription.trim()
          }))
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Job roles updated successfully');
        setIsEditingJob(false);
        fetchTests(); // Refresh the list
      } else {
        alert(data.message || 'Failed to update job roles');
      }
    } catch (error) {
      console.error('Error updating job roles:', error);
      alert('Failed to update job roles');
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleAddJobRole = () => {
    setJobRoles([...jobRoles, { jobRole: '', jobDescription: '', isDefault: false }]);
  };

  const handleRemoveJobRole = (index) => {
    const newJobRoles = jobRoles.filter((_, i) => i !== index);
    setJobRoles(newJobRoles);
    if (selectedJobRoleIndex >= newJobRoles.length) {
      setSelectedJobRoleIndex(Math.max(newJobRoles.length - 1, 0));
    }
  };

  const handleJobRoleChange = (index, field, value) => {
    const newJobRoles = [...jobRoles];
    newJobRoles[index][field] = value;
    setJobRoles(newJobRoles);
  };

  const handleViewTestDetails = (test) => {
    setSelectedTestForDetails(test);
    setShowViewDetailsModal(true);
    setOpenMenuId(null);
  };

  const handleEditTestDetails = (test) => {
    setSelectedTestForDetails(test);
    setShowEditDetailsModal(true);
    setOpenMenuId(null);
  };

  const handleSaveTestDetails = () => {
    setShowEditDetailsModal(false);
    setSelectedTestForDetails(null);
    fetchTests();
    alert('Test details updated successfully!');
  };

  const handleOpenCloneModal = (test) => {
    setTestToClone(test);
    setCloneTestName(`${test.name} (Copy)`);
    setCloneError('');
    setShowCloneModal(true);
    setOpenMenuId(null);
  };

  const handlePreviewQuestions = async (test) => {
    setPreviewTest(test);
    setShowPreviewQuestionsModal(true);
    setIsLoadingPreview(true);
    setOpenMenuId(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${test.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const mcqQuestions = (data.test.questions || []).map(question => ({
          ...question,
          type: 'mcq'
        }));
        const codingQuestions = (data.test.codingQuestions || []).map(question => ({
          ...question,
          type: 'coding'
        }));
        setPreviewQuestions([...mcqQuestions, ...codingQuestions]);
      } else {
        alert('Failed to load questions');
        setShowPreviewQuestionsModal(false);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Failed to load questions');
      setShowPreviewQuestionsModal(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleViewTestHistory = async (test) => {
    setShowTestHistoryModal(true);
    setIsLoadingHistory(true);
    setOpenMenuId(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/tests/${test.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestHistory({
          testName: test.name,
          createdBy: data.test.created_by || 'Admin',
          createdAt: data.test.created_at,
          updatedBy: data.test.updated_by || 'N/A',
          updatedAt: data.test.updated_at || data.test.created_at
        });
      } else {
        setTestHistory({
          testName: test.name,
          createdBy: 'Admin',
          createdAt: test.date,
          updatedBy: 'N/A',
          updatedAt: test.date
        });
      }
    } catch (error) {
      console.error('Error loading test history:', error);
      setTestHistory({
        testName: test.name,
        createdBy: 'Admin',
        createdAt: test.date,
        updatedBy: 'N/A',
        updatedAt: test.date
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCloneTest = async () => {
    if (!cloneTestName.trim()) {
      setCloneError('Test name is required');
      return;
    }

    if (cloneTestName.trim().length < 3) {
      setCloneError('Test name must be at least 3 characters');
      return;
    }

    const nameExists = tests.some(t => t.name.toLowerCase() === cloneTestName.trim().toLowerCase());
    if (nameExists) {
      setCloneError('A test with this name already exists. Please choose a different name.');
      return;
    }

    try {
      setIsCloning(true);
      setCloneError('');
      const token = localStorage.getItem('adminToken');

      const response = await apiFetch(`api/tests/${testToClone.id}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_title: cloneTestName.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Test cloned successfully! New test: "${data.test.title}"`);
        setShowCloneModal(false);
        setTestToClone(null);
        setCloneTestName('');
        fetchTests();
      } else {
        setCloneError(data.message || 'Failed to clone test');
      }
    } catch (error) {
      console.error('Error cloning test:', error);
      setCloneError(error.message || 'Failed to clone test');
    } finally {
      setIsCloning(false);
    }
  };

  // Institute Management Functions
  const fetchAllInstitutes = async () => {
    try {
      setIsLoadingAllInstitutes(true);
      const token = localStorage.getItem('adminToken');

      const response = await apiFetch(`api/institutes${clientParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAllInstitutes(data.institutes);
      } else {
        console.error('Failed to fetch institutes:', data.message);
        alert(`Failed to fetch institutes: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      alert(`Error fetching institutes: ${error.message}`);
    } finally {
      setIsLoadingAllInstitutes(false);
    }
  };

  const handleAddInstitute = async () => {
    if (!newInstituteName.trim()) {
      alert('Please enter an institute name');
      return;
    }

    try {
      setIsAddingInstitute(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes${clientParam}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instituteName: newInstituteName.trim(),
          client_id: viewAsClientId || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Institute added successfully');
        setNewInstituteName('');
        setAllInstitutes(prevInstitutes => [
          {
            ...data.institute,
            student_count: data.institute.student_count ?? 0,
            assigned_tests_count: data.institute.assigned_tests_count ?? 0
          },
          ...prevInstitutes.filter(institute => institute.id !== data.institute.id)
        ]);
      } else {
        toast.error(data.message || 'Failed to add institute');
      }
    } catch (error) {
      console.error('Error adding institute:', error);
      toast.error('Failed to add institute');
    } finally {
      setIsAddingInstitute(false);
    }
  };

  const handleDeleteInstitute = async (instituteId, instituteName) => {
    if (!confirm(`Permanently delete "${instituteName}" and all students registered under it? This cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${instituteId}${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Institute and registered students deleted successfully');
        setAllInstitutes(prevInstitutes => prevInstitutes.filter(institute => institute.id !== instituteId));
      } else {
        alert(data.message || 'Failed to delete institute');
      }
    } catch (error) {
      console.error('Error deleting institute:', error);
      alert('Failed to delete institute');
    }
  };

  const toggleInstituteSelection = (instituteId) => {
    setSelectedInstitutes(prev => {
      if (prev.includes(instituteId)) {
        return prev.filter(id => id !== instituteId);
      } else {
        return [...prev, instituteId];
      }
    });
  };

  const toggleAllInstitutes = () => {
    if (selectedInstitutes.length === allInstitutes.length) {
      setSelectedInstitutes([]);
    } else {
      setSelectedInstitutes(allInstitutes.map(inst => inst.id));
    }
  };

  const handleAssignTestToMultipleInstitutes = async () => {
    if (selectedInstitutes.length === 0) {
      alert('Please select at least one institute');
      return;
    }

    if (selectedTestsForMultipleInstitutes.length === 0) {
      alert('Please select at least one test to assign');
      return;
    }

    const confirmMessage = `Assign ${selectedTestsForMultipleInstitutes.length} test${selectedTestsForMultipleInstitutes.length !== 1 ? 's' : ''} to ${selectedInstitutes.length} institute${selectedInstitutes.length !== 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsAssigningTestToMultipleInstitutes(true);
      const token = localStorage.getItem('adminToken');

      let successCount = 0;
      let failCount = 0;
      let alreadyAssignedCount = 0;
      const successfulAssignmentsByInstitute = {};
      const errors = [];

      for (const instituteId of selectedInstitutes) {
        for (const testId of selectedTestsForMultipleInstitutes) {
          try {
            const response = await apiFetch(`api/institutes/${instituteId}/assign-test${clientParam}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                test_id: testId
              })
            });

            const data = await response.json();

            if (response.ok && data.success) {
              if (data.already_assigned) {
                alreadyAssignedCount++;
              } else {
                successCount++;
                successfulAssignmentsByInstitute[instituteId] = (successfulAssignmentsByInstitute[instituteId] || 0) + 1;
              }
            } else if (data.message && data.message.includes('already assigned')) {
              alreadyAssignedCount++;
            } else {
              failCount++;
              const institute = allInstitutes.find(i => i.id === instituteId);
              const test = tests.find(t => t.id === testId);
              errors.push(`${institute?.display_name || `Institute ${instituteId}`} - ${test?.name || `Test ${testId}`}: ${data.message}`);
            }
          } catch (error) {
            failCount++;
            const institute = allInstitutes.find(i => i.id === instituteId);
            const test = tests.find(t => t.id === testId);
            errors.push(`${institute?.display_name || `Institute ${instituteId}`} - ${test?.name || `Test ${testId}`}: ${error.message}`);
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      let summaryMessage = '';
      if (successCount > 0) {
        summaryMessage += `✓ Successfully assigned ${successCount} test${successCount !== 1 ? 's' : ''}\n`;
      }
      if (alreadyAssignedCount > 0) {
        summaryMessage += `ℹ ${alreadyAssignedCount} test${alreadyAssignedCount !== 1 ? 's were' : ' was'} already assigned\n`;
      }
      if (failCount > 0) {
        summaryMessage += `✗ Failed to assign ${failCount} test${failCount !== 1 ? 's' : ''}\n`;
        if (errors.length > 0) {
          summaryMessage += `\nErrors:\n${errors.slice(0, 3).join('\n')}`;
          if (errors.length > 3) {
            summaryMessage += `\n... and ${errors.length - 3} more`;
          }
        }
      }

      alert(summaryMessage || 'Test assignment completed');

      setSelectedInstitutes([]);
      setSelectedTestsForMultipleInstitutes([]);
      setIsTestDropdownOpen(false);
      setAllInstitutes(prevInstitutes => prevInstitutes.map(institute => ({
        ...institute,
        assigned_tests_count: Number(institute.assigned_tests_count || 0) + (successfulAssignmentsByInstitute[institute.id] || 0)
      })));

    } catch (error) {
      console.error('Error assigning test to institutes:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsAssigningTestToMultipleInstitutes(false);
    }
  };

  const handleViewAssignedTests = async (institute) => {
    setSelectedInstituteForTests(institute);
    setShowAssignedTestsModal(true);
    setIsLoadingAssignedTests(true);
    setSelectedTestsForInstitute([]);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${institute.id}/assigned-tests${clientParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAssignedTests(data.tests);
      } else {
        console.error('Failed to fetch assigned tests:', data.message);
        setAssignedTests([]);
      }
    } catch (error) {
      console.error('Error fetching assigned tests:', error);
      setAssignedTests([]);
    } finally {
      setIsLoadingAssignedTests(false);
    }
  };

  const handleAssignTestToInstitute = async () => {
    if (selectedTestsForInstitute.length === 0) {
      alert('Please select at least one test to assign');
      return;
    }

    try {
      setIsAssigningTestToInstitute(true);
      const token = localStorage.getItem('adminToken');

      let successCount = 0;
      let alreadyAssignedCount = 0;
      let failCount = 0;
      const errors = [];

      for (const testId of selectedTestsForInstitute) {
        try {
          const response = await apiFetch(`api/institutes/${selectedInstituteForTests.id}/assign-test${clientParam}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              test_id: parseInt(testId)
            })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            if (data.already_assigned) {
              alreadyAssignedCount++;
            } else {
              successCount++;
            }
          } else if (data.already_assigned || (data.message && data.message.includes('already assigned'))) {
            alreadyAssignedCount++;
          } else {
            failCount++;
            const test = tests.find(t => t.id === testId);
            errors.push(`${test?.name || `Test ${testId}`}: ${data.message}`);
          }
        } catch (error) {
          failCount++;
          const test = tests.find(t => t.id === testId);
          errors.push(`${test?.name || `Test ${testId}`}: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      let summaryMessage = '';
      if (successCount > 0) {
        summaryMessage += `✓ Successfully assigned ${successCount} test${successCount !== 1 ? 's' : ''}\n`;
      }
      if (alreadyAssignedCount > 0) {
        summaryMessage += `ℹ ${alreadyAssignedCount} test${alreadyAssignedCount !== 1 ? 's were' : ' was'} already assigned\n`;
      }
      if (failCount > 0) {
        summaryMessage += `✗ Failed to assign ${failCount} test${failCount !== 1 ? 's' : ''}\n`;
        if (errors.length > 0) {
          summaryMessage += `\nErrors:\n${errors.slice(0, 3).join('\n')}`;
          if (errors.length > 3) {
            summaryMessage += `\n... and ${errors.length - 3} more`;
          }
        }
      }

      alert(summaryMessage || 'Tests assigned successfully');
      setSelectedTestsForInstitute([]);
      handleViewAssignedTests(selectedInstituteForTests);
      if (successCount > 0) {
        setAllInstitutes(prevInstitutes => prevInstitutes.map(institute => institute.id === selectedInstituteForTests.id
          ? { ...institute, assigned_tests_count: Number(institute.assigned_tests_count || 0) + successCount }
          : institute
        ));
      }
    } catch (error) {
      console.error('Error assigning test:', error);
      alert('Failed to assign tests');
    } finally {
      setIsAssigningTestToInstitute(false);
    }
  };

  const handleBulkUnassignTests = async () => {
    if (selectedTestsForUnassign.length === 0) {
      alert('Please select tests to unassign');
      return;
    }

    const confirmMessage = `Are you sure you want to unassign ${selectedTestsForUnassign.length} test${selectedTestsForUnassign.length !== 1 ? 's' : ''} from this institute?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsUnassigningTests(true);

    try {
      const token = localStorage.getItem('adminToken');
      let successCount = 0;
      let errors = [];

      for (const testId of selectedTestsForUnassign) {
        try {
          const response = await apiFetch(`api/institutes/${selectedInstituteForTests.id}/unassign-test/${testId}${clientParam}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();

          if (response.ok && data.success) {
            successCount++;
          } else {
            const test = assignedTests.find(t => t.id === testId);
            errors.push(`${test?.title || `Test ${testId}`}: ${data.message}`);
          }
        } catch (error) {
          const test = assignedTests.find(t => t.id === testId);
          errors.push(`${test?.title || `Test ${testId}`}: ${error.message}`);
        }
      }

      let summaryMessage = `Successfully unassigned ${successCount} test${successCount !== 1 ? 's' : ''}`;
      if (errors.length > 0) {
        summaryMessage += `\n\nFailed to unassign ${errors.length} test${errors.length !== 1 ? 's' : ''}:\n${errors.join('\n')}`;
      }

      alert(summaryMessage);
      setSelectedTestsForUnassign([]);
      handleViewAssignedTests(selectedInstituteForTests);
      fetchAllInstitutes();
    } catch (error) {
      console.error('Error bulk unassigning tests:', error);
      alert('Failed to unassign tests');
    } finally {
      setIsUnassigningTests(false);
    }
  };

  const toggleTestForUnassign = (testId) => {
    setSelectedTestsForUnassign(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const toggleAllTestsForUnassign = () => {
    if (selectedTestsForUnassign.length === assignedTests.length) {
      setSelectedTestsForUnassign([]);
    } else {
      setSelectedTestsForUnassign(assignedTests.map(test => test.id));
    }
  };

  const handleUnassignTest = async (testId, testTitle) => {
    if (!confirm(`Are you sure you want to unassign "${testTitle}" from this institute?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${selectedInstituteForTests.id}/unassign-test/${testId}${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Test unassigned successfully');
        handleViewAssignedTests(selectedInstituteForTests);
        setAllInstitutes(prevInstitutes => prevInstitutes.map(institute => institute.id === selectedInstituteForTests.id
          ? { ...institute, assigned_tests_count: Math.max(0, Number(institute.assigned_tests_count || 0) - 1) }
          : institute
        ));
      } else {
        alert(data.message || 'Failed to unassign test');
      }
    } catch (error) {
      console.error('Error unassigning test:', error);
      alert('Failed to unassign test');
    }
  };

  // Student Management Functions
  const handleManageStudents = async (institute) => {
    setSelectedInstituteForStudents(institute);
    setShowStudentManagementModal(true);
    setIsLoadingStudentsForManagement(true);
    setShowAddStudentForm(false);
    setNewStudentData({
      full_name: '',
      email: '',
      roll_number: '',
      institute: institute.display_name
    });

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/${encodeURIComponent(institute.name)}/students${clientParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInstituteStudentsForManagement(data.students);
      } else {
        console.error('Failed to fetch students:', data.message);
        setInstituteStudentsForManagement([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setInstituteStudentsForManagement([]);
    } finally {
      setIsLoadingStudentsForManagement(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentData.full_name.trim() || !newStudentData.email.trim()) {
      alert('Full name and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStudentData.email.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsAddingStudent(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/student/create${clientParam}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: newStudentData.full_name.trim(),
          email: newStudentData.email.trim(),
          roll_number: newStudentData.roll_number.trim() || null,
          institute: selectedInstituteForStudents.name
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Student added successfully');
        setShowAddStudentForm(false);
        setNewStudentData({
          full_name: '',
          email: '',
          roll_number: '',
          institute: selectedInstituteForStudents.display_name
        });
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes();
      } else {
        toast.error(data.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to delete "${studentName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/student/${studentId}${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Student deleted successfully');
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!confirm(`Are you sure you want to delete ALL students from "${selectedInstituteForStudents.display_name}"? This action cannot be undone.`)) {
      return;
    }

    if (!confirm('This will permanently delete all students and their data. Are you absolutely sure?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/student/institute/${encodeURIComponent(selectedInstituteForStudents.name)}/all${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'All students deleted successfully');
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to delete students');
      }
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('Failed to delete students');
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentsForDelete.length === 0) {
      alert('Please select students to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStudentsForDelete.length} student(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/student/bulk${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_ids: selectedStudentsForDelete })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Successfully deleted ${data.deleted_count} student(s)`);
        setSelectedStudentsForDelete([]);
        handleManageStudents(selectedInstituteForStudents);
        fetchAllInstitutes();
      } else {
        alert(data.message || 'Failed to delete students');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete students');
    }
  };

  const toggleStudentForDelete = (studentId) => {
    setSelectedStudentsForDelete(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudentsForDelete = (students) => {
    const studentIds = students.map(s => s.id);
    if (selectedStudentsForDelete.length === studentIds.length &&
      studentIds.every(id => selectedStudentsForDelete.includes(id))) {
      setSelectedStudentsForDelete([]);
    } else {
      setSelectedStudentsForDelete(studentIds);
    }
  };

  const handleSelectRange = (students = instituteStudentsForManagement) => {
    const startIdx = parseInt(selectionRange.start) - 1;
    const endIdx = parseInt(selectionRange.end) - 1;

    if (isNaN(startIdx) || isNaN(endIdx) || startIdx < 0 || endIdx >= students.length || startIdx > endIdx) {
      alert('Please enter a valid range (e.g., 1 to ' + students.length + ')');
      return;
    }

    const studentsToSelect = students.slice(startIdx, endIdx + 1).map(s => s.id);

    setSelectedStudentsForDelete(prev => {
      const newSelection = new Set([...prev, ...studentsToSelect]);
      return Array.from(newSelection);
    });
  };

  const handleAssignTestInModal = async () => {
    if (selectedTestsForStudentModal.length === 0) {
      alert('⚠️ Please select at least one test to assign');
      return;
    }

    if (selectedStudentsForDelete.length === 0) {
      alert('⚠️ Please select at least one student');
      return;
    }

    if (!confirm(`Assign ${selectedTestsForStudentModal.length} test${selectedTestsForStudentModal.length !== 1 ? 's' : ''} to ${selectedStudentsForDelete.length} student${selectedStudentsForDelete.length !== 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      setIsAssigningTestInModal(true);
      const token = localStorage.getItem('adminToken');

      let totalSuccess = 0;
      let totalAlreadyAssigned = 0;
      let totalFailed = 0;

      for (const testId of selectedTestsForStudentModal) {
        try {
          const response = await apiFetch(`api/tests/assign${clientParam}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              test_id: parseInt(testId),
              student_ids: selectedStudentsForDelete
            })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            totalSuccess += data.newly_assigned || 0;
            totalAlreadyAssigned += data.already_assigned || 0;
          } else {
            totalFailed += selectedStudentsForDelete.length;
          }
        } catch (error) {
          console.error('Error assigning test:', error);
          totalFailed += selectedStudentsForDelete.length;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      let summaryMessage = '';
      if (totalSuccess > 0) {
        summaryMessage += `✅ Successfully assigned ${totalSuccess} test assignment${totalSuccess !== 1 ? 's' : ''}\n`;
      }
      if (totalAlreadyAssigned > 0) {
        summaryMessage += `ℹ️ ${totalAlreadyAssigned} test${totalAlreadyAssigned !== 1 ? 's were' : ' was'} already assigned\n`;
      }
      if (totalFailed > 0) {
        summaryMessage += `❌ Failed to assign ${totalFailed} test assignment${totalFailed !== 1 ? 's' : ''}`;
      }

      alert(summaryMessage || '✅ Tests assigned successfully');
      setSelectedStudentsForDelete([]);
      setSelectedTestsForStudentModal([]);
      handleManageStudents(selectedInstituteForStudents);
      fetchAllInstitutes();
    } catch (error) {
      console.error('Error assigning test:', error);
      alert('❌ An error occurred while assigning tests');
    } finally {
      setIsAssigningTestInModal(false);
    }
  };

  const toggleStudentTests = async (student) => {
    const studentId = student.id;

    if (expandedStudentTests[studentId]) {
      setExpandedStudentTests(prev => ({ ...prev, [studentId]: null }));
      return;
    }

    setExpandedStudentTests(prev => ({ ...prev, [studentId]: { loading: true, tests: [] } }));

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/students/${studentId}/assigned-tests${clientParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExpandedStudentTests(prev => ({
          ...prev,
          [studentId]: { loading: false, tests: data.tests || [], student: student }
        }));
      } else {
        alert(data.message || 'Failed to fetch assigned tests');
        setExpandedStudentTests(prev => ({ ...prev, [studentId]: null }));
      }
    } catch (error) {
      console.error('Error fetching student tests:', error);
      alert('Failed to fetch assigned tests');
      setExpandedStudentTests(prev => ({ ...prev, [studentId]: null }));
    }
  };

  const handleUnassignTestFromStudent = async (studentId, testId, testTitle, studentName) => {
    if (!confirm(`Are you sure you want to unassign "${testTitle}" from ${studentName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/institutes/students/${studentId}/unassign-test/${testId}${clientParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(data.message || 'Test unassigned successfully');

        const studentData = expandedStudentTests[studentId]?.student;
        if (studentData) {
          toggleStudentTests(studentData);
          setTimeout(() => toggleStudentTests(studentData), 100);
        }

        handleManageStudents(selectedInstituteForStudents);
      } else {
        alert(data.message || 'Failed to unassign test');
      }
    } catch (error) {
      console.error('Error unassigning test:', error);
      alert('Failed to unassign test');
    }
  };

  // Fetch AI Violations
  const fetchViolations = async () => {
    if (!selectedTestForViolations) return;

    try {
      setIsLoadingViolations(true);
      const token = localStorage.getItem('adminToken');

      const [violationsRes, flaggedRes, summaryRes, byStudentRes] = await Promise.all([
        apiFetch(`api/proctoring/violations/test/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch(`api/proctoring/violations/flagged/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch(`api/proctoring/violations/summary/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch(`api/proctoring/violations/by-student/${selectedTestForViolations}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const violationsData = await violationsRes.json();
      const flaggedData = await flaggedRes.json();
      const summaryData = await summaryRes.json();
      const byStudentData = await byStudentRes.json();

      if (!violationsRes.ok) {
        throw new Error(violationsData.message || 'Failed to fetch violations');
      }

      if (!flaggedRes.ok) {
        throw new Error(flaggedData.message || 'Failed to fetch flagged students');
      }

      if (!summaryRes.ok) {
        throw new Error(summaryData.message || 'Failed to fetch violation summary');
      }

      if (!byStudentRes.ok) {
        throw new Error(byStudentData.message || 'Failed to fetch violations by student');
      }

      if (violationsData.success) {
        setViolations(violationsData.violations);
      }
      if (flaggedData.success) {
        setFlaggedStudents(flaggedData.flaggedStudents);
      }
      if (summaryData.success) {
        setViolationSummary(summaryData.summary);
      }
      if (byStudentData.success) {
        setViolationsByStudent(byStudentData.students);
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setIsLoadingViolations(false);
    }
  };

  // Export violations to Excel
  const exportViolationsToExcel = async () => {
    if (!selectedTestForViolations) {
      alert('Please select a test first');
      return;
    }

    if (violationsByStudent.length === 0) {
      alert('No violations to export for this test');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch(`api/proctoring/violations/export/${selectedTestForViolations}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          alert(errorData.message || 'No violations found for this test');
        } else {
          alert(errorData.message || 'Failed to export violations report');
        }
        return;
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `violations_report_${selectedTestForViolations}.xlsx`;

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export violations error:', error);
      alert('Failed to export violations report. Please try again.');
    }
  };

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#F0F2F8] dark:bg-[#0E0E27]"><Loader2 className="animate-spin h-12 w-12 text-[#403f75] dark:text-[#9A9AC9]" /></div>}>
      <div className="admin-dashboard-root min-h-screen bg-[#F0F2F8] dark:bg-[#0E0E27] text-slate-900 dark:text-slate-100">
        {/* Header with integrated Viewing as selector */}
        <AdminHeader
          viewAsControl={
            isSuperAdmin ? (
              <div className="flex items-center gap-2.5 bg-slate-100/90 hover:bg-slate-100 dark:bg-[#1E1E38] dark:hover:bg-[#25254A] border border-slate-200/90 dark:border-slate-700/80 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#403f75] dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Building2 size={15} />
                </div>
                <div className="flex flex-col justify-center min-w-0 pr-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 leading-none select-none pl-0 ml-0">
                    VIEW AS
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="relative inline-flex items-center">
                      <select
                        value={viewAsClientId}
                        onChange={e => {
                          const val = e.target.value;
                          setViewAsClientId(val);
                          sessionStorage.setItem('superAdminSelectedClientId', val);
                          setTests([]);
                          setAllInstitutes([]);
                        }}
                        className="view-as-select appearance-none bg-transparent border-0 p-0 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer max-w-[185px] truncate leading-tight pr-3.5 pl-0 ml-0"
                      >
                        <option value="" className="text-slate-800 bg-white dark:bg-[#1E1E38] dark:text-white font-medium">
                          All Clients (Platform View)
                        </option>
                        {clientsList.map(c => (
                          <option key={c.id} value={c.id} className="text-slate-800 bg-white dark:bg-[#1E1E38] dark:text-white font-medium">
                            {c.company_name || c.name} {c.status !== 'active' ? '(suspended)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="text-slate-400 dark:text-slate-500 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                    </div>
                    {defaultClientId && viewAsClientId !== defaultClientId && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewAsClientId(defaultClientId);
                          sessionStorage.setItem('superAdminSelectedClientId', defaultClientId);
                          setTests([]);
                          setAllInstitutes([]);
                        }}
                        className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer flex items-center justify-center ml-0.5"
                        title="Remove filter (Reset to Global View)"
                        aria-label="Remove filter"
                      >
                        <X size={13} className="stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null
          }
        />

        {/* Client Admin — Usage Stats Bar */}
        {!isSuperAdmin && quota && (
          <div className="bg-white border-b border-shnoor-mist">
            <div className="w-full px-4 sm:px-6 lg:pr-6 lg:pl-[88px] py-2 flex flex-wrap items-center gap-4">
              {[
                { label: 'Tests', used: quota.tests?.used, max: quota.tests?.max },
                { label: 'Institutes', used: quota.institutes?.used, max: quota.institutes?.max },
                { label: 'Students', used: quota.students?.used, max: quota.students?.max },
              ].map(({ label, used, max }) => {
                const isUnlimited = max == null || Number(max) === -1;
                const numericMax = Number(max);
                const numericUsed = Number(used) || 0;
                const pct = isUnlimited || numericMax === 0
                  ? 0
                  : Math.min(100, Math.round((numericUsed / numericMax) * 100));
                const warn = pct >= 90;
                return (
                  <div key={label} className="flex items-center gap-2 min-w-[140px]">
                    <span className="text-xs text-shnoor-soft w-16 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-shnoor-lavender rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${warn ? 'bg-shnoor-danger' : 'bg-shnoor-indigo'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${warn ? 'text-shnoor-danger' : 'text-shnoor-indigoMedium'}`}>
                      {numericUsed}/{isUnlimited ? 'Unlimited' : max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content with dynamic offset for sidebar rail */}
        <div className={`w-full px-4 sm:px-6 ${!showCreateTest && !selectedExamId ? (isExpanded ? 'lg:pl-[280px] lg:pr-6' : 'lg:pl-[88px] lg:pr-6') : 'lg:px-6'} pt-4 sm:pt-6 pb-12 transition-all duration-300 ease-in-out`}>
          <div className="admin-dashboard-content">

            {/* Subscription Expiry Banner */}
            {!isSuperAdmin && daysRemaining !== null && daysRemaining <= 7 && (
              <div className={`mb-4 p-4 rounded-xl shadow-sm border flex items-center justify-between animate-fade-in ${daysRemaining <= 1
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}>
                <div className="flex items-center">
                  <AlertCircle size={20} className={`mr-3 ${daysRemaining <= 1 ? 'text-red-500' : 'text-yellow-600'}`} />
                  <div>
                    <h4 className="font-bold">Subscription Alert</h4>
                    <p className="text-sm mt-0.5">
                      {daysRemaining <= 0
                        ? 'Your subscription has expired. Please renew to avoid losing access.'
                        : `Your subscription will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Renew now to avoid interruption.`
                      }
                    </p>

                  </div>
                </div>
                <button
                  onClick={() => navigate('/client/subscription-plans')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${daysRemaining <= 1
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    }`}
                >
                  Renew Now
                </button>
              </div>
            )}

            {/* Sidebar navigation */}
            {!showCreateTest && !selectedExamId && (
              <>
                {/* Desktop sidebar */}
                <aside
                  aria-label="Module Navigation"
                  onMouseEnter={() => setIsSidebarHovered(true)}
                  onMouseLeave={() => setIsSidebarHovered(false)}
                  className={`hidden lg:flex fixed left-0 top-[60px] sm:top-[68px] bottom-0 ${isExpanded ? 'w-64' : 'w-[72px]'
                    } bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-xl border-r border-slate-200/90 dark:border-slate-800 z-40 transition-all duration-300 ease-in-out flex-col py-4 shadow-sm overflow-hidden select-none`}
                >
                  {/* Top Control Bar with Collapse Toggle Button */}
                  <div className="px-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={toggleSidebarExpanded}
                      className={`w-full flex items-center ${isExpanded ? 'justify-between px-3' : 'justify-center px-0'} h-10 rounded-xl border border-slate-200/90 dark:border-[#383860] bg-slate-100 dark:bg-[#25254A] hover:bg-slate-200 dark:hover:bg-[#303060] text-slate-700 dark:text-white shadow-2xs transition-all duration-200 cursor-pointer group`}
                      title={isSidebarExpanded ? 'Collapse Sidebar' : 'Pin / Expand Sidebar'}
                      aria-label={isSidebarExpanded ? 'Collapse Sidebar' : 'Pin / Expand Sidebar'}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {isSidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <span
                          className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-xs font-bold tracking-tight text-slate-700 dark:text-white text-left ${isExpanded ? 'opacity-100 max-w-[130px]' : 'opacity-0 max-w-0 hidden'
                            }`}
                        >
                          {isSidebarExpanded ? 'Collapse Menu' : 'Pin Sidebar'}
                        </span>
                      </div>
                      {isExpanded && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-200/80 dark:bg-[#181832] px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase tracking-wider">
                          {isSidebarExpanded ? 'Hide' : 'Pin'}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full px-2.5 overflow-y-auto flex-1 scrollbar-none">
                    {sidebarNavItems.map((tab) => {
                      const isActive = !showCreateTest && !selectedExamId && activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            if (selectedExamId) setSelectedExamId(null);
                            if (showCreateTest) setShowCreateTest(false);
                            if (tab.path) {
                              navigate(tab.path);
                            } else {
                              setActiveTab(tab.id);
                            }
                          }}
                          className={`flex items-center h-11 px-3 w-full rounded-xl nav-gesture-item cursor-pointer relative group/item ${isActive
                            ? 'bg-gradient-to-r from-[#403f75] to-[#57569b] text-white font-bold shadow-md shadow-[#403f75]/25 translate-x-1'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                            }`}
                          title={!isExpanded ? tab.label : undefined}
                        >
                          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 relative">
                            <Icon
                              size={19}
                              className={`transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-slate-500 dark:text-slate-400 group-hover/item:text-slate-800 dark:group-hover/item:text-white group-hover/item:scale-110 group-hover/item:-rotate-3'
                                }`}
                            />
                            {tab.badge > 0 && !isExpanded && (
                              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#1A1A32] animate-pulse-subtle" />
                            )}
                          </div>
                          <span
                            className={`ml-3 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden text-sm font-bold tracking-tight text-left flex items-center justify-between flex-1 ${isExpanded ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
                              }`}
                          >
                            <span className="truncate">{tab.label}</span>
                            {tab.badge > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full flex-shrink-0 animate-pulse-subtle">
                                {tab.badge > 99 ? '99+' : tab.badge}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* Mobile tabs */}
                <div className="lg:hidden mb-6 w-full">
                  <div className="bg-white/95 dark:bg-[#1A1A32]/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs inline-flex flex-nowrap items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {sidebarNavItems.map((tab) => {
                      const isActive = !showCreateTest && !selectedExamId && activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            if (selectedExamId) setSelectedExamId(null);
                            if (showCreateTest) setShowCreateTest(false);
                            if (tab.path) {
                              navigate(tab.path);
                            } else {
                              setActiveTab(tab.id);
                            }
                          }}
                          className={`group inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-xl nav-gesture-item whitespace-nowrap flex-shrink-0 cursor-pointer ${isActive
                            ? 'bg-gradient-to-r from-[#403f75] to-[#57569b] text-white font-bold shadow-md shadow-[#403f75]/20 scale-[1.02]'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70'
                            }`}
                        >
                          <Icon
                            size={15}
                            className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 ${isActive
                              ? 'text-white'
                              : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'
                              }`}
                          />
                          <span>{tab.label}</span>
                          {tab.badge > 0 && (
                            <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse-subtle">
                              {tab.badge > 99 ? '99+' : tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Create test section */}
            {showCreateTest ? (
              <div className="space-y-4 mb-6 bg-[#F4F4F9] rounded-2xl">
                <CreateTestSection
                  onComplete={() => {
                    handleCreateTestComplete();
                    navigate(`${basePath}/exams`);
                  }}
                  onSaved={fetchTests}
                  editingTest={editingTest}
                  clientId={viewAsClientId || null}
                  onBack={() => {
                    setShowCreateTest(false);
                    setEditingTest(null);
                    navigate(`${basePath}/exams`);
                  }}
                />
              </div>
            ) : selectedExamId ? (
              /* Detail View: Student Results for a specific exam */
              <ResultsTab
                selectedExamDetails={selectedExamDetails}
                selectedExamStudents={selectedExamStudents}
                onBack={() => {
                  setSelectedExamId(null);
                  setSelectedCandidates([]);
                  setResultsCurrentPage(1);
                  setDetailViewTab('results');
                  navigate(`${basePath}/exams`);
                }}
                showQuickSelectMenu={showQuickSelectMenu}
                setShowQuickSelectMenu={setShowQuickSelectMenu}
                statusFilter={statusFilter}
                setStatusFilter={(filter) => {
                  setStatusFilter(filter);
                  setResultsCurrentPage(1);
                }}
                selectedCandidates={selectedCandidates}
                setSelectedCandidates={setSelectedCandidates}
                exportToExcel={exportToExcel}
                handleDownloadShortlistedPDF={handleDownloadShortlistedPDF}
                detailViewTab={detailViewTab}
                setDetailViewTab={setDetailViewTab}
                getPassingPercentage={getPassingPercentage}
                resultsCurrentPage={resultsCurrentPage}
                setResultsCurrentPage={setResultsCurrentPage}
                resultsRowsPerPage={resultsRowsPerPage}
                setResultsRowsPerPage={setResultsRowsPerPage}
                onScheduleInterview={(student) => {
                  setSelectedStudentForInterview(student);
                  setShowInterviewScheduleModal(true);
                }}
                loadingFeedback={loadingFeedback}
                feedbackData={feedbackData}
                feedbackStats={feedbackStats}
              />
            ) : (
              /* List View: All Exams & Other Tabs */
              <>
                {activeTab === 'exams' && (
                  <ExamsTab
                    loading={loading}
                    tests={tests}
                    filteredTests={filteredTests}
                    paginatedTests={paginatedTests}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filters={filters}
                    setFilters={setFilters}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    selectedTests={selectedTests}
                    toggleAllTests={toggleAllTests}
                    handleBulkDeleteTests={handleBulkDeleteTests}
                    toggleTestSelection={toggleTestSelection}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    handlePreviewQuestions={handlePreviewQuestions}
                    handleViewTestHistory={handleViewTestHistory}
                    handleViewJob={handleViewJob}
                    handleOpenCloneModal={handleOpenCloneModal}
                    handleViewTestDetails={handleViewTestDetails}
                    setShowCreateTest={(val) => {
                      if (val) {
                        navigate(`${basePath}/tests/create`);
                      } else {
                        setShowCreateTest(false);
                        navigate(`${basePath}/exams`);
                      }
                    }}
                    handleTogglePublish={handleTogglePublish}
                    handleDeleteTest={handleDeleteTest}
                    setSelectedExamId={handleSelectExam}
                    setEditingTest={setEditingTest}
                    examCurrentPage={examCurrentPage}
                    setExamCurrentPage={setExamCurrentPage}
                    examTotalPages={examTotalPages}
                    examItemsPerPage={examItemsPerPage}
                    setExamItemsPerPage={setExamItemsPerPage}
                  />
                )}

                {/* Institutes Tab */}
                {activeTab === 'institutes' && (
                  <InstitutesTab
                    instituteSearchTerm={instituteSearchTerm}
                    setInstituteSearchTerm={setInstituteSearchTerm}
                    newInstituteName={newInstituteName}
                    setNewInstituteName={setNewInstituteName}
                    handleAddInstitute={handleAddInstitute}
                    isAddingInstitute={isAddingInstitute}
                    selectedInstitutes={selectedInstitutes}
                    setSelectedInstitutes={setSelectedInstitutes}
                    allInstitutes={allInstitutes}
                    selectedTestsForMultipleInstitutes={selectedTestsForMultipleInstitutes}
                    setSelectedTestsForMultipleInstitutes={setSelectedTestsForMultipleInstitutes}
                    isTestDropdownOpen={isTestDropdownOpen}
                    setIsTestDropdownOpen={setIsTestDropdownOpen}
                    tests={tests}
                    handleAssignTestToMultipleInstitutes={handleAssignTestToMultipleInstitutes}
                    isAssigningTestToMultipleInstitutes={isAssigningTestToMultipleInstitutes}
                    toggleAllInstitutes={toggleAllInstitutes}
                    isLoadingAllInstitutes={isLoadingAllInstitutes}
                    paginatedInstitutes={paginatedInstitutes}
                    toggleInstituteSelection={toggleInstituteSelection}
                    handleViewAssignedTests={handleViewAssignedTests}
                    handleManageStudents={handleManageStudents}
                    setSelectedInstituteForRegistration={setSelectedInstituteForRegistration}
                    setShowRegistrationControlModal={setShowRegistrationControlModal}
                    handleDeleteInstitute={handleDeleteInstitute}
                    instituteTotalPages={instituteTotalPages}
                    instituteTotalItems={filteredInstitutes.length}
                    instituteCurrentPage={instituteCurrentPage}
                    setInstituteCurrentPage={setInstituteCurrentPage}
                    instituteItemsPerPage={instituteItemsPerPage}
                    setInstituteItemsPerPage={setInstituteItemsPerPage}
                  />
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                  <div className="space-y-6">
                    <AdminReports />
                  </div>
                )}

                {/* Bulk Student Upload Tab */}
                {activeTab === 'bulk-upload' && (
                  <div className="space-y-6">
                    <BulkStudentUpload clientId={viewAsClientId || null} />
                  </div>
                )}

                {/* Violations Tab */}
                {activeTab === 'violations' && (
                  <ViolationsTab
                    tests={tests}
                    selectedTestForViolations={selectedTestForViolations}
                    setSelectedTestForViolations={setSelectedTestForViolations}
                    violationsByStudent={violationsByStudent}
                    flaggedStudents={flaggedStudents}
                    isLoadingViolations={isLoadingViolations}
                    exportViolationsToExcel={exportViolationsToExcel}
                  />
                )}

                {/* Interviews Tab */}
                {activeTab === 'interviews' && (
                  <div className="space-y-6">
                    <InterviewsList />
                  </div>
                )}

                {/* Job Openings Tab */}
                {activeTab === 'job-openings' && (
                  <div className="animate-fade-in">
                    <AdminJobOpenings clientId={viewAsClientId || null} />
                  </div>
                )}

                {/* Subscription Plans Tab */}
                {activeTab === 'subscription-plans' && isSuperAdmin && (
                  <div className="space-y-6">
                    <SubscriptionPlansSettings />
                  </div>
                )}

                {/* My Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="animate-fade-in">
                    <AdminProfile />
                  </div>
                )}

                {/* Messages Tab */}
                {activeTab === 'messages' && (
                  <div className="animate-fade-in">
                    <StudentMessages isEmbedded={true} />
                  </div>
                )}

                {/* Clients Management Tab */}
                {activeTab === 'clients' && !isClientAdmin && (
                  <div className="animate-fade-in">
                    <AdminClients isEmbedded={true} />
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="animate-fade-in">
                    <AdminSettings isEmbedded={true} />
                  </div>
                )}
              </>
            )}

            {/* Clone Test Modal */}
            {showCloneModal && testToClone && (
              <CloneModal
                testToClone={testToClone}
                cloneTestName={cloneTestName}
                setCloneTestName={setCloneTestName}
                isCloning={isCloning}
                cloneError={cloneError}
                handleCloneTestSubmit={handleCloneTest}
                onClose={() => {
                  setShowCloneModal(false);
                  setTestToClone(null);
                  setCloneTestName('');
                  setCloneError('');
                }}
              />
            )}

            {/* View Test Details Modal */}
            {showViewDetailsModal && selectedTestForDetails && (
              <ViewTestDetailsModal
                test={selectedTestForDetails}
                onClose={() => {
                  setShowViewDetailsModal(false);
                  setSelectedTestForDetails(null);
                }}
                onEdit={handleEditTestDetails}
              />
            )}

            {/* Edit Test Details Modal */}
            {showEditDetailsModal && selectedTestForDetails && (
              <EditTestDetailsModal
                test={selectedTestForDetails}
                onClose={() => {
                  setShowEditDetailsModal(false);
                  setSelectedTestForDetails(null);
                }}
                onSave={handleSaveTestDetails}
              />
            )}

            {/* Job Role/Description Modal */}
            {showJobModal && (
              <JobModal
                selectedJobTest={selectedJobTest}
                jobRoles={jobRoles}
                selectedJobRoleIndex={selectedJobRoleIndex}
                setSelectedJobRoleIndex={setSelectedJobRoleIndex}
                isEditingJob={isEditingJob}
                setIsEditingJob={setIsEditingJob}
                isSavingJob={isSavingJob}
                isLoadingJobRoles={isLoadingJobRoles}
                handleJobRoleChange={handleJobRoleChange}
                handleAddJobRole={handleAddJobRole}
                handleRemoveJobRole={handleRemoveJobRole}
                handleSaveJobRoles={handleSaveJob}
                onClose={() => setShowJobModal(false)}
              />
            )}

            {/* Assigned Tests Modal */}
            {showAssignedTestsModal && selectedInstituteForTests && (
              <AssignedTestsModal
                selectedInstituteForTests={selectedInstituteForTests}
                isLoadingAssignedTests={isLoadingAssignedTests}
                assignedTests={assignedTests}
                tests={tests}
                selectedTestsForInstitute={selectedTestsForInstitute}
                setSelectedTestsForInstitute={setSelectedTestsForInstitute}
                isInstituteTestDropdownOpen={isInstituteTestDropdownOpen}
                setIsInstituteTestDropdownOpen={setIsInstituteTestDropdownOpen}
                isAssigningTestToInstitute={isAssigningTestToInstitute}
                handleAssignTestToInstitute={handleAssignTestToInstitute}
                selectedTestsForUnassign={selectedTestsForUnassign}
                toggleTestForUnassign={toggleTestForUnassign}
                toggleAllTestsForUnassign={toggleAllTestsForUnassign}
                handleBulkUnassignTests={handleBulkUnassignTests}
                handleUnassignTest={handleUnassignTest}
                isUnassigningTests={isUnassigningTests}
                onClose={() => {
                  setShowAssignedTestsModal(false);
                  setSelectedInstituteForTests(null);
                  setAssignedTests([]);
                  setSelectedTestsForInstitute([]);
                  setSelectedTestsForUnassign([]);
                  setIsInstituteTestDropdownOpen(false);
                }}
              />
            )}

            {/* Student Management Modal */}
            {showStudentManagementModal && selectedInstituteForStudents && (
              <StudentManageModal
                selectedInstituteForStudents={selectedInstituteForStudents}
                isLoadingStudentsForManagement={isLoadingStudentsForManagement}
                instituteStudentsForManagement={instituteStudentsForManagement}
                studentSearchTerm={studentSearchTerm}
                setStudentSearchTerm={setStudentSearchTerm}
                showAddStudentForm={showAddStudentForm}
                setShowAddStudentForm={setShowAddStudentForm}
                newStudentData={newStudentData}
                setNewStudentData={setNewStudentData}
                isAddingStudent={isAddingStudent}
                handleAddStudent={handleAddStudent}
                selectedStudentsForDelete={selectedStudentsForDelete}
                toggleStudentForDelete={toggleStudentForDelete}
                toggleAllStudentsForDelete={toggleAllStudentsForDelete}
                selectionRange={selectionRange}
                setSelectionRange={setSelectionRange}
                handleSelectRange={handleSelectRange}
                handleBulkDeleteStudents={handleBulkDeleteStudents}
                handleDeleteAllStudents={handleDeleteAllStudents}
                tests={tests}
                selectedTestsForStudentModal={selectedTestsForStudentModal}
                setSelectedTestsForStudentModal={setSelectedTestsForStudentModal}
                isStudentTestDropdownOpen={isStudentTestDropdownOpen}
                setIsStudentTestDropdownOpen={setIsStudentTestDropdownOpen}
                isAssigningTestInModal={isAssigningTestInModal}
                handleAssignTestInModal={handleAssignTestInModal}
                expandedStudentTests={expandedStudentTests}
                toggleStudentTests={toggleStudentTests}
                handleUnassignTestFromStudent={handleUnassignTestFromStudent}
                handleDeleteStudent={handleDeleteStudent}
                onClose={() => {
                  setShowStudentManagementModal(false);
                  setSelectedInstituteForStudents(null);
                  setInstituteStudentsForManagement([]);
                  setShowAddStudentForm(false);
                  setSelectedStudentsForDelete([]);
                  setSelectedTestsForStudentModal([]);
                  setIsStudentTestDropdownOpen(false);
                  setStudentSearchTerm('');
                  setSelectionRange({ start: '', end: '' });
                  setNewStudentData({
                    full_name: '',
                    email: '',
                    roll_number: '',
                    institute: 'Others'
                  });
                }}
              />
            )}

            {/* Registration Control Modal */}
            {showRegistrationControlModal && selectedInstituteForRegistration && (
              <InstituteRegistrationControl
                institute={selectedInstituteForRegistration}
                onClose={() => {
                  setShowRegistrationControlModal(false);
                  setSelectedInstituteForRegistration(null);
                }}
              />
            )}

            {/* Preview Questions Modal */}
            {showPreviewQuestionsModal && previewTest && (
              <PreviewModal
                previewTest={previewTest}
                isLoadingPreview={isLoadingPreview}
                previewQuestions={previewQuestions}
                onClose={() => {
                  setShowPreviewQuestionsModal(false);
                  setPreviewTest(null);
                  setPreviewQuestions([]);
                }}
              />
            )}

            {/* Test History Modal */}
            {showTestHistoryModal && testHistory && (
              <TestHistoryModal
                isLoadingHistory={isLoadingHistory}
                testHistory={testHistory}
                onClose={() => setShowTestHistoryModal(false)}
              />
            )}

            {/* Interview Schedule Modal */}
            {showInterviewScheduleModal && selectedStudentForInterview && (
              <InterviewSchedule
                student={selectedStudentForInterview}
                testId={selectedExamId}
                onClose={() => {
                  setShowInterviewScheduleModal(false);
                  setSelectedStudentForInterview(null);
                }}
                onScheduled={() => {
                  setShowInterviewScheduleModal(false);
                  setSelectedStudentForInterview(null);
                }}
              />
            )}



          </div >
        </div >
      </div >
    </Suspense >
  );
};

export default AdminDashboard;

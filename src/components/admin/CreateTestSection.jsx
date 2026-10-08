import { useState, useEffect } from 'react';
import { Upload, FileText, Plus, Save, Trash2, ArrowLeft, CheckCircle, AlertCircle, Loader2, Pencil, Eye, AlignLeft, List, Code } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { apiFetch } from '../../config/api';
import CodingQuestionSelector from './CodingQuestionSelector';
import TestInitStep from './TestInitStep';
import TestManualStep from './TestManualStep';
import TestBulkStep from './TestBulkStep';
import TestSuccessStep from './TestSuccessStep';
import CodingQuestionModal from './CodingQuestionModal';
import CodingViewModal from './CodingViewModal';
import MCQBankSelector from './MCQBankSelector';
import BulkUploadModal from './BulkUploadModal';
import ModalShell, { ModalButton, FieldLabel, modalInputClass, modalTextareaClass } from './ModalShell';

const ENABLE_CODE_EXECUTION = true;

const SectionHeader = ({ title, description, action }) => (
    <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
            <h3 className="text-base font-semibold text-shnoor-navy">{title}</h3>
            <p className="text-[13px] text-shnoor-indigoMedium mt-0.5">{description}</p>
        </div>
        {action}
    </div>
);

const AddQuestionCard = ({ icon, title, description, onClick, disabled }) => {
    const Icon = icon;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="group text-left p-5 bg-white border border-[#E3E2EE] rounded-xl transition-all hover:border-shnoor-indigo hover:shadow-[0_4px_16px_rgba(68,68,142,0.08)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#E3E2EE] disabled:hover:shadow-none"
        >
            <div className="w-11 h-11 rounded-[10px] bg-shnoor-lavender flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-shnoor-indigo" />
            </div>
            <h4 className="text-[15px] font-semibold text-shnoor-navy">{title}</h4>
            <p className="text-[13px] text-shnoor-indigoMedium mt-1 leading-snug">{description}</p>
        </button>
    );
};

const TypeBadge = ({ children }) => (
    <span className="px-2 py-0.5 rounded-md bg-shnoor-lavender text-shnoor-indigo text-[11px] font-semibold whitespace-nowrap">{children}</span>
);

const CreateTestSection = ({ onComplete, onSaved, editingTest, clientId, onBack }) => {
    const FALLBACK_DEFAULT_JOB_ROLE = 'General Assessment Candidate';
    const FALLBACK_DEFAULT_JOB_DESCRIPTION = 'This assessment evaluates candidate readiness across core technical and problem-solving skills relevant to the role.';
    const [step, setStep] = useState('init'); // init, manual, bulk, success

    const showToast = (msg, type = 'error') => {
        if (type === 'success') {
            toast.success(msg);
        } else if (type === 'info') {
            toast.info(msg);
        } else {
            toast.error(msg);
        }
    };

    const [testTitle, setTestTitle] = useState('');
    const [jobRoles, setJobRoles] = useState([{ job_role: '', job_description: '' }]);
    const [defaultJobConfig, setDefaultJobConfig] = useState({
        job_role: FALLBACK_DEFAULT_JOB_ROLE,
        job_description: FALLBACK_DEFAULT_JOB_DESCRIPTION
    });
    const [duration, setDuration] = useState(60);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [passingPercentage, setPassingPercentage] = useState(50);
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [questions, setQuestions] = useState([]);
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedTestId, setUploadedTestId] = useState(null);
    const [uploadedTestName, setUploadedTestName] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [, setIsLoadingTest] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);

    // Name availability checker state
    const [nameAvailability, setNameAvailability] = useState({
        checking: false,
        available: null,
        message: ''
    });

    // Manual Question Logic
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        options: ['', '', '', ''],
        correctOption: null, // 0, 1, 2, 3
        format: 'paragraph' // 'paragraph', 'line', 'code'
    });

    // Coding Question Logic
    const [showCodingModal, setShowCodingModal] = useState(false);
    const [showCodingViewModal, setShowCodingViewModal] = useState(false);
    const [showCodingSelector, setShowCodingSelector] = useState(false);
    const [questionInputMode, setQuestionInputMode] = useState('type'); // 'type' | 'bank'
    const [bankSelectorKey, setBankSelectorKey] = useState(0);
    const [viewingCodingQuestion, setViewingCodingQuestion] = useState(null);
    const [editingCodingQuestionId, setEditingCodingQuestionId] = useState(null);
    const [currentCodingQuestion, setCurrentCodingQuestion] = useState({
        title: '',
        description: '',
        publicTestCases: [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: [{ input: '', output: '' }],
        timeLimit: 2,
        memoryLimit: 256,
        marks: 10
    });

    // Load test data when editing
    useEffect(() => {
        const fetchDefaultJobConfig = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch('api/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (response.ok && data.success && data.settings) {
                    const configuredRole = (data.settings.default_test_job_role || '').trim();
                    const configuredDescription = (data.settings.default_test_job_description || '').trim();

                    const nextDefaults = {
                        job_role: configuredRole || FALLBACK_DEFAULT_JOB_ROLE,
                        job_description: configuredDescription || FALLBACK_DEFAULT_JOB_DESCRIPTION
                    };

                    setDefaultJobConfig(nextDefaults);

                    if (!editingTest) {
                        setJobRoles((prev) => {
                            if (!Array.isArray(prev) || prev.length !== 1) return prev;
                            const first = prev[0] || { job_role: '', job_description: '' };
                            const isEmpty = !first.job_role?.trim() && !first.job_description?.trim();
                            if (!isEmpty) return prev;
                            return [{
                                job_role: nextDefaults.job_role,
                                job_description: nextDefaults.job_description
                            }];
                        });
                    }
                }
            } catch {
                // Keep fallback defaults silently.
            }
        };

        fetchDefaultJobConfig();

        const loadTestData = async () => {
            if (!editingTest) {
                setIsEditMode(false);
                setViewMode(false);
                return;
            }

            setIsEditMode(true);
            setViewMode(true);
            setIsLoadingTest(true);

            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch(`api/tests/${editingTest.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const test = data.test;
                    setTestTitle(test.title);
                    setDuration(test.duration || 60);
                    setMaxAttempts(test.max_attempts || 1);
                    setPassingPercentage(test.passing_percentage || 50);

                    if (test.start_datetime) {
                        const date = new Date(test.start_datetime);
                        const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        const year = istDate.getFullYear();
                        const month = String(istDate.getMonth() + 1).padStart(2, '0');
                        const day = String(istDate.getDate()).padStart(2, '0');
                        const hours = String(istDate.getHours()).padStart(2, '0');
                        const minutes = String(istDate.getMinutes()).padStart(2, '0');
                        setStartDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    } else {
                        setStartDateTime('');
                    }

                    if (test.end_datetime) {
                        const date = new Date(test.end_datetime);
                        const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        const year = istDate.getFullYear();
                        const month = String(istDate.getMonth() + 1).padStart(2, '0');
                        const day = String(istDate.getDate()).padStart(2, '0');
                        const hours = String(istDate.getHours()).padStart(2, '0');
                        const minutes = String(istDate.getMinutes()).padStart(2, '0');
                        setEndDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                    } else {
                        setEndDateTime('');
                    }

                    if (test.jobRoles && test.jobRoles.length > 0) {
                        setJobRoles(test.jobRoles.map(r => ({
                            job_role: r.job_role,
                            job_description: r.job_description
                        })));
                    } else if (test.job_role) {
                        setJobRoles([{
                            job_role: test.job_role,
                            job_description: test.description || ''
                        }]);
                    }

                    if (test.questions && test.questions.length > 0) {
                        const loadedQuestions = test.questions.map((q, idx) => {
                            let correctOpt = 0;
                            if (typeof q.correct_option === 'number') {
                                correctOpt = q.correct_option;
                            } else if (typeof q.correct_option === 'string' && q.correct_option.trim()) {
                                const trimmed = q.correct_option.trim().toUpperCase();
                                if (['A', 'B', 'C', 'D'].includes(trimmed)) {
                                    correctOpt = trimmed.charCodeAt(0) - 65;
                                } else if (!isNaN(parseInt(trimmed, 10))) {
                                    correctOpt = parseInt(trimmed, 10);
                                }
                            }
                            return {
                                id: q.id || Date.now() + idx,
                                text: q.question_text || '',
                                options: [q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || ''],
                                correctOption: correctOpt
                            };
                        });
                        setQuestions(loadedQuestions);
                    }

                    if (test.codingQuestions && test.codingQuestions.length > 0) {
                        const loadedCodingQuestions = test.codingQuestions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            title: q.title || '',
                            description: q.description || '',
                            timeLimit: parseFloat(q.timeLimit || q.time_limit) || 2,
                            memoryLimit: parseInt(q.memoryLimit || q.memory_limit, 10) || 256,
                            marks: parseInt(q.marks, 10) || 10,
                            publicTestCases: (q.publicTestCases && q.publicTestCases.length > 0)
                                ? q.publicTestCases
                                : [{ input: '', output: '', explanation: '' }],
                            hiddenTestCases: (q.hiddenTestCases && q.hiddenTestCases.length > 0)
                                ? q.hiddenTestCases
                                : [{ input: '', output: '' }]
                        }));
                        setCodingQuestions(loadedCodingQuestions);
                    }

                    setUploadedTestId(test.id);
                    setNameAvailability({ checking: false, available: true, message: 'Current test name' });
                    setStep('init');
                } else {
                    showToast(data.message || 'Failed to load test data');
                    if (onComplete) onComplete();
                }
            } catch (error) {
                console.error('Error loading test:', error);
                showToast('Failed to load test data');
                if (onComplete) onComplete();
            } finally {
                setIsLoadingTest(false);
            }
        };

        loadTestData();
    }, [editingTest]);

    // Check name availability when title changes
    useEffect(() => {
        const checkNameAvailability = async () => {
            if (!testTitle.trim()) {
                setNameAvailability({ checking: false, available: null, message: '' });
                return;
            }

            if (isEditMode && editingTest && testTitle === editingTest.name) {
                setNameAvailability({ checking: false, available: true, message: 'Current test name' });
                return;
            }

            setNameAvailability({ checking: true, available: null, message: '' });

            try {
                const token = localStorage.getItem('adminToken');
                const response = await apiFetch(`api/tests/check-name/${encodeURIComponent(testTitle)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setNameAvailability({
                        checking: false,
                        available: data.available,
                        message: data.message
                    });
                }
            } catch (error) {
                console.error('Error checking name availability:', error);
                setNameAvailability({ checking: false, available: null, message: '' });
            }
        };

        const timeoutId = setTimeout(checkNameAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [testTitle, isEditMode, editingTest]);

    const handleStart = (mode) => {
        if (!testTitle.trim()) {
            showToast('Please enter a test title first');
            return;
        }
        if (nameAvailability.available === false) {
            showToast('This test name is already taken. Please choose a different name.');
            return;
        }
        setStep(mode);
    };

    const handleAddJobRole = () => {
        setJobRoles([...jobRoles, { job_role: '', job_description: '' }]);
    };

    const handleRemoveJobRole = (index) => {
        const newJobRoles = jobRoles.filter((_, i) => i !== index);
        setJobRoles(newJobRoles);
    };

    const handleJobRoleChange = (index, field, value) => {
        const newJobRoles = [...jobRoles];
        newJobRoles[index][field] = value;
        setJobRoles(newJobRoles);
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.text || currentQuestion.options.some(opt => !opt) || currentQuestion.correctOption === null) {
            showToast('Please fill in all fields and select a correct answer');
            return;
        }
        const isDuplicate = questions.some(
            q => q.text && q.text.trim().toLowerCase() === currentQuestion.text.trim().toLowerCase()
        );
        if (isDuplicate) {
            showToast('A question with this text is already added to the test.');
            return;
        }
        setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
        setCurrentQuestion({
            text: '',
            options: ['', '', '', ''],
            correctOption: null,
            format: 'paragraph'
        });
    };

    const handleRemoveQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSelectMcqFromBank = (selectedBankQuestions) => {
        const converted = selectedBankQuestions
            .filter((q) => {
                const isDuplicate = questions.some(
                    (existing) =>
                        (existing.bankId && existing.bankId === q.id) ||
                        (existing.text && q.question_text && existing.text.trim().toLowerCase() === q.question_text.trim().toLowerCase())
                );
                return !isDuplicate;
            })
            .map((q) => {
                const correctLetter = (q.correct_option || 'A').toUpperCase();
                const correctIdx = Math.max(0, 'ABCD'.indexOf(correctLetter));
                return {
                    id: Date.now() + Math.random(),
                    bankId: q.id,
                    fromBank: true,
                    text: q.question_text,
                    options: [q.option_a, q.option_b, q.option_c || '', q.option_d || ''],
                    correctOption: correctIdx,
                    marks: q.marks || 1,
                    format: 'paragraph'
                };
            });

        if (converted.length === 0) {
            showToast('Selected questions are already added to this test.');
            return;
        }

        setQuestions((prevQuestions) => [...prevQuestions, ...converted]);
        setBankSelectorKey((k) => k + 1);

        if (converted.length < selectedBankQuestions.length) {
            showToast(`Added ${converted.length} question(s) to the list. ${selectedBankQuestions.length - converted.length} duplicate(s) skipped.`, 'info');
        }
    };

    // Coding Question Handlers
    const handleAddPublicTestCase = () => {
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            publicTestCases: [...currentCodingQuestion.publicTestCases, { input: '', output: '', explanation: '' }]
        });
    };

    const handleRemovePublicTestCase = (index) => {
        const newTestCases = currentCodingQuestion.publicTestCases.filter((_, i) => i !== index);
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            publicTestCases: newTestCases.length > 0 ? newTestCases : [{ input: '', output: '', explanation: '' }]
        });
    };

    const handleAddHiddenTestCase = () => {
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            hiddenTestCases: [...currentCodingQuestion.hiddenTestCases, { input: '', output: '' }]
        });
    };

    const handleRemoveHiddenTestCase = (index) => {
        const newTestCases = currentCodingQuestion.hiddenTestCases.filter((_, i) => i !== index);
        setCurrentCodingQuestion({
            ...currentCodingQuestion,
            hiddenTestCases: newTestCases.length > 0 ? newTestCases : [{ input: '', output: '' }]
        });
    };

    const handleSaveCodingQuestion = () => {
        if (!currentCodingQuestion.title || !currentCodingQuestion.description) {
            showToast('Please fill in title and description');
            return;
        }
        if (currentCodingQuestion.publicTestCases.some(tc => !tc.input || !tc.output)) {
            showToast('Please fill in all public test cases');
            return;
        }
        if (currentCodingQuestion.hiddenTestCases.some(tc => !tc.input || !tc.output)) {
            showToast('Please fill in all hidden test cases');
            return;
        }

        // Duplicate check for coding questions
        const isDuplicate = codingQuestions.some(
            q => (!editingCodingQuestionId || q.id !== editingCodingQuestionId) &&
                 q.title && q.title.trim().toLowerCase() === currentCodingQuestion.title.trim().toLowerCase()
        );
        if (isDuplicate) {
            showToast('A coding question with this title is already added to this test.');
            return;
        }

        if (editingCodingQuestionId) {
            setCodingQuestions(codingQuestions.map(q =>
                q.id === editingCodingQuestionId ? { ...currentCodingQuestion, id: editingCodingQuestionId } : q
            ));
            setEditingCodingQuestionId(null);
        } else {
            setCodingQuestions([...codingQuestions, { ...currentCodingQuestion, id: Date.now() }]);
        }

        setCurrentCodingQuestion({
            title: '',
            description: '',
            publicTestCases: [{ input: '', output: '', explanation: '' }],
            hiddenTestCases: [{ input: '', output: '' }],
            timeLimit: 2,
            memoryLimit: 256,
            marks: 10
        });
        setShowCodingModal(false);
    };

    const handleRemoveCodingQuestion = (id) => {
        setCodingQuestions(codingQuestions.filter(q => q.id !== id));
    };

    const handleViewCodingQuestion = (question) => {
        setViewingCodingQuestion(question);
        setShowCodingViewModal(true);
    };

    const handleEditCodingQuestion = (question) => {
        setCurrentCodingQuestion({
            title: question.title,
            description: question.description,
            publicTestCases: [...question.publicTestCases],
            hiddenTestCases: [...question.hiddenTestCases],
            timeLimit: question.timeLimit,
            memoryLimit: question.memoryLimit,
            marks: question.marks || 10
        });
        setEditingCodingQuestionId(question.id);
        setShowCodingModal(true);
    };

    const handleSelectFromBank = (selectedQuestions) => {
        const newSelections = selectedQuestions.filter((q) => {
            const isDuplicate = codingQuestions.some(
                (existing) =>
                    (existing.bankId && existing.bankId === q.id) ||
                    (existing.title && q.title && existing.title.trim().toLowerCase() === q.title.trim().toLowerCase())
            );
            return !isDuplicate;
        });

        if (newSelections.length === 0) {
            showToast('Selected questions are already added to this test.');
            return;
        }

        if (newSelections.length < selectedQuestions.length) {
            showToast(`${selectedQuestions.length - newSelections.length} duplicate question(s) were skipped.`, 'info');
        }

        const fetchQuestionDetails = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const detailedQuestions = await Promise.all(
                    newSelections.map(async (q) => {
                        const response = await apiFetch(`api/question-bank/coding/${q.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await response.json();
                        if (data.success && data.question.testCases) {
                            const publicTestCases = data.question.testCases
                                .filter(tc => !tc.is_hidden)
                                .map(tc => ({
                                    input: tc.input,
                                    output: tc.output,
                                    explanation: tc.explanation || ''
                                }));

                            const hiddenTestCases = data.question.testCases
                                .filter(tc => tc.is_hidden)
                                .map(tc => ({
                                    input: tc.input,
                                    output: tc.output
                                }));

                            return {
                                id: Date.now() + Math.random(),
                                bankId: q.id,
                                title: q.title,
                                description: q.description,
                                timeLimit: q.time_limit,
                                memoryLimit: q.memory_limit,
                                marks: q.marks,
                                publicTestCases: publicTestCases.length > 0 ? publicTestCases : [{ input: '', output: '', explanation: '' }],
                                hiddenTestCases: hiddenTestCases.length > 0 ? hiddenTestCases : [{ input: '', output: '' }],
                                fromBank: true
                            };
                        }
                        return null;
                    })
                );

                const validQuestions = detailedQuestions.filter(q => q !== null);
                setCodingQuestions((prev) => {
                    const uniqueNew = validQuestions.filter(vq => !prev.some(
                        p => (p.bankId && p.bankId === vq.bankId) ||
                             (p.title && vq.title && p.title.trim().toLowerCase() === vq.title.trim().toLowerCase())
                    ));
                    return [...prev, ...uniqueNew];
                });
            } catch (error) {
                console.error('Error fetching question details:', error);
                showToast('Failed to load some question details');
            }
        };

        fetchQuestionDetails();
    };

    const convertISTToUTC = (dateTimeString) => {
        if (!dateTimeString) return null;
        const [datePart, timePart] = dateTimeString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');
        const istDateString = `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`;
        const date = new Date(istDateString);
        return date.toISOString();
    };

    const handleManualSubmit = async () => {
        if (questions.length === 0 && codingQuestions.length === 0) {
            showToast('Please add at least one question');
            return;
        }

        setIsUploading(true);

        try {
            const token = localStorage.getItem('adminToken');
            const questionData = questions.map(q => ({
                question_text: q.text,
                options: q.options,
                correctOption: q.correctOption,
                question: q.text,
                optiona: q.options[0],
                optionb: q.options[1],
                optionc: q.options[2],
                optiond: q.options[3],
                correct_option: String.fromCharCode(65 + q.correctOption),
                correctoption: String.fromCharCode(65 + q.correctOption),
                marks: q.marks || 1
            }));

            let response, data;

            if (isEditMode && uploadedTestId) {
                response = await apiFetch(`api/tests/${uploadedTestId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        testName: testTitle,
                        jobRoles: jobRoles,
                        duration: duration,
                        maxAttempts: maxAttempts,
                        passingPercentage: passingPercentage,
                        startDateTime: convertISTToUTC(startDateTime),
                        endDateTime: convertISTToUTC(endDateTime),
                        questions: questionData
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    if (ENABLE_CODE_EXECUTION) {
                        const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });

                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[UPDATE TEST] Failed to save coding questions:', codingData);
                            showToast('Test updated but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                    }

                    showToast('Test updated successfully!', 'success');
                    setViewMode(true);
                    setStep('init');
                    if (onSaved) onSaved();
                    if (onComplete) onComplete(data.test);
                } else {
                    showToast(data.message || 'Failed to update test');
                }
            } else {
                response = await apiFetch('api/upload/manual', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        testName: testTitle,
                        jobRoles: jobRoles,
                        duration: duration,
                        maxAttempts: maxAttempts,
                        passingPercentage: passingPercentage,
                        startDateTime: convertISTToUTC(startDateTime),
                        endDateTime: convertISTToUTC(endDateTime),
                        status: 'draft',
                        questions: questionData,
                        codingQuestionsCount: codingQuestions.length,
                        ...(clientId ? { client_id: clientId } : {})
                    })
                });

                data = await response.json();

                if (response.ok && data.success) {
                    const testId = data.testId;

                    if (ENABLE_CODE_EXECUTION) {
                        const codingResponse = await apiFetch(`api/coding-questions/test/${testId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });

                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[CREATE TEST] Failed to save coding questions:', codingData);
                            showToast('Test created but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                    }

                    setUploadedTestId(testId);
                    setUploadedTestName(testTitle);
                    if (onSaved) onSaved();
                    setStep('success');
                } else {
                    showToast(data.message || 'Failed to create test');
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            showToast('Failed to save test. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Mirrors the backend bulk-upload row parsing (routes/upload.js buildBulkQuestionInsert)
    const parseQuestionsFile = async (file) => {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = sheet ? XLSX.utils.sheet_to_json(sheet) : [];

        return rows
            .map((row, idx) => {
                const getVal = (...keys) => {
                    for (const key of keys) {
                        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
                        for (const k of Object.keys(row)) {
                            if (k.toLowerCase().replace(/\s+/g, '') === normalizedKey) return row[k];
                        }
                    }
                    return undefined;
                };

                const text = getVal('question');
                const options = [
                    getVal('optiona', 'option1'),
                    getVal('optionb', 'option2'),
                    getVal('optionc', 'option3'),
                    getVal('optiond', 'option4')
                ].map((opt) => (opt === undefined || opt === null ? '' : String(opt)));
                const rawCorrect = String(getVal('correctoption') ?? '').trim().toUpperCase();
                const correctOption = /^[1-4]$/.test(rawCorrect)
                    ? parseInt(rawCorrect, 10) - 1
                    : 'ABCD'.indexOf(rawCorrect.replace(/[^A-D]/g, '').charAt(0));

                if (!text || !options[0] || !options[1] || correctOption < 0) return null;

                return {
                    id: Date.now() + idx + Math.random(),
                    fromUpload: true,
                    text: String(text),
                    options,
                    correctOption,
                    marks: parseInt(getVal('marks'), 10) || 1,
                    format: 'paragraph'
                };
            })
            .filter(Boolean);
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isEditMode && questions.length > 0) {
            const confirmed = confirm(
                `⚠️ Warning: This will delete all ${questions.length} existing question${questions.length !== 1 ? 's' : ''} and replace them with the questions from the uploaded file.\n\nAre you sure you want to continue?`
            );
            if (!confirmed) {
                e.target.value = '';
                return;
            }
        }

        setIsUploading(true);

        try {
            const token = localStorage.getItem('adminToken');
            const cleanBaseUrl = import.meta.env.VITE_API_URL.endsWith('/')
                ? import.meta.env.VITE_API_URL.slice(0, -1)
                : import.meta.env.VITE_API_URL;

            if (isEditMode && uploadedTestId) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('testName', testTitle);
                formData.append('jobRoles', JSON.stringify(jobRoles));
                formData.append('testDescription', jobRoles[0]?.job_description || '');
                formData.append('duration', duration);
                formData.append('maxAttempts', maxAttempts);
                formData.append('passingPercentage', passingPercentage);
                formData.append('startDateTime', convertISTToUTC(startDateTime) || '');
                formData.append('endDateTime', convertISTToUTC(endDateTime) || '');
                formData.append('testId', uploadedTestId);
                if (clientId) formData.append('client_id', clientId);

                const response = await fetch(`${cleanBaseUrl}/api/upload/questions/${uploadedTestId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") === -1) {
                    throw new Error("Server returned HTML. The endpoint /api/upload/questions might be incorrect or missing on the backend.");
                }

                const data = await response.json();

                if (response.ok && data.success) {
                    if (ENABLE_CODE_EXECUTION) {
                        const codingResponse = await apiFetch(`api/coding-questions/test/${uploadedTestId}`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                codingQuestions: codingQuestions
                            })
                        });

                        const codingData = await codingResponse.json();
                        if (!codingResponse.ok || !codingData.success) {
                            console.error('[BULK UPLOAD EDIT] Failed to save coding questions:', codingData);
                            showToast('Questions uploaded but failed to save coding questions: ' + codingData.message);
                            setIsUploading(false);
                            return;
                        }
                    }

                    showToast(`Questions uploaded successfully! ${data.questionsCount} questions added. Click "Save Changes" to save.`, 'success');

                    const testResponse = await fetch(`${cleanBaseUrl}/api/tests/${uploadedTestId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const testData = await testResponse.json();
                    if (testResponse.ok && testData.success && testData.test.questions) {
                        const loadedQuestions = testData.test.questions.map((q, idx) => ({
                            id: q.id || Date.now() + idx,
                            text: q.question_text,
                            options: [q.option_a, q.option_b, q.option_c || '', q.option_d || ''],
                            correctOption: q.correct_option.charCodeAt(0) - 65
                        }));
                        setQuestions(loadedQuestions);
                    }
                    setStep('init');
                } else {
                    showToast(data.message || 'Failed to upload questions');
                }
            } else {
                // Create mode: parse the file locally and add its questions to the list.
                // The test itself is created later by the Save button (handleManualSubmit).
                const parsed = await parseQuestionsFile(file);

                if (parsed.length === 0) {
                    showToast('No valid questions found in the file. Each row needs Question, OptionA, OptionB and CorrectOption.');
                    return;
                }

                setQuestions((prev) => [...prev, ...parsed]);
                setStep('init');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast(error.message || 'Failed to upload test. Please try again.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await apiFetch(`api/tests/${uploadedTestId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'published' })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast(`Test "${uploadedTestName}" published successfully! Students can now see it.`, 'success');
                resetForm();
                if (onComplete) onComplete(data.test);
            } else {
                showToast(data.message || 'Failed to publish test');
            }
        } catch (error) {
            console.error('Publish error:', error);
            showToast('Failed to publish test. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    const resetForm = () => {
        setStep('init');
        setTestTitle('');
        setJobRoles([{
            job_role: defaultJobConfig.job_role,
            job_description: defaultJobConfig.job_description
        }]);
        setDuration(60);
        setMaxAttempts(1);
        setPassingPercentage(50);
        setStartDateTime('');
        setEndDateTime('');
        setQuestions([]);
        setCodingQuestions([]);
        setUploadedTestId(null);
        setUploadedTestName('');
    };

    const totalQuestionCount = questions.length + codingQuestions.length;
    const totalMarks =
        codingQuestions.reduce((sum, q) => sum + (Number(q.marks) || 10), 0) +
        questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const entryDisabled = !testTitle || nameAvailability.available === false || nameAvailability.checking;

    const sectionCardClass = 'bg-white border border-[#E3E2EE] rounded-xl p-6';
    const inputClass = (extra = '') =>
        `w-full h-11 px-3.5 border border-[#E3E2EE] rounded-lg text-sm text-shnoor-navy placeholder:text-shnoor-soft focus:outline-none focus:ring-2 focus:ring-shnoor-indigo/25 focus:border-shnoor-indigo transition-colors ${viewMode ? 'bg-[#F4F4F9] opacity-60 cursor-not-allowed' : 'bg-white'} ${extra}`;
    const labelClass = 'block text-xs font-semibold text-shnoor-navy mb-1.5';
    const iconBtnClass = 'w-9 h-9 flex items-center justify-center rounded-lg text-shnoor-navyLight hover:bg-shnoor-lavender hover:text-shnoor-indigo transition-colors';

    const renderCodingRow = (q) => {
        const testCaseCount = (q.publicTestCases?.length || 0) + (q.hiddenTestCases?.length || 0);
        const meta = [
            q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : null,
            `${q.marks || 10} marks`,
            `${testCaseCount} test case${testCaseCount !== 1 ? 's' : ''}`
        ].filter(Boolean).join(' · ');
        return (
            <div key={q.id} className="flex items-center justify-between gap-3 px-4 py-3 border border-[#E3E2EE] rounded-xl bg-white">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[10px] bg-shnoor-lavender flex items-center justify-center flex-shrink-0">
                        <Code className="w-[18px] h-[18px] text-shnoor-indigo" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-shnoor-navy truncate">{q.title}</h4>
                            <TypeBadge>Coding</TypeBadge>
                        </div>
                        <p className="text-xs text-shnoor-indigoMedium mt-0.5">{meta}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => handleViewCodingQuestion(q)} className={iconBtnClass} title="View question">
                        <Eye size={17} />
                    </button>
                    {!viewMode && (
                        <>
                            <button type="button" onClick={() => handleEditCodingQuestion(q)} className={iconBtnClass} title="Edit question">
                                <Pencil size={16} />
                            </button>
                            <button type="button" onClick={() => handleRemoveCodingQuestion(q.id)} className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-shnoor-dangerLight transition-colors" title="Delete question">
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderMcqRow = (q) => (
        <div key={q.id} className="flex items-center justify-between gap-3 px-4 py-3 border border-[#E3E2EE] rounded-xl bg-white">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-shnoor-lavender flex items-center justify-center flex-shrink-0">
                    <FileText className="w-[18px] h-[18px] text-shnoor-indigo" />
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-shnoor-navy line-clamp-1">{q.text}</h4>
                        <TypeBadge>MCQ</TypeBadge>
                    </div>
                    <p className="text-xs text-shnoor-indigoMedium mt-0.5">
                        {q.fromBank ? 'Question bank' : 'Manual entry'} · {q.marks || 1} marks
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => handleRemoveQuestion(q.id)} className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-shnoor-dangerLight transition-colors" title="Delete question">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Step 1: Initialization (stays mounted under the Manual Entry / Bulk Upload modals) */}
            {(step === 'init' || step === 'manual' || step === 'bulk') && (
                <div className="w-full max-w-[1280px] mx-auto bg-white border border-[#E3E2EE] rounded-2xl shadow-[0_8px_30px_rgba(14,14,39,0.06)]">
                    {/* Card header */}
                    <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-5 border-b border-[#E3E2EE]">
                        <div className="flex items-center gap-4 min-w-0">
                            {onBack && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center border border-[#E3E2EE] rounded-[10px] text-shnoor-indigo hover:bg-shnoor-lavender transition-colors"
                                    title={isEditMode ? 'Cancel Editing' : 'Back to Exams'}
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            )}
                            <div className="min-w-0">
                                <p className="text-xs text-shnoor-indigoMedium">Back to Exams</p>
                                <h2 className="text-xl sm:text-[26px] leading-tight font-bold text-shnoor-navy truncate">
                                    {isEditMode ? (viewMode ? 'View Assessment' : 'Edit Assessment') : 'Create New Assessment'}
                                </h2>
                            </div>
                        </div>
                        {viewMode && (
                            <button
                                type="button"
                                onClick={() => setViewMode(false)}
                                className="h-10 px-4 bg-shnoor-indigo text-white rounded-lg hover:bg-shnoor-navyLight transition-colors text-sm font-semibold flex items-center gap-2 flex-shrink-0"
                            >
                                <Pencil size={16} />
                                <span>Edit</span>
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-4 sm:p-8 space-y-5 bg-[#F4F4F9]/40">
                        {/* Basic Details */}
                        <section className={sectionCardClass}>
                            <SectionHeader title="Basic Details" description="Give the test a clear name students will recognise." />
                            <label className={labelClass}>Test Title <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={testTitle}
                                    onChange={(e) => setTestTitle(e.target.value)}
                                    disabled={viewMode}
                                    className={inputClass(`pr-10 ${!viewMode && nameAvailability.available === false
                                        ? '!border-red-400 !bg-red-50/40'
                                        : !viewMode && nameAvailability.available === true
                                            ? '!border-emerald-400'
                                            : ''}`)}
                                    placeholder="e.g., Java Fundamentals - Batch A"
                                    required
                                />
                                {nameAvailability.checking && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 text-shnoor-indigoMedium animate-spin" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === true && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    </div>
                                )}
                                {!nameAvailability.checking && nameAvailability.available === false && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    </div>
                                )}
                            </div>
                            {nameAvailability.message && (
                                <p className={`mt-2 text-xs font-medium ${nameAvailability.available ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {nameAvailability.message}
                                </p>
                            )}
                        </section>

                        {/* Job Roles */}
                        <section className={sectionCardClass}>
                            <SectionHeader
                                title="Job Roles"
                                description="Students pick a role and read its description before taking the test."
                                action={!viewMode && (
                                    <button
                                        type="button"
                                        onClick={handleAddJobRole}
                                        className="h-9 px-3.5 flex items-center gap-1.5 border border-[#E3E2EE] rounded-lg bg-white text-shnoor-indigo hover:bg-shnoor-lavender text-sm font-semibold transition-colors flex-shrink-0"
                                    >
                                        <Plus size={15} />
                                        <span>Add Role</span>
                                    </button>
                                )}
                            />
                            <div className="space-y-4">
                                {jobRoles.map((role, index) => (
                                    <div key={index} className="p-4 bg-[#F8F8FC] border border-[#E3E2EE] rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-shnoor-navy">Role {index + 1}</span>
                                                {index === 0 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-shnoor-lavender text-shnoor-indigo text-[11px] font-semibold">Default</span>
                                                )}
                                            </div>
                                            {!viewMode && jobRoles.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveJobRole(index)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-shnoor-dangerLight transition-colors"
                                                    title="Remove this role"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={role.job_role}
                                            onChange={(e) => handleJobRoleChange(index, 'job_role', e.target.value)}
                                            disabled={viewMode}
                                            className={inputClass()}
                                            placeholder="e.g., Senior Software Engineer, Junior Developer"
                                        />
                                        <textarea
                                            value={role.job_description}
                                            onChange={(e) => handleJobRoleChange(index, 'job_description', e.target.value)}
                                            rows={4}
                                            disabled={viewMode}
                                            className={inputClass('!h-auto py-2.5 resize-y leading-relaxed')}
                                            placeholder="Enter job description, requirements, responsibilities..."
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Test Settings */}
                        <section className={sectionCardClass}>
                            <SectionHeader title="Test Settings" description="Timing, attempts and the pass mark." />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_1.35fr_1.35fr] gap-4">
                                <div>
                                    <label className={labelClass}>Duration <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                                            min="1"
                                            disabled={viewMode}
                                            className={inputClass('pr-12')}
                                            required
                                        />
                                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-shnoor-indigoMedium pointer-events-none">min</span>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Max Attempts <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={maxAttempts}
                                        onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                                        min="1"
                                        disabled={viewMode}
                                        className={inputClass()}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Passing <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={passingPercentage}
                                            onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 50)}
                                            disabled={viewMode}
                                            className={inputClass('pr-10')}
                                            min="0"
                                            max="100"
                                            required
                                        />
                                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-shnoor-indigoMedium pointer-events-none">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Start date &amp; time <span className="font-normal text-shnoor-indigoMedium">(optional)</span></label>
                                    <input
                                        type="datetime-local"
                                        value={startDateTime}
                                        onChange={(e) => setStartDateTime(e.target.value)}
                                        disabled={viewMode}
                                        className={inputClass()}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>End date &amp; time <span className="font-normal text-shnoor-indigoMedium">(optional)</span></label>
                                    <input
                                        type="datetime-local"
                                        value={endDateTime}
                                        onChange={(e) => setEndDateTime(e.target.value)}
                                        disabled={viewMode}
                                        className={inputClass()}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Add Questions */}
                        {!viewMode && (
                            <section className={sectionCardClass}>
                                <SectionHeader title="Add Questions" description="Use any mix of these. At least one question is required." />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <AddQuestionCard
                                        icon={Code}
                                        title="Create Coding Question"
                                        description="Write a new problem with its own test cases."
                                        onClick={() => {
                                            setEditingCodingQuestionId(null);
                                            setCurrentCodingQuestion({
                                                title: '',
                                                description: '',
                                                publicTestCases: [{ input: '', output: '', explanation: '' }],
                                                hiddenTestCases: [{ input: '', output: '' }],
                                                timeLimit: 2,
                                                memoryLimit: 256,
                                                marks: 10
                                            });
                                            setShowCodingModal(true);
                                        }}
                                    />
                                    <AddQuestionCard
                                        icon={List}
                                        title="Select from Question Bank"
                                        description="Pick from questions recommended for this role."
                                        onClick={() => setShowCodingSelector(true)}
                                    />
                                    {isEditMode ? (
                                        <>
                                            <AddQuestionCard
                                                icon={FileText}
                                                title="Edit Questions Manually"
                                                description={`Edit, add or remove questions individually (${questions.length} loaded).`}
                                                onClick={() => handleStart('manual')}
                                            />
                                            <AddQuestionCard
                                                icon={Upload}
                                                title="Upload New Questions File"
                                                description={`Replaces all ${questions.length} existing question${questions.length !== 1 ? 's' : ''} with a new CSV/Excel file.`}
                                                onClick={() => handleStart('bulk')}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <AddQuestionCard
                                                icon={Plus}
                                                title="Manual Entry"
                                                description="Add questions one by one with a simple form."
                                                onClick={() => handleStart('manual')}
                                                disabled={entryDisabled}
                                            />
                                            <AddQuestionCard
                                                icon={Upload}
                                                title="Bulk Upload"
                                                description="Upload an Excel or CSV file of questions."
                                                onClick={() => handleStart('bulk')}
                                                disabled={entryDisabled}
                                            />
                                        </>
                                    )}
                                </div>

                                {isEditMode && (
                                    <div className="mt-4 bg-shnoor-warningLight rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-semibold mb-1">Important:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Review test details above before proceeding</li>
                                                <li>Uploading a new file will <strong>delete all existing questions</strong></li>
                                                <li>Changes will be saved when you click "Save Changes"</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Questions */}
                        {isEditMode ? (
                            <section className={sectionCardClass}>
                                <SectionHeader
                                    title={`Questions (${questions.length + codingQuestions.length})`}
                                    description={viewMode ? 'Questions currently loaded for this test.' : 'Choose how you want to update the questions for this test.'}
                                />
                                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                                    <div className="flex items-center gap-3 px-4 py-3 border border-[#E3E2EE] rounded-xl bg-[#F8F8FC]">
                                        <div className="w-10 h-10 rounded-[10px] bg-shnoor-lavender flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-[18px] h-[18px] text-shnoor-indigo" />
                                        </div>
                                        <p className="text-sm font-semibold text-shnoor-navy">
                                            {questions.length} question{questions.length !== 1 ? 's' : ''} loaded
                                        </p>
                                    </div>
                                    {codingQuestions.map(renderCodingRow)}
                                </div>
                            </section>
                        ) : (
                            <section className={sectionCardClass}>
                                <SectionHeader
                                    title={`Questions (${totalQuestionCount})`}
                                    description="Everything added to this test."
                                    action={totalQuestionCount > 0 && (
                                        <span className="px-3 py-1 rounded-full bg-shnoor-lavender text-shnoor-indigo text-xs font-semibold whitespace-nowrap flex-shrink-0">
                                            {totalMarks} marks
                                        </span>
                                    )}
                                />
                                {totalQuestionCount === 0 ? (
                                    <div className="text-center py-8 text-shnoor-indigoMedium border border-dashed border-shnoor-mist rounded-xl">
                                        <FileText className="mx-auto h-9 w-9 mb-2 opacity-50" />
                                        <p className="text-sm">No questions added yet</p>
                                    </div>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                                        {codingQuestions.map(renderCodingRow)}
                                        {questions.map(renderMcqRow)}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Footer */}
                    {!viewMode && (
                        <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-8 py-4 border-t border-[#E3E2EE] bg-[#FAFAFD] rounded-b-2xl">
                            <p className="text-[13px] text-shnoor-indigoMedium">
                                {isEditMode ? 'Changes will be saved to this assessment.' : 'Your test will be saved as a draft. You can publish it on the next step.'}
                            </p>
                            {isEditMode ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode(true)}
                                        disabled={isUploading}
                                        className="h-11 px-5 border border-[#E3E2EE] bg-white text-shnoor-navy hover:bg-shnoor-lavender rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleManualSubmit}
                                        disabled={isUploading}
                                        className="h-11 px-5 bg-shnoor-indigo hover:bg-shnoor-navyLight text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={17} />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleManualSubmit}
                                    disabled={totalQuestionCount === 0 || isUploading || !testTitle.trim() || nameAvailability.available === false}
                                    className="h-11 px-5 bg-shnoor-indigo hover:bg-shnoor-navyLight text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Save size={17} />
                                            <span>Save ({totalQuestionCount} Questions)</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Publish step keeps its original back button */}
            {step === 'success' && onBack && (
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="btn-secondary" title={isEditMode ? 'Cancel Editing' : 'Back to Exams'}>
                        <ArrowLeft size={16} />
                        <span>Back to Exams</span>
                    </button>
                </div>
            )}

            {/* Manual Entry Modal */}
            {step === 'manual' && (
                <ModalShell
                    icon={Pencil}
                    title={testTitle}
                    titleAddon={
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-shnoor-lavender text-shnoor-indigo text-xs font-medium whitespace-nowrap flex-shrink-0">
                            <span className="font-semibold">{questions.length}</span> Questions Added
                        </span>
                    }
                    subtitle="Adding questions manually"
                    onClose={() => setStep('init')}
                    size="lg"
                    fullHeight
                    bodyClassName="lg:grid lg:grid-cols-5 lg:grid-rows-1 lg:overflow-hidden"
                    footerStart={`${questions.length} question${questions.length !== 1 ? 's' : ''} added`}
                    footerActions={
                        <>
                            <ModalButton
                                variant="outline"
                                onClick={isEditMode ? () => {
                                    setStep('init');
                                    setViewMode(true);
                                } : () => setStep('init')}
                                disabled={isUploading}
                            >
                                Cancel
                            </ModalButton>
                            <ModalButton
                                icon={Save}
                                loading={isUploading}
                                // Create mode: return to the Create New Assessment page; the test is saved from there
                                onClick={isEditMode ? handleManualSubmit : () => setStep('init')}
                                disabled={questions.length === 0}
                            >
                                {isEditMode ? 'Save Changes' : 'Save'} ({questions.length} Questions)
                            </ModalButton>
                        </>
                    }
                >
                    {/* Form Side */}
                    <div className="lg:col-span-3 lg:overflow-y-auto p-6 space-y-5">
                        <div className="inline-flex rounded-lg bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => setQuestionInputMode('type')}
                                className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                                    questionInputMode === 'type'
                                        ? 'bg-white text-shnoor-indigo shadow-sm'
                                        : 'text-gray-600 hover:text-shnoor-navy'
                                }`}
                            >
                                <FileText size={14} />
                                Type Manually
                            </button>
                            <button
                                type="button"
                                onClick={() => setQuestionInputMode('bank')}
                                className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                                    questionInputMode === 'bank'
                                        ? 'bg-white text-shnoor-indigo shadow-sm'
                                        : 'text-gray-600 hover:text-shnoor-navy'
                                }`}
                            >
                                <List size={14} />
                                From Question Bank
                            </button>
                        </div>

                        {questionInputMode === 'bank' ? (
                            <MCQBankSelector
                                key={bankSelectorKey}
                                variant="inline"
                                onSelect={handleSelectMcqFromBank}
                                selectedQuestionIds={questions.filter((q) => q.bankId).map((q) => q.bankId)}
                                selectedRoles={jobRoles}
                            />
                        ) : (
                        <>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <FieldLabel className="mb-0">Question Text</FieldLabel>
                                <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'paragraph' })}
                                        className={`h-7 w-8 flex items-center justify-center rounded-md transition-colors ${currentQuestion.format === 'paragraph'
                                            ? 'bg-white text-shnoor-indigo shadow-sm'
                                            : 'text-gray-500 hover:text-shnoor-navy'
                                            }`}
                                        title="Paragraph format (Markdown supported)"
                                    >
                                        <AlignLeft size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'line' })}
                                        className={`h-7 w-8 flex items-center justify-center rounded-md transition-colors ${currentQuestion.format === 'line'
                                            ? 'bg-white text-shnoor-indigo shadow-sm'
                                            : 'text-gray-500 hover:text-shnoor-navy'
                                            }`}
                                        title="Line format (preserves line breaks)"
                                    >
                                        <List size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentQuestion({ ...currentQuestion, format: 'code' })}
                                        className={`h-7 w-8 flex items-center justify-center rounded-md transition-colors ${currentQuestion.format === 'code'
                                            ? 'bg-white text-shnoor-indigo shadow-sm'
                                            : 'text-gray-500 hover:text-shnoor-navy'
                                            }`}
                                        title="Code format (monospace, syntax highlighting)"
                                    >
                                        <Code size={15} />
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={currentQuestion.text}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                rows={5}
                                className={`${modalTextareaClass} ${currentQuestion.format === 'code' ? 'font-mono' : ''}`}
                                placeholder="Enter Question here"
                                style={{ whiteSpace: 'pre-wrap' }}
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                                {currentQuestion.format === 'paragraph' && 'Paragraph: supports Markdown formatting (**bold**, *italic*, `code`, lists)'}
                                {currentQuestion.format === 'line' && 'Line: preserves line breaks and spacing'}
                                {currentQuestion.format === 'code' && 'Code: monospace font with syntax highlighting'}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <FieldLabel className="mb-0">Options</FieldLabel>
                                <span className="text-xs text-gray-500">Mark the correct answer</span>
                            </div>
                            <div className="space-y-2">
                                {currentQuestion.options.map((opt, idx) => {
                                    const isCorrect = currentQuestion.correctOption === idx;
                                    return (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOptions = [...currentQuestion.options];
                                                    newOptions[idx] = e.target.value;
                                                    setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                                }}
                                                className={`${modalInputClass} flex-1 ${isCorrect ? '!border-green-500 focus:!ring-green-500/20' : ''}`}
                                                placeholder={`Option ${idx + 1}`}
                                            />
                                            <label
                                                className={`h-10 px-3 rounded-lg border inline-flex items-center gap-2 text-[13px] font-medium cursor-pointer flex-shrink-0 transition-colors ${
                                                    isCorrect
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-shnoor-mist text-gray-500 hover:border-shnoor-light hover:text-shnoor-navy'
                                                }`}
                                                title="Mark as correct answer"
                                            >
                                                <input
                                                    type="radio"
                                                    name="manual-correct-option"
                                                    checked={isCorrect}
                                                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctOption: idx })}
                                                    className="accent-green-600"
                                                />
                                                Correct
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <ModalButton variant="secondary" icon={Plus} onClick={handleAddQuestion}>
                                Add Question to Test
                            </ModalButton>
                        </div>
                        </>
                        )}
                    </div>

                    {/* Preview Side */}
                    <div className="lg:col-span-2 lg:overflow-y-auto bg-gray-50 border-t lg:border-t-0 lg:border-l border-shnoor-mist p-6">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-shnoor-navy">Added Questions</h4>
                            <span className="text-xs text-gray-500">{questions.length}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Remove any with the trash icon before saving the test.</p>
                        {questions.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-10 h-10 rounded-xl bg-white border border-shnoor-mist text-gray-400 flex items-center justify-center mx-auto mb-3">
                                    <FileText size={18} />
                                </div>
                                <p className="text-sm font-medium text-shnoor-navy">No questions yet</p>
                                <p className="text-xs text-gray-500 mt-1">Questions you add will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white p-3 rounded-xl border border-shnoor-mist">
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="font-semibold text-[11px] text-shnoor-indigo bg-shnoor-lavender px-2 py-0.5 rounded-md">Q{idx + 1}</span>
                                                {q.fromBank && (
                                                    <span className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">Bank</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveQuestion(q.id)}
                                                className="p-1.5 -m-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                                                title="Remove question"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <p className="text-[13px] font-medium text-shnoor-navy mb-2 line-clamp-2">{q.text}</p>
                                        <div className="space-y-1">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${q.correctOption === i ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600'}`}>
                                                    <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                                                    <span className="truncate">{opt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ModalShell>
            )}

            {/* Bulk Upload Modal */}
            {step === 'bulk' && (
                <BulkUploadModal
                    testTitle={testTitle}
                    isUploading={isUploading}
                    onUpload={handleBulkUpload}
                    onClose={() => setStep('init')}
                />
            )}

            {/* Step 3: Success Screen */}
            {step === 'success' && (
                <TestSuccessStep
                    uploadedTestName={uploadedTestName}
                    handlePublish={handlePublish}
                    isPublishing={isPublishing}
                    resetForm={resetForm}
                    onComplete={onComplete}
                />
            )}

            {/* Coding Question Creation/Edit Modal */}
            {showCodingModal && (
                <CodingQuestionModal
                    editingCodingQuestionId={editingCodingQuestionId}
                    currentCodingQuestion={currentCodingQuestion}
                    setCurrentCodingQuestion={setCurrentCodingQuestion}
                    handleAddPublicTestCase={handleAddPublicTestCase}
                    handleRemovePublicTestCase={handleRemovePublicTestCase}
                    handleAddHiddenTestCase={handleAddHiddenTestCase}
                    handleRemoveHiddenTestCase={handleRemoveHiddenTestCase}
                    handleSaveCodingQuestion={handleSaveCodingQuestion}
                    onClose={() => setShowCodingModal(false)}
                />
            )}

            {/* Coding Question View Modal */}
            {showCodingViewModal && viewingCodingQuestion && (
                <CodingViewModal
                    viewingCodingQuestion={viewingCodingQuestion}
                    onClose={() => setShowCodingViewModal(false)}
                />
            )}

            {/* Coding Question Selector Modal */}
            {showCodingSelector && (
                <CodingQuestionSelector
                    onClose={() => setShowCodingSelector(false)}
                    onSelect={handleSelectFromBank}
                    selectedQuestionIds={codingQuestions.filter(q => q.bankId).map(q => q.bankId)}
                    selectedRoles={jobRoles}
                />
            )}
        </div>
    );
};

export default CreateTestSection;
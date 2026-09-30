import { useState, useEffect } from 'react';
import { apiFetch } from '../../config/api';
import CodingQuestionSelector from './CodingQuestionSelector';
import TestInitStep from './TestInitStep';
import TestManualStep from './TestManualStep';
import TestBulkStep from './TestBulkStep';
import TestSuccessStep from './TestSuccessStep';
import CodingQuestionModal from './CodingQuestionModal';
import CodingViewModal from './CodingViewModal';

const ENABLE_CODE_EXECUTION = true;

const CreateTestSection = ({ onComplete, onSaved, editingTest, clientId }) => {
    const FALLBACK_DEFAULT_JOB_ROLE = 'General Assessment Candidate';
    const FALLBACK_DEFAULT_JOB_DESCRIPTION = 'This assessment evaluates candidate readiness across core technical and problem-solving skills relevant to the role.';
    const [step, setStep] = useState('init'); // init, manual, bulk, success\n
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        alert(msg);
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
            showToast(`Added ${converted.length} question(s) to the list. ${selectedBankQuestions.length - converted.length} duplicate(s) skipped.`);
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
            showToast(`${selectedQuestions.length - newSelections.length} duplicate question(s) were skipped.`);
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

                    showToast('Test updated successfully!');
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

                    showToast(`Questions uploaded successfully! ${data.questionsCount} questions added. Click "Save Changes" to save.`);

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
                formData.append('status', 'draft');
                if (clientId) formData.append('client_id', clientId);

                const response = await fetch(`${cleanBaseUrl}/api/upload/questions`, {
                    method: 'POST',
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
                    setStep('success');
                } else {
                    showToast(data.message || 'Failed to upload test');
                }
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
                showToast(`Test "${uploadedTestName}" published successfully! Students can now see it.`);
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

    return (
        <div className="space-y-6">
            {/* Step 1: Initialization / Overview */}
            {step === 'init' && (
                <TestInitStep
                    isEditMode={isEditMode}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    testTitle={testTitle}
                    setTestTitle={setTestTitle}
                    nameAvailability={nameAvailability}
                    jobRoles={jobRoles}
                    handleAddJobRole={handleAddJobRole}
                    handleRemoveJobRole={handleRemoveJobRole}
                    handleJobRoleChange={handleJobRoleChange}
                    duration={duration}
                    setDuration={setDuration}
                    maxAttempts={maxAttempts}
                    setMaxAttempts={setMaxAttempts}
                    passingPercentage={passingPercentage}
                    setPassingPercentage={setPassingPercentage}
                    startDateTime={startDateTime}
                    setStartDateTime={setStartDateTime}
                    endDateTime={endDateTime}
                    setEndDateTime={setEndDateTime}
                    setEditingCodingQuestionId={setEditingCodingQuestionId}
                    setCurrentCodingQuestion={setCurrentCodingQuestion}
                    setShowCodingModal={setShowCodingModal}
                    setShowCodingSelector={setShowCodingSelector}
                    codingQuestions={codingQuestions}
                    handleViewCodingQuestion={handleViewCodingQuestion}
                    handleEditCodingQuestion={handleEditCodingQuestion}
                    handleRemoveCodingQuestion={handleRemoveCodingQuestion}
                    questions={questions}
                    handleStart={handleStart}
                    handleManualSubmit={handleManualSubmit}
                    isUploading={isUploading}
                />
            )}

            {/* Step 2: Manual Entry */}
            {step === 'manual' && (
                <TestManualStep
                    testTitle={testTitle}
                    setStep={setStep}
                    questions={questions}
                    questionInputMode={questionInputMode}
                    setQuestionInputMode={setQuestionInputMode}
                    bankSelectorKey={bankSelectorKey}
                    handleSelectMcqFromBank={handleSelectMcqFromBank}
                    jobRoles={jobRoles}
                    currentQuestion={currentQuestion}
                    setCurrentQuestion={setCurrentQuestion}
                    handleAddQuestion={handleAddQuestion}
                    handleManualSubmit={handleManualSubmit}
                    isUploading={isUploading}
                    isEditMode={isEditMode}
                    setViewMode={setViewMode}
                    handleRemoveQuestion={handleRemoveQuestion}
                />
            )}

            {/* Step 2: Bulk Upload */}
            {step === 'bulk' && (
                <TestBulkStep
                    testTitle={testTitle}
                    setStep={setStep}
                    isUploading={isUploading}
                    handleBulkUpload={handleBulkUpload}
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